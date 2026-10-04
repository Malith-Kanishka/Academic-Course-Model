namespace ACM.Backend.Services;

using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class ApprovalService : IApprovalService
{
    private readonly ACMDbContext _context;

    public ApprovalService(ACMDbContext context)
    {
        _context = context;
    }

    public async Task<MasteryReport> ProcessSessionEvaluationAsync(SessionFinalTranscriptDTO dto)
    {
        var report = new MasteryReport
        {
            SessionId = dto.SessionId,
            StudentId = dto.StudentId,
            TopicName = dto.TopicName,
            MasteryScore = dto.FinalScore,
            FlaggedMisconceptions = dto.FlaggedMisconceptions
        };

        // Deterministic Business Rule: Mastery Score < 65% triggers mandatory Human-in-the-Loop approval
        bool requiresApproval = dto.FinalScore < 65 || dto.FlaggedMisconceptions.Any();

        var plan = new RemedialPlan
        {
            SessionId = dto.SessionId,
            MasteryReportId = report.Id,
            StudentId = dto.StudentId,
            ApprovalStatus = requiresApproval ? "PAUSED_FOR_PROFESSOR_APPROVAL" : "APPROVED_ACTIVE",
            ApprovedAt = requiresApproval ? null : DateTime.UtcNow,
            ActionItems = dto.FlaggedMisconceptions
                .Select(m => $"Review concept: {m}")
                .ToList()
        };

        report.RemedialPlan = plan;
        _context.MasteryReports.Add(report);
        _context.RemedialPlans.Add(plan);

        // Log agent evaluation audit trail
        _context.AgentAuditLogs.Add(new AgentAuditLog
        {
            SessionId = dto.SessionId,
            AgentName = "SafetyEvaluatorAgent",
            InputPayloadJson = $"{{ \"score\": {dto.FinalScore} }}",
            OutputPayloadJson = $"{{ \"status\": \"{plan.ApprovalStatus}\" }}",
            TriggeredHumanInLoop = requiresApproval
        });

        await _context.SaveChangesAsync();
        return report;
    }

    public async Task<IEnumerable<RemedialPlan>> GetPendingApprovalsAsync()
    {
        return await _context.RemedialPlans
            .AsNoTracking()
            .Include(plan => plan.Student)
            .Include(plan => plan.MasteryReport)
            .Where(plan => plan.ApprovalStatus == "PAUSED_FOR_PROFESSOR_APPROVAL")
            .ToListAsync();
    }

    public async Task<IEnumerable<ApprovalLog>> GetApprovalHistoryAsync()
    {
        return await _context.ApprovalLogs
            .AsNoTracking()
            .Include(log => log.Plan)
                .ThenInclude(plan => plan!.Student)
            .Include(log => log.Plan)
                .ThenInclude(plan => plan!.MasteryReport)
            .OrderByDescending(log => log.Timestamp)
            .ToListAsync();
    }

    /// <summary>Gets active remedial plans belonging to the specified student.</summary>
    public async Task<IEnumerable<RemedialPlan>> GetActivePlansForStudentAsync(Guid studentId)
    {
        return await _context.RemedialPlans
            .Where(plan => plan.StudentId == studentId
                && plan.ApprovalStatus == "APPROVED_ACTIVE"
                && plan.ApprovedAt.HasValue
                && plan.ApprovedAt.Value >= DateTime.UtcNow.AddDays(-7))
            .OrderByDescending(plan => plan.ApprovedAt)
            .ToListAsync();
    }

    public Task<string?> GetStudentEmailAsync(Guid studentId)
    {
        return _context.Users
            .AsNoTracking()
            .Where(user => user.Id == studentId)
            .Select(user => user.Email)
            .FirstOrDefaultAsync();
    }

    public async Task<RemedialPlan?> SubmitProfessorDecisionAsync(
        Guid planId,
        string status,
        string? notes,
        string? editedPlanSummary)
    {
        var plan = await _context.RemedialPlans
            .FirstOrDefaultAsync(p => p.Id == planId);
        if (plan == null) return null;

        plan.ApprovalStatus = status; // Expected: "APPROVED_ACTIVE" or "REJECTED"
        plan.ProfessorNotes = notes;
        if (editedPlanSummary is not null)
        {
            plan.ActionItems = editedPlanSummary
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();
        }
        plan.ApprovedAt = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;
        _context.ApprovalLogs.Add(new ApprovalLog
        {
            PlanId = plan.Id,
            Decision = status,
            ProfessorFeedback = notes
        });

        await _context.SaveChangesAsync();
        return plan;
    }
}