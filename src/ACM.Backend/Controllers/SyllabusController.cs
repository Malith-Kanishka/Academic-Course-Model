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

        // ─────────────────────────────────────────────
        // MODULES
        // ─────────────────────────────────────────────

        /// <summary>
        /// Returns all modules (with topics and study materials nested).
        /// Students see only their enrolled modules.
        /// </summary>
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

        /// <summary>
        /// Creates a new module. Professor / Admin only.
        /// </summary>
        [HttpPost("modules")]
        [HttpPost("/api/curriculum/module")]   // keep legacy alias
        [Authorize(Roles = "Professor,Admin")]
        public async Task<ActionResult<Module>> CreateModule([FromBody] Module module)
        {
            if (module.Id == Guid.Empty)
                module.Id = Guid.NewGuid();

            module.CreatedAt = DateTime.UtcNow;

            var created = await _curriculumService.CreateModuleAsync(module);
            return CreatedAtAction(nameof(GetModules), new { id = created.Id }, created);
        }

        /// <summary>
        /// Updates an existing module's Code, Title and Description. Professor / Admin only.
        /// </summary>
        [HttpPut("modules/{id:guid}")]
        [Authorize(Roles = "Professor,Admin")]
        public async Task<ActionResult<Module>> UpdateModule(Guid id, [FromBody] ModuleUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _curriculumService.UpdateModuleAsync(id, dto);
            if (updated is null)
                return NotFound(new { message = $"Module {id} not found." });

            return Ok(updated);
        }

        /// <summary>
        /// Deletes a module and all cascaded topics / study materials. Professor / Admin only.
        /// </summary>
        [HttpDelete("modules/{id:guid}")]
        [Authorize(Roles = "Professor,Admin")]
        public async Task<IActionResult> DeleteModule(Guid id)
        {
            var deleted = await _curriculumService.DeleteModuleAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Module {id} not found." });

            return NoContent();
        }

        // ─────────────────────────────────────────────
        // TOPICS
        // ─────────────────────────────────────────────

        /// <summary>
        /// Creates a new topic inside a module. Professor / Admin only.
        /// </summary>
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

        /// <summary>
        /// Searches topics by keyword and/or module ID.
        /// Students are filtered to their enrolled modules only.
        /// </summary>
        [HttpGet("topics/search")]
        public async Task<ActionResult<IEnumerable<Topic>>> SearchTopics(
            [FromQuery] string? query,
            [FromQuery] Guid? moduleId)
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
                results = results.Where(t => moduleIds.Contains(t.ModuleId));
            }

            return Ok(results);
        }

        // ─────────────────────────────────────────────
        // STUDY MATERIALS
        // ─────────────────────────────────────────────

        /// <summary>
        /// Uploads a study material (PDF, etc.) and attaches it to a topic.
        /// Professor / Admin only.
        /// </summary>
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

        /// <summary>
        /// Returns all study materials for the given topic.
        /// Students must be enrolled in the topic's parent module.
        /// </summary>
        [HttpGet("topics/{topicId:guid}/materials")]
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

        /// <summary>
        /// Downloads a study material file with the correct filename as an attachment.
        /// This endpoint exists so the browser can trigger a named download cross-origin.
        /// </summary>
        [HttpGet("materials/{id:guid}/download")]
        [AllowAnonymous]   // File is keyed by opaque GUID – no sensitive info exposed
        public async Task<IActionResult> DownloadMaterial(Guid id)
        {
            var material = await _curriculumService.GetMaterialByIdAsync(id);
            if (material is null)
                return NotFound(new { message = "Material not found." });

            // Resolve physical path on disk
            var physicalPath = GetPhysicalPath(material.FilePathOrUrl);
            if (!System.IO.File.Exists(physicalPath))
                return NotFound(new { message = $"File not found on server. Attempted path: {physicalPath} (original: {material.FilePathOrUrl})" });


            var fileName = string.IsNullOrWhiteSpace(material.FileName)
                ? material.Title + ".pdf"
                : material.FileName;

            var mimeType = material.MaterialType?.ToUpper() switch
            {
                "PDF"  => "application/pdf",
                "DOCX" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "TXT"  => "text/plain",
                _      => "application/octet-stream",
            };

            return PhysicalFile(physicalPath, mimeType, fileName);
        }

        /// <summary>
        /// Opens (previews) a study material file inline in the browser.
        /// </summary>
        [HttpGet("materials/{id:guid}/preview")]
        [AllowAnonymous]
        public async Task<IActionResult> PreviewMaterial(Guid id)
        {
            var material = await _curriculumService.GetMaterialByIdAsync(id);
            if (material is null)
                return NotFound(new { message = "Material not found." });

            var physicalPath = GetPhysicalPath(material.FilePathOrUrl);
            if (!System.IO.File.Exists(physicalPath))
                return NotFound(new { message = $"File not found on server. Attempted path: {physicalPath} (original: {material.FilePathOrUrl})" });


            var mimeType = material.MaterialType?.ToUpper() switch
            {
                "PDF"  => "application/pdf",
                "DOCX" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "TXT"  => "text/plain",
                _      => "application/octet-stream",
            };

            // Inline – browser renders it (PDF preview in a new tab)
            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{material.FileName}\"");
            return PhysicalFile(physicalPath, mimeType);
        }

        // ─────────────────────────────────────────────
        // Private helpers
        // ─────────────────────────────────────────────

        /// <summary>
        /// Converts either a legacy Windows filesystem path or a /uploads/... URL path
        /// to the absolute physical path on disk.
        /// </summary>
        private static string GetPhysicalPath(string filePathOrUrl)
        {
            // Normalise slashes
            var normalised = filePathOrUrl.Replace('\\', '/').TrimStart('/');

            // Strip leading "uploads/" if present so we can re-join cleanly
            if (normalised.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
                normalised = normalised["uploads/".Length..];


            return Path.Combine(Directory.GetCurrentDirectory(), "uploads", normalised);
        }
    }
}