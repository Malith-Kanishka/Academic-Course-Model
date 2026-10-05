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
        var topicName = dto.TopicName?.Trim();
        var expectedStandard = dto.ExpectedStandard?.Trim();
        if (string.IsNullOrWhiteSpace(expectedStandard))
        {
            var session = await _context.StudySessions
                .AsNoTracking()
                .Include(item => item.Topic)
                    .ThenInclude(topic => topic!.Module)
                .FirstOrDefaultAsync(item => item.Id == dto.SessionId);

            topicName = session?.Topic?.Title?.Trim()
                ?? session?.Topic?.Module?.Title?.Trim()
                ?? topicName;
            expectedStandard = session?.Topic?.ContentDescription?.Trim();
            if (string.IsNullOrWhiteSpace(expectedStandard))
                expectedStandard = session?.Topic?.Module?.Description?.Trim();
        }

        if (string.IsNullOrWhiteSpace(topicName))
            topicName = "General Topic";
        if (string.IsNullOrWhiteSpace(expectedStandard))
            expectedStandard = $"Demonstrate core conceptual mastery and provide complete explanations for {topicName}.";

        var report = new MasteryReport
        {
            SessionId = dto.SessionId,
            StudentId = dto.StudentId,
            TopicName = topicName,
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
            StudentSubmission = dto.StudentSubmission,
            ExpectedStandard = expectedStandard,
            ActionItems = dto.RemedialActionItems.Count > 0
                ? dto.RemedialActionItems
                : dto.FlaggedMisconceptions.Select(m => $"Review concept: {m}").ToList()
        };
        SanitizeActionItems(new[] { plan });

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
        var plans = await _context.RemedialPlans
            .AsNoTracking()
            .Include(plan => plan.Student)
            .Include(plan => plan.MasteryReport)
            .Where(plan => plan.ApprovalStatus == "PAUSED_FOR_PROFESSOR_APPROVAL")
            .ToListAsync();

        await LoadSessionTopicsAsync(plans);
        SanitizeExpectedStandards(plans);
        SanitizeActionItems(plans);
        return plans;
    }

    public async Task<IEnumerable<ApprovalLog>> GetApprovalHistoryAsync()
    {
        var history = await _context.ApprovalLogs
            .AsNoTracking()
            .Include(log => log.Plan)
                .ThenInclude(plan => plan!.Student)
            .Include(log => log.Plan)
                .ThenInclude(plan => plan!.MasteryReport)
            .OrderByDescending(log => log.Timestamp)
            .ToListAsync();

        var plans = history
            .Where(log => log.Plan is not null)
            .Select(log => log.Plan!)
            .ToList();
        await LoadSessionTopicsAsync(plans);
        SanitizeExpectedStandards(plans);
        SanitizeActionItems(plans);
        return history;
    }

    private static void SanitizeActionItems(IEnumerable<RemedialPlan> plans)
    {
        foreach (var plan in plans)
        {
            var topicName = plan.Session?.Topic?.Title?.Trim();
            if (string.IsNullOrWhiteSpace(topicName))
                topicName = plan.MasteryReport?.TopicName?.Trim();

            plan.ActionItems = (plan.ActionItems ?? new List<string>())
                .Select(item => RemedialPlanDto.SanitizeActionItem(item, topicName))
                .ToList();
        }
    }

    private static void SanitizeExpectedStandards(IEnumerable<RemedialPlan> plans)
    {
        foreach (var plan in plans)
        {
            if (!plan.ExpectedStandard.Contains("topictopic", StringComparison.OrdinalIgnoreCase)
                && !plan.ExpectedStandard.Contains("modulemodule", StringComparison.OrdinalIgnoreCase))
                continue;

            var topicName = plan.Session?.Topic?.Title?.Trim();
            if (string.IsNullOrWhiteSpace(topicName))
                topicName = plan.MasteryReport?.TopicName?.Trim();
            if (string.IsNullOrWhiteSpace(topicName))
                topicName = "this topic";

            plan.ExpectedStandard = $"Demonstrate core conceptual mastery and provide complete explanations for {topicName}.";
        }
    }

    public async Task<bool> DeleteRemedialPlanAsync(Guid planId)
    {
        var plan = await _context.RemedialPlans
            .Include(item => item.ApprovalLogs)
            .FirstOrDefaultAsync(item => item.Id == planId);
        if (plan is null) return false;

        _context.ApprovalLogs.RemoveRange(plan.ApprovalLogs);
        _context.RemedialPlans.Remove(plan);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task LoadSessionTopicsAsync(IEnumerable<RemedialPlan> plans)
    {
        var planList = plans.ToList();
        var sessionIds = planList.Select(plan => plan.SessionId).Distinct().ToList();
        if (sessionIds.Count == 0) return;

        var sessions = await _context.StudySessions
            .AsNoTracking()
            .Include(session => session.Topic)
                .ThenInclude(topic => topic!.Module)
            .Where(session => sessionIds.Contains(session.Id))
            .ToDictionaryAsync(session => session.Id);

        foreach (var plan in planList)
        {
            if (sessions.TryGetValue(plan.SessionId, out var session))
                plan.Session = session;
        }
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
            .Include(item => item.MasteryReport)
            .FirstOrDefaultAsync(p => p.Id == planId);
        if (plan == null) return null;

        plan.ApprovalStatus = status; // Expected: "APPROVED_ACTIVE" or "REJECTED"
        plan.ProfessorNotes = notes;
        if (editedPlanSummary is not null)
        {
            plan.ActionItems = editedPlanSummary
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(item => RemedialPlanDto.SanitizeActionItem(item, plan.MasteryReport?.TopicName))
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