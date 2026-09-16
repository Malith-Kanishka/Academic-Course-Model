using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ACM.Backend.Core.Entities
{
    public class Topic
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ModuleId { get; set; }

        [ForeignKey("ModuleId")]
        public Module? Module { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string ContentDescription { get; set; } = string.Empty;

        public int OrderIndex { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property for study materials
        public ICollection<StudyMaterial> StudyMaterials { get; set; } = new List<StudyMaterial>();
    }
}