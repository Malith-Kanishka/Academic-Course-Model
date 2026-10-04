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

        /// <summary>
        /// Updates an existing module's Code, Title and Description.
        /// Returns null when the module is not found.
        /// </summary>
        public async Task<Module?> UpdateModuleAsync(Guid moduleId, ModuleUpdateDto dto)
        {
            var module = await _context.Modules.FindAsync(moduleId);
            if (module is null)
                return null;

            module.Code = dto.Code.Trim();
            module.Title = dto.Title.Trim();
            module.Description = dto.Description?.Trim() ?? string.Empty;

            await _context.SaveChangesAsync();
            return module;
        }

        /// <summary>
        /// Deletes a module and all its cascaded topics/materials.
        /// Returns false when the module is not found.
        /// </summary>
        public async Task<bool> DeleteModuleAsync(Guid moduleId)
        {
            var module = await _context.Modules
                .Include(m => m.Topics)
                .ThenInclude(t => t.StudyMaterials)
                .FirstOrDefaultAsync(m => m.Id == moduleId);

            if (module is null)
                return false;

            // Remove physical files for all study materials under this module
            foreach (var topic in module.Topics)
            {
                foreach (var material in topic.StudyMaterials)
                {
                    if (!string.IsNullOrWhiteSpace(material.FilePathOrUrl) &&
                        File.Exists(material.FilePathOrUrl))
                    {
                        File.Delete(material.FilePathOrUrl);
                    }
                }
            }

            _context.Modules.Remove(module);
            await _context.SaveChangesAsync();
            return true;
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
                                         t.Module!.Title.ToLower().Contains(q));
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

            // Save file to uploads directory
            var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(uploadDto.File.FileName)}";
            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            Directory.CreateDirectory(uploadsDir);
            var filePath = Path.Combine(uploadsDir, safeFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await uploadDto.File.CopyToAsync(stream);
            }

            // Store a relative URL path so the frontend can build a full URL
            var fileUrl = $"/uploads/{safeFileName}";

            var material = new StudyMaterial
            {
                Id = Guid.NewGuid(),
                TopicId = uploadDto.TopicId,
                Title = uploadDto.Title,
                FilePathOrUrl = fileUrl,          // store as URL path
                FileName = uploadDto.File.FileName, // original file name
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