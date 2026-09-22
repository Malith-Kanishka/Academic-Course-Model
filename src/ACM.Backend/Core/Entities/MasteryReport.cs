namespace ACM.Backend.Core.Entities;

public class MasteryReport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public Guid StudentId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int MasteryScore { get; set; }
    public List<string> FlaggedMisconceptions { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public RemedialPlan? RemedialPlan { get; set; }
}