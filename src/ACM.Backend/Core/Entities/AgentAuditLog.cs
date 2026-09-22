namespace ACM.Backend.Core.Entities;

public class AgentAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public string AgentName { get; set; } = "SafetyEvaluatorAgent";
    public string InputPayloadJson { get; set; } = string.Empty;
    public string OutputPayloadJson { get; set; } = string.Empty;
    public bool TriggeredHumanInLoop { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}