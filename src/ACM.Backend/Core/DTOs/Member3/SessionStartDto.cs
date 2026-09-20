using System;
using System.ComponentModel.DataAnnotations;

namespace ACM.Backend.Core.DTOs.Member3
{
    public class SessionStartDto
    {
        [Required]
        public Guid StudentId { get; set; }
        
        [Required]
        public Guid TopicId { get; set; }
    }
}