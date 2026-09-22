namespace ACM.Backend.Controllers;

using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ApprovalController : ControllerBase
{
    private readonly IApprovalService _approvalService;

    public ApprovalController(IApprovalService approvalService)
    {
        _approvalService = approvalService;
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
        return Ok(report);
    }

    /// <summary>
    /// Gets all pending remedial plans requiring Professor sign-off.
    /// Used by Member 4's React Professor Approval Inbox.
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        var pendingPlans = await _approvalService.GetPendingApprovalsAsync();
        return Ok(pendingPlans);
    }

    /// <summary>
    /// Professor submits approval decision (Approve or Reject with feedback).
    /// Used by Member 4's React Professor Inbox action buttons.
    /// </summary>
    [HttpPost("decision")]
    public async Task<IActionResult> SubmitDecision([FromBody] ApprovalDecisionDto decision)
    {
        if (decision == null) return BadRequest("Invalid decision data.");

        var updatedPlan = await _approvalService.SubmitProfessorDecisionAsync(
            decision.PlanId, 
            decision.Status, 
            decision.Notes
        );

        if (updatedPlan == null) return NotFound("Remedial plan not found.");

        return Ok(updatedPlan);
    }
}