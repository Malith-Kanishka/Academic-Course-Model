using Microsoft.EntityFrameworkCore;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Infrastructure.Data
{
    public class ACMDbContext : DbContext
    {
        public ACMDbContext(DbContextOptions<ACMDbContext> options) : base(options)
        {
        }

        // Member 1 - Authentication & User Management
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<AgentPersonality> AgentPersonalities { get; set; } = null!;

        // Add your new DbSet properties right here inside the class!
        public DbSet<Module> Modules { get; set; } = null!;
        public DbSet<Topic> Topics { get; set; } = null!;
        public DbSet<StudyMaterial> StudyMaterials { get; set; } = null!;
        // Member 3 (Your Tables)
        public DbSet<StudySession> StudySessions { get; set; }
        public DbSet<DialogueTurn> DialogueTurns { get; set; }

        // Note: The other members will add their DbSets here.
        // public DbSet<MasteryReport> MasteryReports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User entity configuration
            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // User to RefreshToken relationship (One-to-Many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // User to AgentPersonality relationship (One-to-One)
            modelBuilder.Entity<User>()
                .HasOne(u => u.AgentPersonality)
                .WithOne(ap => ap.StudentUser)
                .HasForeignKey<AgentPersonality>(ap => ap.StudentUserId)
                .OnDelete(DeleteBehavior.Cascade);

            // RefreshToken entity configuration
            modelBuilder.Entity<RefreshToken>()
                .HasKey(rt => rt.Id);

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => new { rt.UserId, rt.Token })
                .IsUnique();

            // AgentPersonality entity configuration
            modelBuilder.Entity<AgentPersonality>()
                .HasKey(ap => ap.Id);

            // Configure the relationship between Session and DialogueTurns
            // If a session is deleted, delete all its dialogue turns (Cascade)
            modelBuilder.Entity<StudySession>()
                .HasMany(s => s.DialogueTurns)
                .WithOne(d => d.Session)
                .HasForeignKey(d => d.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}