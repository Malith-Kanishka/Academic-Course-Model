namespace ACM.Backend.Controllers;

using System.Security.Claims;
using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

[ApiController]
[Route("api/[controller]")]
[Route("api/approvals")]
public class ApprovalController : ControllerBase
{
    private readonly IApprovalService _approvalService;
    private readonly IEmailService _emailService;
    private readonly ILogger<ApprovalController> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public ApprovalController(
        IApprovalService approvalService,
        IEmailService emailService,
        ILogger<ApprovalController> logger,
        IServiceScopeFactory scopeFactory)
    {
        _approvalService = approvalService;
        _emailService = emailService;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    /// <summary>
    /// Processes final session metrics and calculates mastery score / HITL approval state.
    /// Called by Session completion or Python Agent Subsystem.
    /// </summary>
    [HttpPost("evaluate")]
    public async Task<IActionResult> EvaluateSession([FromBody] SessionFinalTranscriptDTO dto)
    {
        if (dto == null) return BadRequest("Invalid session data.");

        var report = await _approvalService.ProcessSessionEvaluationAsync(dto);

        if (report?.RemedialPlan?.ApprovalStatus == "PAUSED_FOR_PROFESSOR_APPROVAL")
        {
            await _emailService.SendEmailAsync(
                "professor@university.edu", 
                "New Remedial Plan Approval Required", 
                $"A new remedial plan for student {report.StudentId} requires your approval."
            );
        }

        return Ok(report);
    }

    /// <summary>
    /// Gets all pending remedial plans requiring Professor sign-off.
    /// Used by Member 4's React Professor Approval Inbox.
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "Professor,Admin")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        var pendingPlans = await _approvalService.GetPendingApprovalsAsync();
        return Ok(pendingPlans.Select(ToRemedialPlanDto));
    }

    [HttpGet("history")]
    [Authorize(Roles = "Professor,Admin")]
    public async Task<IActionResult> GetApprovalHistory()
    {
        var history = await _approvalService.GetApprovalHistoryAsync();
        return Ok(history
            .Where(log => log.Plan is not null)
            .Select(log => ToApprovalHistoryDto(log, log.Plan!)));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Professor,Admin")]
    public async Task<IActionResult> DeletePlan(Guid id)
    {
        var deleted = await _approvalService.DeleteRemedialPlanAsync(id);
        if (!deleted) return NotFound(new { message = "Plan not found." });

        return Ok(new { message = "Plan deleted successfully." });
    }

    /// <summary>
    /// Gets the authenticated student's active remedial plans and approved tasks.
    /// </summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Student")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMyActivePlans()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var studentId))
            return Unauthorized();

        var plans = await _approvalService.GetActivePlansForStudentAsync(studentId);
        return Ok(plans.Select(plan => new
        {
            plan.Id,
            plan.ApprovalStatus,
            plan.ActionItems,
            plan.ApprovedAt,
            plan.CreatedAt
        }));
    }

    /// <summary>
    /// Professor submits approval decision (Approve or Reject with feedback).
    /// Used by Member 4's React Professor Inbox action buttons.
    /// </summary>
    [HttpPost("decision")]
    [Authorize(Roles = "Professor,Admin")]
    public async Task<IActionResult> SubmitDecision([FromBody] ApprovalDecisionDto decision)
    {
        if (decision == null) return BadRequest("Invalid decision data.");

        var updatedPlan = await _approvalService.SubmitProfessorDecisionAsync(
            decision.PlanId, 
            decision.Status, 
            decision.LecturerNotes ?? decision.Notes,
            decision.EditedPlanSummary
        );

        if (updatedPlan == null) return NotFound("Remedial plan not found.");

        if (updatedPlan.ApprovalStatus == "APPROVED_ACTIVE")
        {
            try
            {
                var studentEmail = await _approvalService.GetStudentEmailAsync(updatedPlan.StudentId);
                if (string.IsNullOrWhiteSpace(studentEmail))
                {
                    _logger.LogWarning(
                        "Could not send approval notification for plan {PlanId}: student {StudentId} has no email address.",
                        updatedPlan.Id,
                        updatedPlan.StudentId);
                }
                else
                {
                    QueueEmail(
                        studentEmail,
                        "Remedial Plan Approved",
                        $"Your remedial plan has been approved. Notes: {updatedPlan.ProfessorNotes}",
                        updatedPlan.Id);
                }
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Failed to send approval notification for plan {PlanId}; the approval decision was saved.",
                    updatedPlan.Id);
            }
        }

        return Ok(updatedPlan);
    }

    private void QueueEmail(string toEmail, string subject, string body, Guid planId)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                await emailService.SendEmailAsync(toEmail, subject, body);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception,
                    "Background approval email failed for plan {PlanId}.", planId);
            }
        });
    }

    private static RemedialPlanDto ToRemedialPlanDto(RemedialPlan plan)
    {
        var studentName = plan.Student?.FullName?.Trim();
        if (string.IsNullOrWhiteSpace(studentName))
            studentName = plan.Student?.Email;
        if (string.IsNullOrWhiteSpace(studentName))
            studentName = $"Student {plan.StudentId.ToString()[..8]}";

        return new RemedialPlanDto
        {
            Id = plan.Id,
            MasteryReportId = plan.MasteryReportId,
            StudentId = plan.StudentId,
            StudentName = studentName,
            StudentEmail = plan.Student?.Email,
            TopicName = FirstDisplayName(
                plan.Session?.Topic?.Title,
                plan.MasteryReport?.TopicName,
                plan.Session?.Topic?.Module?.Title),
            ModuleName = FirstDisplayName(
                plan.Session?.Topic?.Module?.Title,
                plan.Session?.Topic?.Title,
                plan.MasteryReport?.TopicName),
            MasteryScore = plan.MasteryReport?.MasteryScore,
            FlaggedMisconceptions = plan.MasteryReport?.FlaggedMisconceptions ?? new List<string>(),
            StudentSubmission = plan.StudentSubmission,
            ExpectedStandard = plan.ExpectedStandard,
            ApprovalStatus = plan.ApprovalStatus,
            ActionItems = plan.ActionItems,
            ProfessorNotes = plan.ProfessorNotes,
            ApprovedAt = plan.ApprovedAt,
            CreatedAt = plan.CreatedAt
        };
    }

    private static string? FirstDisplayName(params string?[] values)
    {
        return values.FirstOrDefault(value =>
            !string.IsNullOrWhiteSpace(value)
            && !string.Equals(value.Trim(), "Unassigned module", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(value.Trim(), "Unknown Module", StringComparison.OrdinalIgnoreCase));
    }

    private static ApprovalHistoryDto ToApprovalHistoryDto(ApprovalLog log, RemedialPlan plan)
    {
        var dto = ToRemedialPlanDto(plan);
        return new ApprovalHistoryDto
        {
            Id = dto.Id,
            MasteryReportId = dto.MasteryReportId,
            StudentId = dto.StudentId,
            StudentName = dto.StudentName,
            StudentEmail = dto.StudentEmail,
            TopicName = dto.TopicName,
            MasteryScore = dto.MasteryScore,
            FlaggedMisconceptions = dto.FlaggedMisconceptions,
            StudentSubmission = dto.StudentSubmission,
            ExpectedStandard = dto.ExpectedStandard,
            ApprovalStatus = dto.ApprovalStatus,
            ActionItems = dto.ActionItems,
            ProfessorNotes = dto.ProfessorNotes,
            ApprovedAt = dto.ApprovedAt,
            CreatedAt = dto.CreatedAt,
            Status = log.Decision == "APPROVED_ACTIVE" ? "Approved" : "Rejected",
            Feedback = log.ProfessorFeedback,
            DecidedAt = log.Timestamp
        };
    }
}