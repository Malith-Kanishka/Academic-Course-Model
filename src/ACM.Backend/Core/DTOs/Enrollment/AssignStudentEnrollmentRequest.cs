using System.ComponentModel.DataAnnotations;

namespace ACM.Backend.Core.DTOs.Enrollment;

public sealed class AssignStudentEnrollmentRequest
{
    public Guid? StudentId { get; init; }

    [EmailAddress]
    public string? StudentEmail { get; init; }

    [Required]
    public Guid ModuleId { get; init; }
}

public sealed record EnrollmentAssignmentResponse(
    Guid StudentId,
    string StudentEmail,
    Guid ModuleId,
    string ModuleTitle,
    bool IsActive,
    DateTime EnrolledAt);