using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ACM.Backend.Core.Entities
{
    public class Module
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty; // e.g., SE3090

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property for related topics
        public ICollection<Topic> Topics { get; set; } = new List<Topic>();
    }
}