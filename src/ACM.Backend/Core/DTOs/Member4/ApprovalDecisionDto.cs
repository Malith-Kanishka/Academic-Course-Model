namespace ACM.Backend.Core.DTOs.Member4;

using System;

public class ApprovalDecisionDto
{
    public Guid PlanId { get; set; }
    public string Status { get; set; } = string.Empty; // Expected: "APPROVED_ACTIVE" or "REJECTED"
    public string? Notes { get; set; }
}