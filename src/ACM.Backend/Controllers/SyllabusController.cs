using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ACM.Backend.Infrastructure.Data;
using ACM.Backend.Core.Entities;
using ACM.Backend.Services;

namespace ACM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SyllabusController : ControllerBase
    {
        private readonly ACMDbContext _context;
        private readonly KnowledgeAuditorService _knowledgeAuditor;

        public SyllabusController(ACMDbContext context, KnowledgeAuditorService knowledgeAuditor)
        {
            _context = context;
            _knowledgeAuditor = knowledgeAuditor;
        }

        [HttpGet("modules")]
        public async Task<ActionResult<IEnumerable<Module>>> GetModules()
        {
            return await _context.Modules
                .Include(m => m.Topics)
                .ThenInclude(t => t.StudyMaterials)
                .ToListAsync();
        }

        [HttpPost("modules")]
        public async Task<ActionResult<Module>> CreateModule(Module module)
        {
            _context.Modules.Add(module);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetModules), new { id = module.Id }, module);
        }

        [HttpPost("topics")]
        public async Task<ActionResult> CreateTopic(Topic topic)
        {
            // Run the Knowledge Auditor AI agent check
            var (isValid, feedback) = await _knowledgeAuditor.AuditTopicAsync(topic);
            
            if (!isValid)
            {
                return BadRequest(new { message = feedback });
            }

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();
            
            return Ok(new { topic, auditFeedback = feedback });
        }
    }
}