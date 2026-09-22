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
        /// <remarks>
        /// Authenticates a user with their email and password.
        /// Returns access token (10 min expiry) and refresh token (7 day expiry).
        /// No authorization required.
        ///
        /// Sample request:
        ///     POST /api/auth/login
        ///     {
        ///         "email": "user@acm.edu",
        ///         "password": "Password123!"
        ///     }
        /// </remarks>
        /// <param name="request">Login credentials (email and password)</param>
        /// <returns>AuthResponse with tokens and user info if successful, error message if failed</returns>
        /// <response code="200">Authentication successful, returns access token and refresh token</response>
        /// <response code="401">Invalid email or password</response>
        /// <response code="400">Bad request - missing or invalid data</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] AuthRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Email and password are required");

            var result = await _userService.AuthenticateAsync(request);

            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }

        /// <summary>
        /// Refresh Access Token - Get new access token using refresh token
        /// </summary>
        /// <remarks>
        /// Issues a new access token using a valid refresh token.
        /// Implements token rotation - old refresh token is revoked and new one is issued.
        /// No authorization required.
        ///
        /// Sample request:
        ///     POST /api/auth/refresh
        ///     {
        ///         "refreshToken": "base64encodedtoken..."
        ///     }
        /// </remarks>
        /// <param name="request">Contains valid refresh token</param>
        /// <returns>New access token and refresh token</returns>
        /// <response code="200">Token refreshed successfully</response>
        /// <response code="401">Invalid or expired refresh token</response>
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
        /// <remarks>
        /// Creates a new user account with specified role.
        /// Only DepartmentHead users can register new users.
        /// If role is Student, an AgentPersonality profile is automatically created.
        /// Requires valid JWT access token.
        ///
        /// Sample request:
        ///     POST /api/auth/register
        ///     {
        ///         "email": "newuser@acm.edu",
        ///         "firstName": "John",
        ///         "lastName": "Doe",
        ///         "password": "Password123!",
        ///         "role": "Student"
        ///     }
        /// </remarks>
        /// <param name="request">User registration details</param>
        /// <returns>Created user object</returns>
        /// <response code="201">User created successfully</response>
        /// <response code="400">Invalid input or email already exists</response>
        /// <response code="403">Only DepartmentHead can register users</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
        [HttpPost("register")]
        [Authorize]
        [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<UserResponseDto>> Register([FromBody] RegisterUserDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Get current user ID from claims
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim?.Value, out Guid createdByUserId))
                return Unauthorized("User ID not found in token");

            // Verify that the current user is DepartmentHead
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
        /// <remarks>
        /// Retrieves full user information including email, name, role, and status.
        /// Users can only retrieve their own record; DepartmentHead can retrieve anyone's.
        ///
        /// Sample request:
        ///     GET /api/auth/1
        /// </remarks>
        /// <param name="id">User ID</param>
        /// <returns>User details object</returns>
        /// <response code="200">User found and returned</response>
        /// <response code="404">User not found</response>
        /// <response code="403">Forbidden - can only view your own record</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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
        /// <remarks>
        /// Searches for a user by their email address.
        /// Users can only look up their own record by email; DepartmentHead can look up anyone.
        ///
        /// Sample request:
        ///     GET /api/auth/email/user@acm.edu
        /// </remarks>
        /// <param name="email">User email address</param>
        /// <returns>User details if found</returns>
        /// <response code="200">User found and returned</response>
        /// <response code="404">User with email not found</response>
        /// <response code="403">Forbidden - can only view your own record</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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
        /// <remarks>
        /// Returns a list of all users in the system.
        /// Only accessible to DepartmentHead (system administrators).
        ///
        /// Sample request:
        ///     GET /api/auth
        /// </remarks>
        /// <returns>List of all users</returns>
        /// <response code="200">Returns list of all users</response>
        /// <response code="403">User does not have DepartmentHead role</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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
        /// <remarks>
        /// Returns all users with a specific role.
        /// Only accessible to DepartmentHead.
        /// Valid roles: DepartmentHead, Lecturer, Teacher, Student
        ///
        /// Sample request:
        ///     GET /api/auth/role/Student
        /// </remarks>
        /// <param name="role">User role to filter by (DepartmentHead, Lecturer, Teacher, Student)</param>
        /// <returns>List of users with specified role</returns>
        /// <response code="200">Returns filtered list of users</response>
        /// <response code="400">Invalid role specified</response>
        /// <response code="403">User does not have DepartmentHead role</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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
        /// <remarks>
        /// Updates a user's first and last name.
        /// Users can only update their own profile, except DepartmentHead can update any user.
        ///
        /// Sample request:
        ///     PUT /api/auth/1
        ///     {
        ///         "firstName": "Jonathan",
        ///         "lastName": "Smith"
        ///     }
        /// </remarks>
        /// <param name="id">User ID to update</param>
        /// <param name="request">Updated first and last name</param>
        /// <returns>No content</returns>
        /// <response code="204">User updated successfully</response>
        /// <response code="404">User not found</response>
        /// <response code="403">Forbidden - can only update own profile</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check authorization: user can update own profile or DepartmentHead can update anyone
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
        /// <remarks>
        /// Allows a user to change their password.
        /// Users can only change their own password.
        /// Requires current password for verification.
        ///
        /// Sample request:
        ///     POST /api/auth/1/change-password
        ///     {
        ///         "currentPassword": "OldPass123!",
        ///         "newPassword": "NewPass456!"
        ///     }
        /// </remarks>
        /// <param name="id">User ID</param>
        /// <param name="request">Current and new password</param>
        /// <returns>Success message</returns>
        /// <response code="200">Password changed successfully</response>
        /// <response code="400">Current password is incorrect</response>
        /// <response code="403">Forbidden - can only change own password</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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
        /// <remarks>
        /// Deactivates a user account (soft delete).
        /// Deactivated users cannot login but their data is preserved.
        /// Only DepartmentHead can deactivate users.
        ///
        /// Sample request:
        ///     POST /api/auth/1/deactivate
        /// </remarks>
        /// <param name="id">User ID to deactivate</param>
        /// <returns>Success message</returns>
        /// <response code="200">User deactivated successfully</response>
        /// <response code="404">User not found</response>
        /// <response code="403">User does not have DepartmentHead role</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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
        /// <remarks>
        /// Reactivates a previously deactivated user account.
        /// Activated users can login again.
        /// Only DepartmentHead can activate users.
        ///
        /// Sample request:
        ///     POST /api/auth/1/activate
        /// </remarks>
        /// <param name="id">User ID to activate</param>
        /// <returns>Success message</returns>
        /// <response code="200">User activated successfully</response>
        /// <response code="404">User not found</response>
        /// <response code="403">User does not have DepartmentHead role</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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
        /// <remarks>
        /// Logs out a user by revoking their refresh token.
        /// After logout, refresh token cannot be used to get new access tokens.
        /// Users must login again to get new tokens.
        ///
        /// Sample request:
        ///     POST /api/auth/logout
        ///     {
        ///         "refreshToken": "base64token..."
        ///     }
        /// </remarks>
        /// <param name="request">Contains refresh token to revoke</param>
        /// <returns>Success message</returns>
        /// <response code="200">Logged out successfully</response>
        /// <response code="401">Unauthorized - invalid or missing token</response>
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

    // Additional DTOs
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
