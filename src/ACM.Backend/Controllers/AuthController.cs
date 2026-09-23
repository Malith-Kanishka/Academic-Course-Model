using ACM.Backend.Core.DTOs.Member1;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ACM.Backend.Controllers
{
    /// <summary>
    /// Authentication and User Management Controller
    /// Handles user authentication, registration, profile management, and account control
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserService userService, ILogger<AuthController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// User Login - Authenticate with email and password
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] AuthRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Email and password are required");

            _logger.LogInformation("Login attempt for email: {Email}", request.Email);

            var result = await _userService.AuthenticateAsync(request);

            if (!result.Success)
            {
                _logger.LogWarning("Failed login attempt for email: {Email}. Reason: {Message}", request.Email, result.Message);
                return Unauthorized(result);
            }

            _logger.LogInformation("Successful login for email: {Email}", request.Email);
            return Ok(result);
        }

        /// <summary>
        /// Refresh Access Token - Get new access token using refresh token
        /// </summary>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest("Refresh token is required");

            var result = await _userService.RefreshTokenAsync(request.RefreshToken);

            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }

        /// <summary>
        /// Register New User - Create a new user account
        /// </summary>
        [HttpPost("register")]
        [Authorize]
        [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<UserResponseDto>> Register([FromBody] RegisterUserDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out Guid createdByUserId))
                return Unauthorized("User ID not found in token");

            if (!User.IsInRole(UserRole.DepartmentHead.ToString()))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only Department Heads can register users" });

            try
            {
                var user = await _userService.RegisterUserAsync(request, createdByUserId);
                return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Get User by ID - Retrieve user details by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<UserResponseDto>> GetUserById(Guid id)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out Guid currentUserId))
                return Unauthorized();

            if (currentUserId != id && !User.IsInRole(UserRole.DepartmentHead.ToString()))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only view your own record" });

            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();

            return Ok(user);
        }

        /// <summary>
        /// Get User by Email - Search user by email address
        /// </summary>
        [HttpGet("email/{email}")]
        [Authorize]
        [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<UserResponseDto>> GetUserByEmail(string email)
        {
            var currentEmailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email);
            var isOwnEmail = string.Equals(currentEmailClaim?.Value, email, StringComparison.OrdinalIgnoreCase);

            if (!isOwnEmail && !User.IsInRole(UserRole.DepartmentHead.ToString()))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only view your own record" });

            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null)
                return NotFound();

            return Ok(user);
        }

        /// <summary>
        /// Get All Users - List all users in the system
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "DepartmentHead")]
        [ProducesResponseType(typeof(IEnumerable<UserResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        /// <summary>
        /// Get Users by Role - Filter users by their role
        /// </summary>
        [HttpGet("role/{role}")]
        [Authorize(Roles = "DepartmentHead")]
        [ProducesResponseType(typeof(IEnumerable<UserResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsersByRole(string role)
        {
            if (!Enum.TryParse<UserRole>(role, true, out var userRole))
                return BadRequest("Invalid role");

            var users = await _userService.GetUsersByRoleAsync(userRole);
            return Ok(users);
        }

        /// <summary>
        /// Update User Profile - Modify user's first and last name
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdClaim?.Value, out Guid currentUserId))
                return Unauthorized();

            if (currentUserId != id && !User.IsInRole(UserRole.DepartmentHead.ToString()))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only update your own profile" });

            var success = await _userService.UpdateUserAsync(id, request.FirstName, request.LastName);
            if (!success)
                return NotFound();

            return NoContent();
        }

        /// <summary>
        /// Change Password - Update user's password
        /// </summary>
        [HttpPost("{id}/change-password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangePasswordDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out Guid currentUserId) || currentUserId != id)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You can only change your own password" });

            var success = await _userService.ChangePasswordAsync(id, request.CurrentPassword, request.NewPassword);
            if (!success)
                return BadRequest("Current password is incorrect");

            return Ok(new { message = "Password changed successfully" });
        }

        /// <summary>
        /// Deactivate User - Disable user account
        /// </summary>
        [HttpPost("{id}/deactivate")]
        [Authorize(Roles = "DepartmentHead")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeactivateUser(Guid id)
        {
            var success = await _userService.DeactivateUserAsync(id);
            if (!success)
                return NotFound();

            return Ok(new { message = "User deactivated successfully" });
        }

        /// <summary>
        /// Activate User - Enable deactivated user account
        /// </summary>
        [HttpPost("{id}/activate")]
        [Authorize(Roles = "DepartmentHead")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> ActivateUser(Guid id)
        {
            var success = await _userService.ActivateUserAsync(id);
            if (!success)
                return NotFound();

            return Ok(new { message = "User activated successfully" });
        }

        /// <summary>
        /// Logout - Revoke refresh token and logout user
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out Guid userId))
                return Unauthorized();

            await _userService.RevokeRefreshTokenAsync(userId, request.RefreshToken);
            return Ok(new { message = "Logged out successfully" });
        }
    }

    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = null!;
    }

    public class UpdateUserDto
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }

    public class LogoutRequestDto
    {
        public string RefreshToken { get; set; } = null!;
    }
}