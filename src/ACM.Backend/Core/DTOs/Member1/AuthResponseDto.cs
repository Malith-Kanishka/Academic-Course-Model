namespace ACM.Backend.Core.DTOs.Member1
{
    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = null!;
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public UserResponseDto? User { get; set; }
    }
}
