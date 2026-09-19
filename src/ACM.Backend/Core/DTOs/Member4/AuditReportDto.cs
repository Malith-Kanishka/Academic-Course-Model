namespace ACM.Backend.Core.DTOs.Member4;

using System;
using System.Collections.Generic;

public class AuditReportDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid StudentId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int MasteryScore { get; set; }
    public List<string> FlaggedMisconceptions { get; set; } = new();
    public RemedialPlanDto? RemedialPlan { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}