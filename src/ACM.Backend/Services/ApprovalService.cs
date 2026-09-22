namespace ACM.Backend.Services;

using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;

public class ApprovalService : IApprovalService
{
    // Temporary in-memory stores for isolated testing before DbContext is wired
    private readonly List<MasteryReport> _reports = new();
    private readonly List<RemedialPlan> _plans = new();
    private readonly List<AgentAuditLog> _auditLogs = new();

    public Task<MasteryReport> ProcessSessionEvaluationAsync(SessionFinalTranscriptDTO dto)
    {
        var report = new MasteryReport
        {
            SessionId = dto.SessionId,
            StudentId = dto.StudentId,
            TopicName = dto.TopicName,
            MasteryScore = dto.FinalScore,
            FlaggedMisconceptions = dto.FlaggedMisconceptions
        };

        _reports.Add(report);

        // Deterministic Business Rule: Mastery Score < 65% triggers mandatory Human-in-the-Loop approval
        bool requiresApproval = dto.FinalScore < 65 || dto.FlaggedMisconceptions.Any();

        var plan = new RemedialPlan
        {
            MasteryReportId = report.Id,
            StudentId = dto.StudentId,
            ApprovalStatus = requiresApproval ? "PAUSED_FOR_PROFESSOR_APPROVAL" : "APPROVED_ACTIVE",
            ActionItems = dto.FlaggedMisconceptions
                .Select(m => $"Review concept: {m}")
                .ToList()
        };

        _plans.Add(plan);
        report.RemedialPlan = plan;

        // Log agent evaluation audit trail
        _auditLogs.Add(new AgentAuditLog
        {
            SessionId = dto.SessionId,
            AgentName = "SafetyEvaluatorAgent",
            InputPayloadJson = $"{{ \"score\": {dto.FinalScore} }}",
            OutputPayloadJson = $"{{ \"status\": \"{plan.ApprovalStatus}\" }}",
            TriggeredHumanInLoop = requiresApproval
        });

        return Task.FromResult(report);
    }

    public Task<IEnumerable<RemedialPlan>> GetPendingApprovalsAsync()
    {
        var pending = _plans.Where(p => p.ApprovalStatus == "PAUSED_FOR_PROFESSOR_APPROVAL");
        return Task.FromResult<IEnumerable<RemedialPlan>>(pending);
    }

    public Task<RemedialPlan?> SubmitProfessorDecisionAsync(Guid planId, string status, string? notes)
    {
        var plan = _plans.FirstOrDefault(p => p.Id == planId);
        if (plan == null) return Task.FromResult<RemedialPlan?>(null);

        plan.ApprovalStatus = status; // Expected: "APPROVED_ACTIVE" or "REJECTED"
        plan.ProfessorNotes = notes;
        plan.ApprovedAt = DateTime.UtcNow;

        return Task.FromResult<RemedialPlan?>(plan);
    }
}