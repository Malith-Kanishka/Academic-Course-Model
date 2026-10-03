using System;
using System.ComponentModel.DataAnnotations;

namespace ACM.Backend.Core.DTOs.Member3
{
    public class StudentTextTurnDto
    {
        [Required]
        public Guid SessionId { get; set; }

        [Required]
        [MinLength(1)]
        public string StudentText { get; set; } = string.Empty;
    }

    public class SessionTurnResponseDto
    {
        public string Transcript { get; set; } = string.Empty;
        public string AiText { get; set; } = string.Empty;
    }
}