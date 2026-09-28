namespace ACM.Backend.Core.Entities;

public class ApprovalLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanId { get; set; }
    public string Decision { get; set; } = string.Empty;
    public string? ProfessorFeedback { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public RemedialPlan? Plan { get; set; }
}
