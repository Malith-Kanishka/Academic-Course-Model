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

                // 0. Backfill short IDs (e.g. "ST001") for any user created before this feature existed
                await BackfillShortIdsAsync();

                // 1. Seed Department Head accounts (Matches frontend 'Admin@123')
                var deptHead = await EnsureUserExistsAsync("depthead@acm.edu", "Department", "Head", "Admin@123", UserRole.DepartmentHead, null);
                await EnsureUserExistsAsync("admin@acm.edu", "System", "Admin", "AdminPassword123!", UserRole.DepartmentHead, null);

                Guid adminId = deptHead.Id;

                // 2. Seed Lecturer (Matches frontend 'Lecturer@123')
                await EnsureUserExistsAsync("lecturer@acm.edu", "Dr.", "Lecturer", "Lecturer@123", UserRole.Lecturer, adminId);

                // 3. Seed Teacher (Matches frontend 'Teacher@123')
                await EnsureUserExistsAsync("teacher@acm.edu", "John", "Teacher", "Teacher@123", UserRole.Teacher, adminId);

                // 4. Seed Primary Student (Matches frontend 'student@acm.edu' / 'Student@123')
                var student1 = await EnsureUserExistsAsync("student@acm.edu", "Alice", "Smith", "Student@123", UserRole.Student, adminId);

                // Additional demo students
                var student2 = await EnsureUserExistsAsync("student1@acm.edu", "Alice", "Johnson", "Student@123", UserRole.Student, adminId);
                var student3 = await EnsureUserExistsAsync("student2@acm.edu", "Bob", "Smith", "Student@123", UserRole.Student, adminId);

                // 5. Seed Test Module & Topic
                await SeedTestModuleAsync();

                // 6. Seed dummy mastery reports / remedial plans for the Department Admin Approvals inbox
                await SeedApprovalDemoDataAsync(student1.Id, student2.Id, student3.Id);

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
                    ShortId = existingUser.ShortId ?? "—",
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

        /// <summary>
        /// Assigns a role-prefixed short ID (e.g. "ST001") to any user row that predates this
        /// feature. Idempotent - only touches rows where ShortId is still unset.
        /// </summary>
        private async Task BackfillShortIdsAsync()
        {
            var usersMissingShortId = await _context.Users
                .Where(u => u.ShortId == null || u.ShortId == "")
                .OrderBy(u => u.Role)
                .ThenBy(u => u.CreatedAt)
                .ToListAsync();

            if (usersMissingShortId.Count == 0)
            {
                return;
            }

            var nextNumberByRole = new Dictionary<UserRole, int>();
            var existingShortIds = await _context.Users
                .Where(u => u.ShortId != null && u.ShortId != "")
                .Select(u => new { u.Role, u.ShortId })
                .ToListAsync();

            foreach (var group in existingShortIds.GroupBy(u => u.Role))
            {
                var prefix = group.Key.ShortIdPrefix();
                var max = 0;
                foreach (var entry in group)
                {
                    if (entry.ShortId!.StartsWith(prefix) && int.TryParse(entry.ShortId.Substring(prefix.Length), out var number))
                    {
                        max = Math.Max(max, number);
                    }
                }
                nextNumberByRole[group.Key] = max;
            }

            foreach (var user in usersMissingShortId)
            {
                var next = nextNumberByRole.TryGetValue(user.Role, out var current) ? current + 1 : 1;
                nextNumberByRole[user.Role] = next;
                user.ShortId = $"{user.Role.ShortIdPrefix()}{next:D3}";
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"✓ Backfilled short IDs for {usersMissingShortId.Count} existing user(s)");
        }

        private async Task SeedTestModuleAsync()
        {
            var module = await _context.Modules
                .FirstOrDefaultAsync(m => m.Code == "CS101");
            if (module is null)
            {
                module = new Module
                {
                    Id = Guid.NewGuid(),
                    Title = "Intro to Computer Science",
                    Code = "CS101",
                    Description = "A foundational module covering the basics of computer science.",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Modules.Add(module);
            }

            var topic1 = await _context.Topics
                .FirstOrDefaultAsync(topic => topic.ModuleId == module.Id && topic.OrderIndex == 1);
            if (topic1 is null)
            {
                topic1 = new Topic
                {
                    Id = Guid.NewGuid(),
                    ModuleId = module.Id,
                    OrderIndex = 1,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Topics.Add(topic1);
            }
            topic1.Title = "Introduction to Data Mining and Machine Learning";
            topic1.ContentDescription = "Overview of data mining principles, machine learning concepts, and predictive analytics techniques.";

            var topic2 = await _context.Topics
                .FirstOrDefaultAsync(topic => topic.ModuleId == module.Id && topic.OrderIndex == 2);
            if (topic2 is null)
            {
                topic2 = new Topic
                {
                    Id = Guid.NewGuid(),
                    ModuleId = module.Id,
                    OrderIndex = 2,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Topics.Add(topic2);
            }
            topic2.Title = "Data Understanding";
            topic2.ContentDescription = "Exploration, collection, quality assessment, and initial insights into dataset structures.";

            await _context.SaveChangesAsync();
            _logger.LogInformation("✓ Ensured test Module CS101 has the first two canonical topics");
        }

        /// <summary>
        /// Seeds MasteryReport/RemedialPlan pairs so the Department Admin Approvals inbox
        /// (GET /api/Approval/pending) has data to show without running a real study session.
        /// </summary>
        private async Task SeedApprovalDemoDataAsync(Guid student1Id, Guid student2Id, Guid student3Id)
        {
            if (await _context.RemedialPlans.AnyAsync())
            {
                return;
            }

            var scenarios = new[]
            {
                new
                {
                    StudentId = student1Id,
                    Topic = "Introduction to Algorithms",
                    Score = 42,
                    Misconceptions = new List<string> { "Confuses Big-O with Big-Omega", "Cannot trace recursive stack calls" },
                    Status = "PAUSED_FOR_PROFESSOR_APPROVAL",
                },
                new
                {
                    StudentId = student1Id,
                    Topic = "Object-Oriented Design Principles",
                    Score = 58,
                    Misconceptions = new List<string> { "Conflates inheritance with composition" },
                    Status = "PAUSED_FOR_PROFESSOR_APPROVAL",
                },
                new
                {
                    StudentId = student2Id,
                    Topic = "Database Normalization",
                    Score = 35,
                    Misconceptions = new List<string> { "Cannot identify transitive dependencies", "Confuses 2NF with 3NF" },
                    Status = "PAUSED_FOR_PROFESSOR_APPROVAL",
                },
                new
                {
                    StudentId = student2Id,
                    Topic = "Operating System Scheduling",
                    Score = 71,
                    Misconceptions = new List<string> { "Misapplies round-robin quantum calculation" },
                    Status = "PAUSED_FOR_PROFESSOR_APPROVAL",
                },
                new
                {
                    StudentId = student3Id,
                    Topic = "Introduction to Algorithms",
                    Score = 60,
                    Misconceptions = new List<string> { "Misunderstands divide-and-conquer recurrence" },
                    Status = "PAUSED_FOR_PROFESSOR_APPROVAL",
                },
                new
                {
                    StudentId = student3Id,
                    Topic = "Networking Fundamentals",
                    Score = 28,
                    Misconceptions = new List<string> { "Confuses TCP handshake steps", "Cannot explain subnet masking" },
                    Status = "PAUSED_FOR_PROFESSOR_APPROVAL",
                },
                new
                {
                    StudentId = student1Id,
                    Topic = "Data Structures: Trees",
                    Score = 90,
                    Misconceptions = new List<string>(),
                    Status = "APPROVED_ACTIVE",
                },
                new
                {
                    StudentId = student3Id,
                    Topic = "Software Testing Fundamentals",
                    Score = 55,
                    Misconceptions = new List<string> { "Cannot distinguish unit vs integration tests" },
                    Status = "REJECTED",
                },
            };

            var random = new Random();

            foreach (var scenario in scenarios)
            {
                var sessionId = Guid.NewGuid();
                var createdAt = DateTime.UtcNow.AddHours(-random.Next(1, 96));

                var report = new MasteryReport
                {
                    SessionId = sessionId,
                    StudentId = scenario.StudentId,
                    TopicName = scenario.Topic,
                    MasteryScore = scenario.Score,
                    FlaggedMisconceptions = scenario.Misconceptions,
                    CreatedAt = createdAt,
                };

                var isDecided = scenario.Status != "PAUSED_FOR_PROFESSOR_APPROVAL";
                var plan = new RemedialPlan
                {
                    SessionId = sessionId,
                    MasteryReportId = report.Id,
                    StudentId = scenario.StudentId,
                    ActionItems = scenario.Misconceptions.Select(m => $"Review concept: {m}").ToList(),
                    ApprovalStatus = scenario.Status,
                    ProfessorNotes = scenario.Status switch
                    {
                        "APPROVED_ACTIVE" => "Looks good - proceed with the remedial plan as written.",
                        "REJECTED" => "Plan is too lenient given the repeated misconceptions - please revise before resubmitting.",
                        _ => null,
                    },
                    ApprovedAt = isDecided ? createdAt.AddHours(random.Next(1, 24)) : null,
                    CreatedAt = createdAt,
                    UpdatedAt = isDecided ? createdAt.AddHours(random.Next(1, 24)) : createdAt,
                };

                report.RemedialPlan = plan;
                _context.MasteryReports.Add(report);
                _context.RemedialPlans.Add(plan);

                if (isDecided)
                {
                    _context.ApprovalLogs.Add(new ApprovalLog
                    {
                        PlanId = plan.Id,
                        Decision = scenario.Status,
                        ProfessorFeedback = plan.ProfessorNotes,
                        Timestamp = plan.ApprovedAt!.Value,
                    });
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"✓ Seeded {scenarios.Length} demo mastery report / remedial plan pairs for the Approvals inbox");
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