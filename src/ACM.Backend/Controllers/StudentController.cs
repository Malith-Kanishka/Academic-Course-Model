using System.Security.Claims;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ACM.Backend.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;

    public StudentController(IEnrollmentService enrollmentService)
    {
        _enrollmentService = enrollmentService;
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
}