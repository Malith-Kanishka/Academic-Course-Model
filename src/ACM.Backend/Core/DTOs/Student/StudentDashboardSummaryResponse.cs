namespace ACM.Backend.Core.DTOs.Student;

/// <summary>Student learning performance and active remedial plan summary.</summary>
public sealed record StudentDashboardSummaryResponse(
    int PracticeStreakDays,
    int CompletedVoiceSessions,
    double? AverageMastery,
    IReadOnlyList<ActiveRemedialPlanSummaryResponse> ActiveRemedialPlans);

/// <summary>An approved remedial plan that is still within its seven-day window.</summary>
public sealed record ActiveRemedialPlanSummaryResponse(
    Guid Id,
    string TopicName,
    int DayOfPlan,
    DateTimeOffset ApprovedAt,
    IReadOnlyList<string> ActionItems,
    int? MasteryScore,
    string? ProfessorNotes);