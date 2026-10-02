namespace ACM.Tests.Unit;

using ACM.Backend.Core.Entities;
using ACM.Backend.Infrastructure.Data;
using ACM.Backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class StudentEnrollmentTests
{
    [Fact]
    public async Task AssignStudentByEmail_OnlyReturnsModulesEnrolledByThatStudent()
    {
        await using var context = CreateContext();
        var student = CreateUser("student@example.edu", UserRole.Student);
        var otherStudent = CreateUser("other@example.edu", UserRole.Student);
        var module = CreateModule("SE101", "Foundations");
        var otherModule = CreateModule("SE102", "Databases");
        context.Users.AddRange(student, otherStudent);
        context.Modules.AddRange(module, otherModule);
        await context.SaveChangesAsync();

        var service = new EnrollmentService(context);
        var assignment = await service.AssignStudentAsync(null, student.Email, module.Id);
        var studentModules = await service.GetModulesForStudentAsync(student.Id);
        var otherStudentModules = await service.GetModulesForStudentAsync(otherStudent.Id);

        Assert.Equal(student.Email, assignment.StudentEmail);
        Assert.Equal(module.Id, assignment.ModuleId);
        Assert.Equal([module.Id], studentModules.Select(item => item.Id));
        Assert.Empty(otherStudentModules);
    }

    [Fact]
    public async Task AssignStudent_RejectsNonStudentAccount()
    {
        await using var context = CreateContext();
        var professor = CreateUser("professor@example.edu", UserRole.Lecturer);
        var module = CreateModule("SE201", "Advanced topics");
        context.Users.Add(professor);
        context.Modules.Add(module);
        await context.SaveChangesAsync();

        var service = new EnrollmentService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AssignStudentAsync(professor.Id, null, module.Id));
    }

    private static ACMDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ACMDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ACMDbContext(options);
    }

    private static User CreateUser(string email, UserRole role) => new()
    {
        Email = email,
        FirstName = "Test",
        LastName = "User",
        PasswordHash = "test-hash",
        Role = role
    };

    private static Module CreateModule(string code, string title) => new()
    {
        Code = code,
        Title = title
    };
}
