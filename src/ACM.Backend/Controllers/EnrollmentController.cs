using ACM.Backend.Core.DTOs.Enrollment;
using ACM.Backend.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ACM.Backend.Controllers;

[ApiController]
[Route("api/enrollments")]
[Authorize]
public class EnrollmentController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;

    public EnrollmentController(IEnrollmentService enrollmentService)
    {
        _enrollmentService = enrollmentService;
    }

    [HttpPost("assign")]
    [Authorize(Roles = "Professor,Admin")]
    [ProducesResponseType(typeof(EnrollmentAssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EnrollmentAssignmentResponse>> Assign(
        [FromBody] AssignStudentEnrollmentRequest request)
    {
        var hasEmail = !string.IsNullOrWhiteSpace(request.StudentEmail);
        if (request.StudentId.HasValue == hasEmail || request.ModuleId == Guid.Empty)
            return BadRequest(new { message = "Provide exactly one student ID or email and a module ID." });

        try
        {
            var result = await _enrollmentService.AssignStudentAsync(
                request.StudentId,
                request.StudentEmail,
                request.ModuleId);
            return Ok(result);
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(new { message = error.Message });
        }
        catch (InvalidOperationException error)
        {
            return BadRequest(new { message = error.Message });
        }
    }
}