using Microsoft.EntityFrameworkCore;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Infrastructure.Data
{
    public class ACMDbContext : DbContext
    {
        public ACMDbContext(DbContextOptions<ACMDbContext> options) : base(options)
        {
        }

        // Add your new DbSet properties right here inside the class!
        public DbSet<Module> Modules { get; set; } = null!;
        public DbSet<Topic> Topics { get; set; } = null!;
        public DbSet<StudyMaterial> StudyMaterials { get; set; } = null!;
        // Member 3 (Your Tables)
        public DbSet<StudySession> StudySessions { get; set; }
        public DbSet<DialogueTurn> DialogueTurns { get; set; }

        // Note: The other 3 members will add their DbSets here later.
        // public DbSet<User> Users { get; set; } 
        // public DbSet<Module> Modules { get; set; } 
        // public DbSet<MasteryReport> MasteryReports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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