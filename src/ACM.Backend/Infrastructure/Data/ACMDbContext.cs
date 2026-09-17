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
    }
}