using System.Security.Claims;
using ACM.Backend.Core.DTOs.Student;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACM.Backend.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;
    private readonly ACMDbContext _context;

    public StudentController(IEnrollmentService enrollmentService, ACMDbContext context)
    {
        _enrollmentService = enrollmentService;
        _context = context;
    }

    [HttpGet("my-modules")]
    [ProducesResponseType(typeof(IEnumerable<Module>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<Module>>> GetMyModules()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var studentId))
            return Unauthorized();

        return Ok(await _enrollmentService.GetModulesForStudentAsync(studentId));
    }

    [HttpGet("dashboard-summary")]
    [ProducesResponseType(typeof(StudentDashboardSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<StudentDashboardSummaryResponse>> GetDashboardSummary()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var studentId))
            return Unauthorized();

        var now = DateTime.UtcNow;
        var sessionStarts = await _context.StudySessions
            .AsNoTracking()
            .Where(session => session.StudentId == studentId)
            .Select(session => session.StartTime)
            .ToListAsync();
        var completedSessions = await _context.StudySessions
            .CountAsync(session => session.StudentId == studentId
                && session.Status == SessionStatus.Completed);
        var averageMastery = await _context.MasteryReports
            .Where(report => report.StudentId == studentId)
            .Select(report => (double?)report.MasteryScore)
            .AverageAsync();
        var activePlans = await _context.RemedialPlans
            .AsNoTracking()
            .Include(plan => plan.MasteryReport)
            .Where(plan => plan.StudentId == studentId
                && plan.ApprovalStatus == "APPROVED_ACTIVE"
                && plan.ApprovedAt.HasValue
                && plan.ApprovedAt.Value <= now
                && plan.ApprovedAt.Value >= now.AddDays(-7))
            .OrderByDescending(plan => plan.ApprovedAt)
            .ToListAsync();

        var planSummaries = activePlans.Select(plan =>
        {
            var approvedAt = DateTime.SpecifyKind(plan.ApprovedAt!.Value, DateTimeKind.Utc);
            var elapsedDays = DateOnly.FromDateTime(now).DayNumber
                - DateOnly.FromDateTime(approvedAt).DayNumber;
            return new ActiveRemedialPlanSummaryResponse(
                plan.Id,
                string.IsNullOrWhiteSpace(plan.MasteryReport?.TopicName)
                    ? "Socratic practice"
                    : plan.MasteryReport.TopicName,
                Math.Clamp(elapsedDays + 1, 1, 7),
                new DateTimeOffset(approvedAt),
                plan.ActionItems,
                plan.MasteryReport?.MasteryScore,
                plan.ProfessorNotes);
        }).ToList();

        return Ok(new StudentDashboardSummaryResponse(
            GetPracticeStreak(sessionStarts, now),
            completedSessions,
            averageMastery,
            planSummaries));
    }

    private static int GetPracticeStreak(IEnumerable<DateTime> sessionStarts, DateTime now)
    {
        var activeDays = sessionStarts
            .Select(start => DateOnly.FromDateTime(
                start.Kind == DateTimeKind.Utc ? start : start.ToUniversalTime()))
            .ToHashSet();
        var today = DateOnly.FromDateTime(now);
        var currentDay = activeDays.Contains(today) ? today : today.AddDays(-1);
        var streak = 0;

        while (activeDays.Contains(currentDay))
        {
            streak++;
            currentDay = currentDay.AddDays(-1);
        }

        return streak;
    }
}