using ACM.Backend.Core.DTOs.Member1;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Core.Interfaces
{
    public interface IUserService
    {
        Task<AuthResponseDto> AuthenticateAsync(AuthRequestDto request);
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task<UserResponseDto> RegisterUserAsync(RegisterUserDto request, int? createdByUserId);
        Task<UserResponseDto?> GetUserByIdAsync(int userId);
        Task<UserResponseDto?> GetUserByEmailAsync(string email);
        Task<IEnumerable<UserResponseDto>> GetAllUsersAsync();
        Task<IEnumerable<UserResponseDto>> GetUsersByRoleAsync(UserRole role);
        Task<bool> UpdateUserAsync(int userId, string firstName, string lastName);
        Task<bool> DeactivateUserAsync(int userId);
        Task<bool> ActivateUserAsync(int userId);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<bool> RevokeRefreshTokenAsync(int userId, string token);
        Task<bool> ValidatePasswordAsync(string plainPassword, string passwordHash);
    }
}
