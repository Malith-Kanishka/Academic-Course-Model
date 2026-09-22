using ACM.Backend.Core.Entities;

namespace ACM.Backend.Core.DTOs.Member1
{
    public class RoleAssignDto
    {
        public Guid UserId { get; set; }
        public UserRole Role { get; set; }
    }
}
