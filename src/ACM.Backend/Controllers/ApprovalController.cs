namespace ACM.Backend.Controllers;

using System.Security.Claims;
using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Route("api/approvals")]
public class ApprovalController : ControllerBase
{
    private readonly IApprovalService _approvalService;
    private readonly IEmailService _emailService;

    public ApprovalController(IApprovalService approvalService, IEmailService emailService)
    {
        _approvalService = approvalService;
        _emailService = emailService;
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
        return Ok(pendingPlans);
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
            decision.Notes
        );

        if (updatedPlan == null) return NotFound("Remedial plan not found.");

        if (updatedPlan.ApprovalStatus == "APPROVED_ACTIVE")
        {
            await _emailService.SendEmailAsync(
                "student@university.edu", 
                "Remedial Plan Approved", 
                $"Your remedial plan has been approved. Notes: {updatedPlan.ProfessorNotes}"
            );
        }

        return Ok(updatedPlan);
    }
}