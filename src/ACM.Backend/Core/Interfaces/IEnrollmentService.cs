using ACM.Backend.Core.DTOs.Enrollment;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Core.Interfaces;

public interface IEnrollmentService
{
    Task<EnrollmentAssignmentResponse> AssignStudentAsync(
        Guid? studentId,
        string? studentEmail,
        Guid moduleId);

    Task<IEnumerable<Module>> GetModulesForStudentAsync(Guid studentId);
    Task<IReadOnlyCollection<Guid>> GetActiveModuleIdsAsync(Guid studentId);
    Task<bool> HasTopicEnrollmentAsync(Guid studentId, Guid topicId);
}