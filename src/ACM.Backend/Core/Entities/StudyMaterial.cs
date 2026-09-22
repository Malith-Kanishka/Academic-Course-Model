using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ACM.Backend.Core.Entities
{
    public class StudyMaterial
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TopicId { get; set; }

        [ForeignKey("TopicId")]
        public Topic? Topic { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string FilePathOrUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string MaterialType { get; set; } = "PDF"; // PDF, Rubric, LectureSlide

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}