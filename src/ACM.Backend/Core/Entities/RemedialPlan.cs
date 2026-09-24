namespace ACM.Backend.Core.Entities;

public class RemedialPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public Guid MasteryReportId { get; set; }
    public Guid StudentId { get; set; }
    public List<string> ActionItems { get; set; } = new();
    
    // Workflow state: PAUSED_FOR_PROFESSOR_APPROVAL, APPROVED_ACTIVE, REJECTED
    public string ApprovalStatus { get; set; } = "PAUSED_FOR_PROFESSOR_APPROVAL";
    public string? ProfessorNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public MasteryReport? MasteryReport { get; set; }
}