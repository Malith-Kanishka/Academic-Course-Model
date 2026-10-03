using ACM.Backend.Core.DTOs;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ACM.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SyllabusController : ControllerBase
    {
        private readonly CurriculumService _curriculumService;
        private readonly IEnrollmentService _enrollmentService;

        public SyllabusController(
            CurriculumService curriculumService,
            IEnrollmentService enrollmentService)
        {
            _curriculumService = curriculumService;
            _enrollmentService = enrollmentService;
        }

        [HttpGet("modules")]
        public async Task<ActionResult<IEnumerable<Module>>> GetModules()
        {
            if (User.IsInRole("Student"))
            {
                if (!Guid.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var studentId))
                    return Unauthorized();
                return Ok(await _enrollmentService.GetModulesForStudentAsync(studentId));
            }

            var modules = await _curriculumService.GetModulesAsync();
            return Ok(modules);
        }

        [HttpPost("modules")]
        [HttpPost("/api/curriculum/module")]
        [Authorize(Roles = "Professor,Admin")]
        public async Task<ActionResult<Module>> CreateModule([FromBody] Module module)
        {
            if (module.Id == Guid.Empty)
            {
                module.Id = Guid.NewGuid();
            }
            module.CreatedAt = DateTime.UtcNow;

            var created = await _curriculumService.CreateModuleAsync(module);
            return CreatedAtAction(nameof(GetModules), new { id = created.Id }, created);
        }

        [HttpPost("topics")]
        [Authorize(Roles = "Professor,Admin")]
        public async Task<ActionResult<Topic>> CreateTopic([FromBody] TopicCreateDto dto)
        {
            try
            {
                var topic = await _curriculumService.CreateTopicAsync(dto);
                return CreatedAtAction(nameof(GetModules), new { id = topic.Id }, topic);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("topics/search")]
        public async Task<ActionResult<IEnumerable<Topic>>> SearchTopics([FromQuery] string? query, [FromQuery] Guid? moduleId)
        {
            var searchDto = new TopicSearchDto
            {
                Query = query,
                ModuleId = moduleId
            };

            var results = await _curriculumService.SearchTopicsAsync(searchDto);
            if (User.IsInRole("Student"))
            {
                if (!Guid.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var studentId))
                    return Unauthorized();
                var moduleIds = await _enrollmentService.GetActiveModuleIdsAsync(studentId);
                results = results.Where(topic => moduleIds.Contains(topic.ModuleId));
            }
            return Ok(results);
        }

        [HttpPost("materials/upload")]
        [Authorize(Roles = "Professor,Admin")]
        public async Task<ActionResult<StudyMaterial>> UploadMaterial([FromForm] MaterialUploadDto dto)
        {
            try
            {
                var material = await _curriculumService.UploadMaterialAsync(dto);
                return CreatedAtAction(nameof(GetMaterialsForTopic), new { topicId = material.TopicId }, material);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("topics/{topicId}/materials")]
        public async Task<ActionResult<IEnumerable<StudyMaterial>>> GetMaterialsForTopic(Guid topicId)
        {
            if (User.IsInRole("Student"))
            {
                if (!Guid.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var studentId))
                    return Unauthorized();
                if (!await _enrollmentService.HasTopicEnrollmentAsync(studentId, topicId))
                    return Forbid();
            }

            var materials = await _curriculumService.GetMaterialsForTopicAsync(topicId);
            return Ok(materials);
        }
    }
}