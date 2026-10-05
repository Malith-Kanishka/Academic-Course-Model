using ACM.Backend.Core.DTOs.Enrollment;
using ACM.Backend.Core.Entities;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ACM.Backend.Services;

public class EnrollmentService : IEnrollmentService
{
    private readonly ACMDbContext _context;

    public EnrollmentService(ACMDbContext context)
    {
        _context = context;
    }

    public async Task<EnrollmentAssignmentResponse> AssignStudentAsync(
        Guid? studentId,
        string? studentEmail,
        Guid moduleId)
    {
        var student = studentId.HasValue
            ? await _context.Users.FirstOrDefaultAsync(user => user.Id == studentId.Value)
            : await _context.Users.FirstOrDefaultAsync(user =>
                user.Email.ToLower() == studentEmail!.Trim().ToLower());

        if (student is null || !student.IsActive)
            throw new KeyNotFoundException("An active student account could not be found.");
        if (student.Role != UserRole.Student)
            throw new InvalidOperationException("Only student accounts can be enrolled.");

        var module = await _context.Modules.FirstOrDefaultAsync(item => item.Id == moduleId);
        if (module is null)
            throw new KeyNotFoundException("The requested module could not be found.");

        var enrollment = await _context.StudentEnrollments.FirstOrDefaultAsync(item =>
            item.StudentId == student.Id && item.ModuleId == moduleId);

        if (enrollment is null)
        {
            enrollment = new StudentEnrollment
            {
                StudentId = student.Id,
                ModuleId = moduleId
            };
            _context.StudentEnrollments.Add(enrollment);
        }
        else if (!enrollment.IsActive)
        {
            enrollment.IsActive = true;
            enrollment.EnrolledAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return new EnrollmentAssignmentResponse(
            student.Id,
            student.Email,
            module.Id,
            module.Title,
            enrollment.IsActive,
            enrollment.EnrolledAt);
    }

    public async Task<IEnumerable<Module>> GetModulesForStudentAsync(Guid studentId)
    {
        return await _context.Modules
            .AsNoTracking()
            .Where(module => _context.StudentEnrollments.Any(enrollment =>
                enrollment.StudentId == studentId
                && enrollment.ModuleId == module.Id
                && enrollment.IsActive))
            .Include(module => module.Topics)
            .ThenInclude(topic => topic.StudyMaterials)
            .OrderBy(module => module.Code)
            .ToListAsync();
    }

    public async Task<IReadOnlyCollection<Guid>> GetActiveModuleIdsAsync(Guid studentId)
    {
        return await _context.StudentEnrollments
            .AsNoTracking()
            .Where(enrollment => enrollment.StudentId == studentId && enrollment.IsActive)
            .Select(enrollment => enrollment.ModuleId)
            .ToListAsync();
    }

    public Task<bool> HasTopicEnrollmentAsync(Guid studentId, Guid topicId)
    {
        return _context.StudentEnrollments.AnyAsync(enrollment =>
            enrollment.StudentId == studentId
            && enrollment.IsActive
            && _context.Topics.Any(topic =>
                topic.Id == topicId && topic.ModuleId == enrollment.ModuleId));
    }
}