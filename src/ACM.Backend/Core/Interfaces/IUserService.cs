using ACM.Backend.Core.DTOs.Member1;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Core.Interfaces
{
    public interface IUserService
    {
        Task<AuthResponseDto> AuthenticateAsync(AuthRequestDto request);
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task<UserResponseDto> RegisterUserAsync(RegisterUserDto request, Guid? createdByUserId);
        Task<UserResponseDto?> GetUserByIdAsync(Guid userId);
        Task<UserResponseDto?> GetUserByEmailAsync(string email);
        Task<IEnumerable<UserResponseDto>> GetAllUsersAsync();
        Task<IEnumerable<UserResponseDto>> GetUsersByRoleAsync(UserRole role);
        Task<bool> UpdateUserAsync(Guid userId, string firstName, string lastName);
        Task<bool> DeactivateUserAsync(Guid userId);
        Task<bool> ActivateUserAsync(Guid userId);
        Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
        Task<bool> RevokeRefreshTokenAsync(Guid userId, string token);
        Task<bool> ValidatePasswordAsync(string plainPassword, string passwordHash);
    }
}
