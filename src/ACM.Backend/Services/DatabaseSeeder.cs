using ACM.Backend.Core.DTOs.Member1;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ACM.Backend.Services
{
    public class DatabaseSeeder
    {
        private readonly ACMDbContext _context;
        private readonly IUserService _userService;
        private readonly ILogger<DatabaseSeeder> _logger;

        public DatabaseSeeder(ACMDbContext context, IUserService userService, ILogger<DatabaseSeeder> logger)
        {
            _context = context;
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// Seeds the database with initial test data and aligns credentials with frontend quick-login defaults.
        /// </summary>
        public async Task SeedAsync()
        {
            try
            {
                _logger.LogInformation("Checking and running database seeding...");

                // 1. Seed Department Head accounts (Matches frontend 'Admin@123')
                var deptHead = await EnsureUserExistsAsync("depthead@acm.edu", "Department", "Head", "Admin@123", UserRole.DepartmentHead, null);
                await EnsureUserExistsAsync("admin@acm.edu", "System", "Admin", "AdminPassword123!", UserRole.DepartmentHead, null);

                Guid adminId = deptHead.Id;

                // 2. Seed Lecturer (Matches frontend 'Lecturer@123')
                await EnsureUserExistsAsync("lecturer@acm.edu", "Dr.", "Lecturer", "Lecturer@123", UserRole.Lecturer, adminId);

                // 3. Seed Teacher (Matches frontend 'Teacher@123')
                await EnsureUserExistsAsync("teacher@acm.edu", "John", "Teacher", "Teacher@123", UserRole.Teacher, adminId);

                // 4. Seed Primary Student (Matches frontend 'student@acm.edu' / 'Student@123')
                await EnsureUserExistsAsync("student@acm.edu", "Alice", "Smith", "Student@123", UserRole.Student, adminId);

                // Additional demo students
                await EnsureUserExistsAsync("student1@acm.edu", "Alice", "Johnson", "Student@123", UserRole.Student, adminId);
                await EnsureUserExistsAsync("student2@acm.edu", "Bob", "Smith", "Student@123", UserRole.Student, adminId);

                // 5. Seed Test Module & Topic
                await SeedTestModuleAsync();

                _logger.LogInformation("✓ Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error during database seeding: {ex.Message}");
                throw;
            }
        }

        private async Task<UserResponseDto> EnsureUserExistsAsync(string email, string firstName, string lastName, string password, UserRole role, Guid? createdByUserId)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (existingUser != null)
            {
                // Update password hash and active status to guarantee working quick-login credentials
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                existingUser.IsActive = true;
                existingUser.FirstName = firstName;
                existingUser.LastName = lastName;
                existingUser.Role = role;

                await _context.SaveChangesAsync();
                _logger.LogInformation($"✓ Verified/Updated seed user: {email}");

                return new UserResponseDto
                {
                    Id = existingUser.Id,
                    Email = existingUser.Email,
                    FirstName = existingUser.FirstName,
                    LastName = existingUser.LastName,
                    Role = existingUser.Role
                };
            }

            var registerDto = new RegisterUserDto
            {
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Password = password,
                Role = role
            };

            var createdUser = await _userService.RegisterUserAsync(registerDto, createdByUserId);
            _logger.LogInformation($"✓ Created missing seed user: {createdUser.Email}");
            return createdUser;
        }

        private async Task SeedTestModuleAsync()
        {
            if (await _context.Modules.AnyAsync(m => m.Code == "CS101"))
            {
                return;
            }

            var module = new Module
            {
                Id = Guid.NewGuid(),
                Title = "Intro to Computer Science",
                Code = "CS101",
                Description = "A foundational module covering the basics of computer science.",
                CreatedAt = DateTime.UtcNow
            };

            _context.Modules.Add(module);

            var topic = new Topic
            {
                Id = Guid.NewGuid(),
                ModuleId = module.Id,
                Title = "Introduction to Algorithms",
                ContentDescription = "Covers basic algorithmic thinking, pseudocode, and complexity.",
                OrderIndex = 1,
                CreatedAt = DateTime.UtcNow
            };

            _context.Topics.Add(topic);

            await _context.SaveChangesAsync();
            _logger.LogInformation("✓ Created test Module: CS101 - Intro to Computer Science (with 1 topic)");
        }
    }

    /// <summary>
    /// Extension methods for database seeding
    /// </summary>
    public static class DatabaseSeederExtensions
    {
        public static async Task SeedDatabaseAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ACMDbContext>();
            var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<DatabaseSeeder>>();

            var seeder = new DatabaseSeeder(context, userService, logger);
            await seeder.SeedAsync();
        }
    }
}