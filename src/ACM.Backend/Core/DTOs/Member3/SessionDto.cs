namespace ACM.Backend.Core.DTOs.Member3;

public sealed class SessionDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public Guid TopicId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public List<DialogueTurnDto> DialogueTurns { get; set; } = new();
}

public sealed class DialogueTurnDto
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; }
}