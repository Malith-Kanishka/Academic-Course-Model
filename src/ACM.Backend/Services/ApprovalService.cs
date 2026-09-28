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
            .Include(plan => plan.MasteryReport)
            .Where(plan => plan.ApprovalStatus == "PAUSED_FOR_PROFESSOR_APPROVAL")
            .ToListAsync();
    }

    public async Task<RemedialPlan?> SubmitProfessorDecisionAsync(Guid planId, string status, string? notes)
    {
        var plan = await _context.RemedialPlans
            .FirstOrDefaultAsync(p => p.Id == planId);
        if (plan == null) return null;

        plan.ApprovalStatus = status; // Expected: "APPROVED_ACTIVE" or "REJECTED"
        plan.ProfessorNotes = notes;
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