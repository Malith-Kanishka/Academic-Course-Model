namespace ACM.Backend.Core.DTOs.Member4;

using System;
using System.Collections.Generic;

public class RemedialPlanDto
{
    public Guid Id { get; set; }
    public Guid MasteryReportId { get; set; }
    public Guid StudentId { get; set; }
    public string? StudentName { get; set; }
    public string? StudentEmail { get; set; }
    public string? TopicName { get; set; }
    public string? ModuleName { get; set; }
    public int? MasteryScore { get; set; }
    public List<string> FlaggedMisconceptions { get; set; } = new();
    public string StudentSubmission { get; set; } = string.Empty;
    public string ExpectedStandard { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = "PAUSED_FOR_PROFESSOR_APPROVAL";
    public List<string> ActionItems { get; set; } = new();
    public string? ProfessorNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}