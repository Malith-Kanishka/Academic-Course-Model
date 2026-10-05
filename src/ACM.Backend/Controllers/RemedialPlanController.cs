using System.Security.Claims;
using ACM.Backend.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ACM.Backend.Controllers;

[ApiController]
[Route("api/remedial-plans")]
[Authorize(Roles = "Student")]
public sealed class RemedialPlanController : ControllerBase
{
    private readonly IApprovalService _approvalService;

    public RemedialPlanController(IApprovalService approvalService)
    {
        _approvalService = approvalService;
    }

    [HttpDelete("{planId:guid}")]
    public async Task<IActionResult> DeletePlan(Guid planId)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var studentId))
            return Unauthorized();

        var deleted = await _approvalService.DeleteRemedialPlanAsync(planId, studentId);
        return deleted ? NoContent() : NotFound();
    }
}