using System;
using System.Collections.Generic;

namespace ACM.Backend.Core.Entities
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // Human-readable identifier shown in the UI, e.g. "ST001", "LC001". Assigned once
        // at registration (see UserService.GenerateShortIdAsync) and never changes. Nullable
        // at the DB level so the column/unique index can be added without conflicting default
        // values across pre-existing rows; DatabaseSeeder backfills it for those on startup.
        public string? ShortId { get; set; }
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Guid? CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }

        // Navigation: Agent Personality Profile (for Students)
        public AgentPersonality? AgentPersonality { get; set; }

        // Navigation: Refresh Tokens
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        public string FullName => $"{FirstName} {LastName}";
    }

    public enum UserRole
    {
        DepartmentHead = 0,
        Lecturer = 1,
        Teacher = 2,
        Student = 3
    }

    public static class UserRoleExtensions
    {
        // Prefix used when generating a user's ShortId, e.g. UserRole.Student -> "ST" -> "ST001".
        public static string ShortIdPrefix(this UserRole role) => role switch
        {
            UserRole.DepartmentHead => "DH",
            UserRole.Lecturer => "LC",
            UserRole.Teacher => "TC",
            UserRole.Student => "ST",
            _ => "US"
        };
    }
}
