using System.ComponentModel.DataAnnotations;

namespace ACM.Backend.Core.DTOs
{
    public class TopicCreateDto
    {
        [Required]
        public Guid ModuleId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string ContentDescription { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int OrderIndex { get; set; }
    }
}