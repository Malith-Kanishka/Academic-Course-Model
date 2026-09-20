using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Core.DTOs.Member3;

namespace ACM.Backend.Controllers
{
    [ApiController]
    [Route("api/sessions")] // The base URL for this controller
    public class StudySessionController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        // Constructor Injection
        public StudySessionController(ISessionService sessionService)
        {
            _sessionService = sessionService;
        }

        // POST: api/sessions/start
        [HttpPost("start")]
        public async Task<IActionResult> StartSession([FromBody] SessionStartDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var session = await _sessionService.StartSessionAsync(dto);
            return Ok(session); // Returns HTTP 200 with the new session data
        }

        // POST: api/sessions/audio
        // Notice we use [FromForm] instead of [FromBody] because it's a file upload
        [HttpPost("audio")]
        public async Task<IActionResult> UploadAudioTurn([FromForm] AudioStreamDto dto)
        {
            if (dto.AudioFile == null || dto.AudioFile.Length == 0)
            {
                return BadRequest("No audio file detected.");
            }

            var aiResponseText = await _sessionService.ProcessStudentAudioAsync(dto);
            
            return Ok(new { AiResponse = aiResponseText });
        }

        // GET: api/sessions/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSession(Guid id)
        {
            var session = await _sessionService.GetSessionHistoryAsync(id);
            if (session == null) return NotFound();

            return Ok(session);
        }
    }
}