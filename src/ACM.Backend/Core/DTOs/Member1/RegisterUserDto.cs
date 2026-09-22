using ACM.Backend.Core.Entities;

namespace ACM.Backend.Core.DTOs.Member1
{
    public class RegisterUserDto
    {
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Password { get; set; } = null!;
        public UserRole Role { get; set; }
    }
}
