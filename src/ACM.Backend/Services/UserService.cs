using ACM.Backend.Core.DTOs.Member1;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ACM.Backend.Services
{
    public class UserService : IUserService
    {
        private readonly ACMDbContext _context;
        private readonly JwtTokenGenerator _jwtTokenGenerator;
        private readonly ILogger<UserService> _logger;

        public UserService(ACMDbContext context, JwtTokenGenerator jwtTokenGenerator, ILogger<UserService> logger)
        {
            _context = context;
            _jwtTokenGenerator = jwtTokenGenerator;
            _logger = logger;
        }

        public async Task<AuthResponseDto> AuthenticateAsync(AuthRequestDto request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

                if (user == null)
                {
                    _logger.LogWarning($"Login attempt for non-existent user: {request.Email}");
                    return new AuthResponseDto { Success = false, Message = "Invalid email or password" };
                }

                if (!ValidatePasswordHash(request.Password, user.PasswordHash))
                {
                    _logger.LogWarning($"Failed login attempt for user: {request.Email}");
                    return new AuthResponseDto { Success = false, Message = "Invalid email or password" };
                }

                var accessToken = _jwtTokenGenerator.GenerateAccessToken(user);
                var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();
                var refreshTokenExpiry = _jwtTokenGenerator.GetRefreshTokenExpirationDate();

                // Save refresh token to database
                var refreshTokenEntity = new RefreshToken
                {
                    UserId = user.Id,
                    Token = refreshToken,
                    ExpiresAt = refreshTokenExpiry,
                    IssuedAt = DateTime.UtcNow
                };

                _context.RefreshTokens.Add(refreshTokenEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"User authenticated successfully: {request.Email}");

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Authentication successful",
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    User = MapToUserResponseDto(user)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Authentication error: {ex.Message}");
                return new AuthResponseDto { Success = false, Message = "Authentication failed" };
            }
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                var storedRefreshToken = await _context.RefreshTokens
                    .Include(rt => rt.User)
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.IsValid);

                if (storedRefreshToken == null)
                {
                    _logger.LogWarning($"Invalid refresh token attempt");
                    return new AuthResponseDto { Success = false, Message = "Invalid refresh token" };
                }

                var user = storedRefreshToken.User;
                if (!user.IsActive)
                {
                    return new AuthResponseDto { Success = false, Message = "User is inactive" };
                }

                // Revoke old refresh token
                storedRefreshToken.IsRevoked = true;

                // Generate new tokens
                var newAccessToken = _jwtTokenGenerator.GenerateAccessToken(user);
                var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
                var newRefreshTokenExpiry = _jwtTokenGenerator.GetRefreshTokenExpirationDate();

                // Save new refresh token
                var newRefreshTokenEntity = new RefreshToken
                {
                    UserId = user.Id,
                    Token = newRefreshToken,
                    ExpiresAt = newRefreshTokenExpiry,
                    IssuedAt = DateTime.UtcNow
                };

                _context.RefreshTokens.Add(newRefreshTokenEntity);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Token refreshed for user: {user.Email}");

                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Token refreshed successfully",
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken,
                    User = MapToUserResponseDto(user)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Token refresh error: {ex.Message}");
                return new AuthResponseDto { Success = false, Message = "Token refresh failed" };
            }
        }

        public async Task<UserResponseDto> RegisterUserAsync(RegisterUserDto request, int? createdByUserId)
        {
            try
            {
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (existingUser != null)
                {
                    throw new InvalidOperationException("User with this email already exists");
                }

                var user = new User
                {
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PasswordHash = HashPassword(request.Password),
                    Role = request.Role,
                    IsActive = true,
                    CreatedByUserId = createdByUserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // If user is Student, create Agent Personality profile
                if (request.Role == UserRole.Student)
                {
                    var agentPersonality = new AgentPersonality
                    {
                        StudentUserId = user.Id,
                        PersonalityType = "Adaptive",
                        CommunicationStyle = "Conversational",
                        LearningStyle = "Mixed",
                        PatienceLevel = 5,
                        EnthusiasmLevel = 7,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Add(agentPersonality);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Agent personality created for student: {user.Email}");
                }

                _logger.LogInformation($"User registered successfully: {request.Email} with role {request.Role}");

                return MapToUserResponseDto(user);
            }
            catch (Exception ex)
            {
                _logger.LogError($"User registration error: {ex.Message}");
                throw;
            }
        }

        public async Task<UserResponseDto?> GetUserByIdAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return user == null ? null : MapToUserResponseDto(user);
        }

        public async Task<UserResponseDto?> GetUserByEmailAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            return user == null ? null : MapToUserResponseDto(user);
        }

        public async Task<IEnumerable<UserResponseDto>> GetAllUsersAsync()
        {
            var users = await _context.Users.ToListAsync();
            return users.Select(MapToUserResponseDto);
        }

        public async Task<IEnumerable<UserResponseDto>> GetUsersByRoleAsync(UserRole role)
        {
            var users = await _context.Users.Where(u => u.Role == role).ToListAsync();
            return users.Select(MapToUserResponseDto);
        }

        public async Task<bool> UpdateUserAsync(int userId, string firstName, string lastName)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.FirstName = firstName;
            user.LastName = lastName;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User updated: {user.Email}");
            return true;
        }

        public async Task<bool> DeactivateUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User deactivated: {user.Email}");
            return true;
        }

        public async Task<bool> ActivateUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User activated: {user.Email}");
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            if (!ValidatePasswordHash(currentPassword, user.PasswordHash))
            {
                _logger.LogWarning($"Password change failed - incorrect current password for user: {user.Email}");
                return false;
            }

            user.PasswordHash = HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Password changed for user: {user.Email}");
            return true;
        }

        public async Task<bool> RevokeRefreshTokenAsync(int userId, string token)
        {
            var refreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == userId && rt.Token == token);

            if (refreshToken == null) return false;

            refreshToken.IsRevoked = true;
            _context.RefreshTokens.Update(refreshToken);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Refresh token revoked for user: {userId}");
            return true;
        }

        public async Task<bool> ValidatePasswordAsync(string plainPassword, string passwordHash)
        {
            return await Task.FromResult(ValidatePasswordHash(plainPassword, passwordHash));
        }

        // Helper methods
        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        private bool ValidatePasswordHash(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        private UserResponseDto MapToUserResponseDto(User user)
        {
            return new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }
    }
}
