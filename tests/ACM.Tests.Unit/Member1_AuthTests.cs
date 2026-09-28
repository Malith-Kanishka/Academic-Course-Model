namespace ACM.Tests.Unit;

using System;
using System.Linq;
using System.Threading.Tasks;
using ACM.Backend.Core.DTOs.Member1;
using ACM.Backend.Core.Entities;
using ACM.Backend.Infrastructure.Data;
using ACM.Backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

public class Member1_AuthTests
{
    private static UserService CreateUserService(ACMDbContext context)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "unit-test-secret-key-at-least-32-characters-long",
                ["Jwt:Issuer"] = "ACM.Backend.Tests",
                ["Jwt:Audience"] = "ACM.Users.Tests",
                ["Jwt:ExpirationMinutes"] = "35",
            })
            .Build();

        var jwtTokenGenerator = new JwtTokenGenerator(configuration);
        return new UserService(context, jwtTokenGenerator, NullLogger<UserService>.Instance);
    }

    private static ACMDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ACMDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ACMDbContext(options);
    }

    private static RegisterUserDto ValidDepartmentHeadRegistration(string email = "newmember@acm.edu") => new()
    {
        Email = email,
        FirstName = "New",
        LastName = "Member",
        Password = "Str0ng!Pass",
        Role = UserRole.Lecturer,
    };

    [Fact]
    public async Task RegisterUserAsync_ValidRequest_CreatesActiveUserWithHashedPassword()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);

        var result = await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), Guid.NewGuid());

        Assert.NotNull(result);
        Assert.Equal("newmember@acm.edu", result.Email);
        Assert.True(result.IsActive);

        var stored = await context.Users.FirstAsync(u => u.Email == "newmember@acm.edu");
        Assert.NotEqual("Str0ng!Pass", stored.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("Str0ng!Pass", stored.PasswordHash));
    }

    [Fact]
    public async Task RegisterUserAsync_DuplicateEmail_ThrowsInvalidOperationException()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);

        await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null));
    }

    [Fact]
    public async Task RegisterUserAsync_StudentRole_CreatesAgentPersonalityProfile()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);

        var dto = ValidDepartmentHeadRegistration("newstudent@acm.edu");
        dto.Role = UserRole.Student;

        var result = await service.RegisterUserAsync(dto, null);

        var profile = await context.AgentPersonalities.FirstOrDefaultAsync(p => p.StudentUserId == result.Id);
        Assert.NotNull(profile);
    }

    [Fact]
    public async Task AuthenticateAsync_ValidCredentials_ReturnsTokens()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);

        var result = await service.AuthenticateAsync(new AuthRequestDto { Email = "newmember@acm.edu", Password = "Str0ng!Pass" });

        Assert.True(result.Success);
        Assert.False(string.IsNullOrEmpty(result.AccessToken));
        Assert.False(string.IsNullOrEmpty(result.RefreshToken));
    }

    [Fact]
    public async Task AuthenticateAsync_WrongPassword_Fails()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);

        var result = await service.AuthenticateAsync(new AuthRequestDto { Email = "newmember@acm.edu", Password = "WrongPassword1!" });

        Assert.False(result.Success);
        Assert.Null(result.AccessToken);
    }

    [Fact]
    public async Task AuthenticateAsync_DeactivatedAccount_Fails()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        var user = await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);
        await service.DeactivateUserAsync(user.Id);

        var result = await service.AuthenticateAsync(new AuthRequestDto { Email = "newmember@acm.edu", Password = "Str0ng!Pass" });

        Assert.False(result.Success);
        Assert.Contains("deactivated", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RefreshTokenAsync_ValidToken_RotatesTokenAndRevokesOldOne()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);
        var loginResult = await service.AuthenticateAsync(new AuthRequestDto { Email = "newmember@acm.edu", Password = "Str0ng!Pass" });

        var refreshResult = await service.RefreshTokenAsync(loginResult.RefreshToken!);

        Assert.True(refreshResult.Success);
        Assert.NotEqual(loginResult.RefreshToken, refreshResult.RefreshToken);

        var oldToken = await context.RefreshTokens.FirstAsync(rt => rt.Token == loginResult.RefreshToken);
        Assert.True(oldToken.IsRevoked);
    }

    [Fact]
    public async Task RefreshTokenAsync_InvalidToken_Fails()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);

        var result = await service.RefreshTokenAsync("not-a-real-token");

        Assert.False(result.Success);
    }

    [Fact]
    public async Task UpdateUserAsync_ChangesNameAndOptionalRole()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        var user = await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);

        var updated = await service.UpdateUserAsync(user.Id, "Updated", "Name", UserRole.Teacher);

        Assert.NotNull(updated);
        Assert.Equal("Updated", updated.FirstName);
        Assert.Equal("Name", updated.LastName);
        Assert.Equal(UserRole.Teacher, updated.Role);
    }

    [Fact]
    public async Task UpdateUserAsync_UnknownUser_ReturnsNull()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);

        var updated = await service.UpdateUserAsync(Guid.NewGuid(), "Ghost", "User");

        Assert.Null(updated);
    }

    [Fact]
    public async Task ActivateDeactivate_TogglesIsActive()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        var user = await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);

        Assert.True(await service.DeactivateUserAsync(user.Id));
        Assert.False((await service.GetUserByIdAsync(user.Id))!.IsActive);

        Assert.True(await service.ActivateUserAsync(user.Id));
        Assert.True((await service.GetUserByIdAsync(user.Id))!.IsActive);
    }

    [Fact]
    public async Task GetAllUsersAsync_FiltersByPartialEmail()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        await service.RegisterUserAsync(ValidDepartmentHeadRegistration("alice@acm.edu"), null);
        await service.RegisterUserAsync(ValidDepartmentHeadRegistration("bob@acm.edu"), null);

        var results = await service.GetAllUsersAsync(email: "ali");

        Assert.Single(results);
        Assert.Equal("alice@acm.edu", results.First().Email);
    }

    [Fact]
    public async Task GetAllUsersAsync_FiltersByRoleAndActiveStatus()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        var lecturer = await service.RegisterUserAsync(ValidDepartmentHeadRegistration("lecturer2@acm.edu"), null);
        await service.DeactivateUserAsync(lecturer.Id);
        await service.RegisterUserAsync(ValidDepartmentHeadRegistration("lecturer3@acm.edu"), null);

        var activeLecturers = await service.GetAllUsersAsync(role: UserRole.Lecturer, isActive: true);

        Assert.Single(activeLecturers);
        Assert.Equal("lecturer3@acm.edu", activeLecturers.First().Email);
    }

    [Fact]
    public async Task ChangePasswordAsync_SamePasswordAsCurrent_Throws()
    {
        using var context = CreateContext();
        var service = CreateUserService(context);
        var user = await service.RegisterUserAsync(ValidDepartmentHeadRegistration(), null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ChangePasswordAsync(user.Id, "Str0ng!Pass", "Str0ng!Pass"));
    }
}
