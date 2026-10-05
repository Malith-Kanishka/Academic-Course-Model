namespace ACM.Backend.Core.DTOs.Member4;

using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

public class RemedialPlanDto
{
    private List<string> _actionItems = new();

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
    public List<string> ActionItems
    {
        get => _actionItems;
        set => _actionItems = (value ?? new List<string>())
            .Select(item => SanitizeActionItem(item, TopicName))
            .ToList();
    }
    public string? ProfessorNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public static string SanitizeActionItem(string? actionItem, string? topicName = null)
    {
        var text = actionItem?.Trim() ?? string.Empty;
        if (!Regex.IsMatch(
            text,
            @"(?:topic){2,}|(?:module){2,}|standard:\s*topic\s*\d+\s*(?:topic)+",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            return text;

        var name = string.IsNullOrWhiteSpace(topicName) ? "this topic" : topicName.Trim();
        return $"Review core concepts for {name} and revisit key dialogue steps regarding student queries.";
    }
}