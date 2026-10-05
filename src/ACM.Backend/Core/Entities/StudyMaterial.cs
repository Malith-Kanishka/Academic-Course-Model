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

        /// <summary>
        /// Stored as a relative URL path: /uploads/{guid}_{filename}
        /// Legacy rows may have a Windows path (uploads\...) which is normalised on read.
        /// </summary>
        [Required]
        public string FilePathOrUrl { get; set; } = string.Empty;

        /// <summary>
        /// Original file name as uploaded by the user (used as the download filename).
        /// </summary>
        [MaxLength(500)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string MaterialType { get; set; } = "PDF";

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Always returns a clean /uploads/... relative URL path regardless of how the path
        /// was originally stored, so the frontend can prefix it with the backend origin.
        /// </summary>
        [NotMapped]
        public string FileUrl
        {
            get
            {
                if (string.IsNullOrWhiteSpace(FilePathOrUrl))
                    return string.Empty;

                // Normalise old Windows filesystem paths: "uploads\guid_file.pdf" → "/uploads/guid_file.pdf"
                var normalised = FilePathOrUrl
                    .Replace('\\', '/')
                    .TrimStart('.');

                if (!normalised.StartsWith('/'))
                    normalised = "/" + normalised;

                return normalised;
            }
        }
    }
}