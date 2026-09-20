using ACM.Backend.Core.DTOs;
using ACM.Backend.Core.Entities;
using ACM.Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ACM.Backend.Services
{
    public class CurriculumService
    {
        private readonly ACMDbContext _context;
        private readonly KnowledgeAuditorService _auditorService;

        public CurriculumService(ACMDbContext context, KnowledgeAuditorService auditorService)
        {
            _context = context;
            _auditorService = auditorService;
        }

        public async Task<IEnumerable<Module>> GetModulesAsync()
        {
            return await _context.Modules
                .Include(m => m.Topics)
                .ThenInclude(t => t.StudyMaterials)
                .ToListAsync();
        }

        public async Task<Module?> GetModuleByIdAsync(Guid id)
        {
            return await _context.Modules
                .Include(m => m.Topics)
                .ThenInclude(t => t.StudyMaterials)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<Module> CreateModuleAsync(Module module)
        {
            _context.Modules.Add(module);
            await _context.SaveChangesAsync();
            return module;
        }

        public async Task<Topic> CreateTopicAsync(TopicCreateDto dto)
        {
            // Validate module exists before creating topic
            var moduleExists = await _context.Modules.AnyAsync(m => m.Id == dto.ModuleId);
            if (!moduleExists)
            {
                throw new KeyNotFoundException($"Module with ID {dto.ModuleId} does not exist.");
            }

            var topic = new Topic
            {
                Id = Guid.NewGuid(),
                ModuleId = dto.ModuleId,
                Title = dto.Title,
                ContentDescription = dto.ContentDescription,
                OrderIndex = dto.OrderIndex,
                CreatedAt = DateTime.UtcNow
            };

            // Run AI audit check via KnowledgeAuditorService
            var auditResult = await _auditorService.AuditTopicAsync(topic);
            if (!auditResult.IsValid)
            {
                throw new InvalidOperationException($"AI Audit Rejected Topic: {auditResult.Feedback}");
            }

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();
            return topic;
        }

        public async Task<IEnumerable<Topic>> SearchTopicsAsync(TopicSearchDto searchDto)
        {
            var query = _context.Topics.Include(t => t.Module).AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchDto.Query))
            {
                var q = searchDto.Query.ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(q) || 
                                         t.ContentDescription.ToLower().Contains(q) ||
                                         t.Module.Title.ToLower().Contains(q));
            }

            if (searchDto.ModuleId.HasValue)
            {
                query = query.Where(t => t.ModuleId == searchDto.ModuleId.Value);
            }

            return await query.ToListAsync();
        }

        public async Task<StudyMaterial> UploadMaterialAsync(MaterialUploadDto uploadDto)
        {
            var topicExists = await _context.Topics.AnyAsync(t => t.Id == uploadDto.TopicId);
            if (!topicExists)
            {
                throw new KeyNotFoundException($"Topic with ID {uploadDto.TopicId} does not exist.");
            }

            // Save file locally or to storage
            var fileName = $"{Guid.NewGuid()}_{uploadDto.File.FileName}";
            var filePath = Path.Combine("uploads", fileName);
            
            Directory.CreateDirectory("uploads");
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await uploadDto.File.CopyToAsync(stream);
            }

            var material = new StudyMaterial
            {
                Id = Guid.NewGuid(),
                TopicId = uploadDto.TopicId,
                Title = uploadDto.Title,
                FilePathOrUrl = filePath,
                MaterialType = Path.GetExtension(uploadDto.File.FileName).TrimStart('.').ToUpper(),
                UploadedAt = DateTime.UtcNow
            };

            _context.StudyMaterials.Add(material);
            await _context.SaveChangesAsync();
            return material;
        }

        public async Task<IEnumerable<StudyMaterial>> GetMaterialsForTopicAsync(Guid topicId)
        {
            return await _context.StudyMaterials
                .Where(m => m.TopicId == topicId)
                .ToListAsync();
        }

        public async Task<StudyMaterial?> GetMaterialByIdAsync(Guid materialId)
        {
            return await _context.StudyMaterials.FindAsync(materialId);
        }
    }
}