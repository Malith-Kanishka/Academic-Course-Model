namespace ACM.Backend.Core.Entities;

public class StudentEnrollment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid ModuleId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    public User? Student { get; set; }
    public Module? Module { get; set; }
}