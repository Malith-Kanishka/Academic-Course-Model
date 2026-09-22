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
        /// Seeds the database with initial test data
        /// </summary>
        public async Task SeedAsync()
        {
            try
            {
                // Check if data already exists
                if (await _context.Users.AnyAsync())
                {
                    _logger.LogInformation("Database already seeded. Skipping.");
                    return;
                }

                _logger.LogInformation("Starting database seeding...");

                // Seed DepartmentHead (Admin)
                var admin = await SeedDepartmentHeadAsync();
                _logger.LogInformation($"✓ Created DepartmentHead: {admin.Email}");

                // Seed Lecturer
                var lecturer = await SeedLecturerAsync(admin.Id);
                _logger.LogInformation($"✓ Created Lecturer: {lecturer.Email}");

                // Seed Teacher
                var teacher = await SeedTeacherAsync(admin.Id);
                _logger.LogInformation($"✓ Created Teacher: {teacher.Email}");

                // Seed Students (with auto-generated AgentPersonalities)
                var student1 = await SeedStudentAsync("student1@acm.edu", "Alice", "Johnson", admin.Id);
                _logger.LogInformation($"✓ Created Student: {student1.Email} (with AgentPersonality)");

                var student2 = await SeedStudentAsync("student2@acm.edu", "Bob", "Smith", admin.Id);
                _logger.LogInformation($"✓ Created Student: {student2.Email} (with AgentPersonality)");

                var student3 = await SeedStudentAsync("student3@acm.edu", "Carol", "Davis", admin.Id);
                _logger.LogInformation($"✓ Created Student: {student3.Email} (with AgentPersonality)");

                // Seed a test Module + Topic (inserted directly - bypasses the AI audit
                // service in CurriculumService.CreateTopicAsync, which isn't running in dev)
                await SeedTestModuleAsync();
                _logger.LogInformation("✓ Created test Module: CS101 - Intro to Computer Science (with 1 topic)");

                _logger.LogInformation("✓ Database seeding completed successfully!");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error seeding database: {ex.Message}");
                throw;
            }
        }

        private async Task<UserResponseDto> SeedDepartmentHeadAsync()
        {
            var deptHeadDto = new RegisterUserDto
            {
                Email = "admin@acm.edu",
                FirstName = "System",
                LastName = "Admin",
                Password = "AdminPassword123!",
                Role = UserRole.DepartmentHead
            };

            return await _userService.RegisterUserAsync(deptHeadDto, null);
        }

        private async Task<UserResponseDto> SeedLecturerAsync(int createdByUserId)
        {
            var lecturerDto = new RegisterUserDto
            {
                Email = "lecturer@acm.edu",
                FirstName = "Dr.",
                LastName = "Lecturer",
                Password = "LecturerPass123!",
                Role = UserRole.Lecturer
            };

            return await _userService.RegisterUserAsync(lecturerDto, createdByUserId);
        }

        private async Task<UserResponseDto> SeedTeacherAsync(int createdByUserId)
        {
            var teacherDto = new RegisterUserDto
            {
                Email = "teacher@acm.edu",
                FirstName = "John",
                LastName = "Teacher",
                Password = "TeacherPass123!",
                Role = UserRole.Teacher
            };

            return await _userService.RegisterUserAsync(teacherDto, createdByUserId);
        }

        private async Task<UserResponseDto> SeedStudentAsync(string email, string firstName, string lastName, int createdByUserId)
        {
            var studentDto = new RegisterUserDto
            {
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Password = "StudentPass123!",
                Role = UserRole.Student
            };

            return await _userService.RegisterUserAsync(studentDto, createdByUserId);
        }

        private async Task SeedTestModuleAsync()
        {
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
        }
    }

    /// <summary>
    /// Extension methods for database seeding
    /// </summary>
    public static class DatabaseSeederExtensions
    {
        /// <summary>
        /// Seeds the database with initial test data
        /// </summary>
        public static async Task SeedDatabaseAsync(this WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ACMDbContext>();
                var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<DatabaseSeeder>>();

                var seeder = new DatabaseSeeder(context, userService, logger);
                await seeder.SeedAsync();
            }
        }
    }
}
