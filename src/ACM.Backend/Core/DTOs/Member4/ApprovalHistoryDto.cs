namespace ACM.Backend.Core.DTOs.Member4;

public sealed class ApprovalHistoryDto : RemedialPlanDto
{
    public string Status { get; set; } = string.Empty;
    public string? Feedback { get; set; }
    public DateTime DecidedAt { get; set; }
}