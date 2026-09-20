using System;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ACM.Backend.Core.DTOs.Member3
{
    public class AudioStreamDto
    {
        [Required]
        public Guid SessionId { get; set; }

        [Required]
        public IFormFile AudioFile { get; set; } // The raw .m4a voice file from Flutter
    }
}