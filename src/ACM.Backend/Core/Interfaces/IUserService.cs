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
        Task<IEnumerable<UserResponseDto>> GetAllUsersAsync(string? email = null, UserRole? role = null, bool? isActive = null);
        Task<IEnumerable<UserResponseDto>> GetUsersByRoleAsync(UserRole role);
        Task<UserResponseDto?> UpdateUserAsync(Guid userId, string firstName, string lastName, UserRole? role = null);
        Task<bool> DeactivateUserAsync(Guid userId);
        Task<bool> ActivateUserAsync(Guid userId);
        Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
        Task<bool> RevokeRefreshTokenAsync(Guid userId, string token);
        Task<int> RevokeAllRefreshTokensAsync(Guid userId);
        Task<bool> ValidatePasswordAsync(string plainPassword, string passwordHash);
    }
}
