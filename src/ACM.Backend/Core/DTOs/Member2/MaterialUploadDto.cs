using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ACM.Backend.Core.DTOs
{
    public class MaterialUploadDto
    {
        [Required]
        public Guid TopicId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public IFormFile File { get; set; } = null!;
    }
}