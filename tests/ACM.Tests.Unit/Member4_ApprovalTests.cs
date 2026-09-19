namespace ACM.Tests.Unit;

using System;
using System.Linq;
using System.Threading.Tasks;
using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Services;
using Xunit;

public class Member4_ApprovalTests
{
    private readonly ApprovalService _approvalService;

    public Member4_ApprovalTests()
    {
        _approvalService = new ApprovalService();
    }

    [Fact]
    public async Task ProcessSessionEvaluation_ScoreBelow65_TriggersPausedForProfessorApproval()
    {
        // Arrange: Student scored 50% (< 65%) with 1 flagged misconception
        var dto = new SessionFinalTranscriptDTO
        {
            SessionId = Guid.NewGuid(),
            StudentId = Guid.NewGuid(),
            TopicName = "ASP.NET Core Middleware",
            FinalScore = 50,
            FlaggedMisconceptions = new() { "Misunderstood Transient vs Singleton lifetimes" }
        };

        // Act
        var result = await _approvalService.ProcessSessionEvaluationAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.RemedialPlan);
        Assert.Equal("PAUSED_FOR_PROFESSOR_APPROVAL", result.RemedialPlan.ApprovalStatus);
        Assert.Single(result.RemedialPlan.ActionItems);
    }

    [Fact]
    public async Task ProcessSessionEvaluation_Score65OrAboveNoMisconceptions_ApprovedAutomatically()
    {
        // Arrange: Student scored 85% with no misconceptions
        var dto = new SessionFinalTranscriptDTO
        {
            SessionId = Guid.NewGuid(),
            StudentId = Guid.NewGuid(),
            TopicName = "Dependency Injection",
            FinalScore = 85,
            FlaggedMisconceptions = new()
        };

        // Act
        var result = await _approvalService.ProcessSessionEvaluationAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.RemedialPlan);
        Assert.Equal("APPROVED_ACTIVE", result.RemedialPlan.ApprovalStatus);
    }

    [Fact]
    public async Task GetPendingApprovals_ReturnsOnlyPausedPlans()
    {
        // Arrange: Add one passing session and one failing session
        var failingSession = new SessionFinalTranscriptDTO
        {
            SessionId = Guid.NewGuid(),
            StudentId = Guid.NewGuid(),
            TopicName = "C# Generics",
            FinalScore = 40,
            FlaggedMisconceptions = new() { "Type constraints error" }
        };

        var passingSession = new SessionFinalTranscriptDTO
        {
            SessionId = Guid.NewGuid(),
            StudentId = Guid.NewGuid(),
            TopicName = "C# LINQ",
            FinalScore = 90,
            FlaggedMisconceptions = new()
        };

        await _approvalService.ProcessSessionEvaluationAsync(failingSession);
        await _approvalService.ProcessSessionEvaluationAsync(passingSession);

        // Act
        var pendingPlans = await _approvalService.GetPendingApprovalsAsync();

        // Assert
        Assert.Single(pendingPlans);
        Assert.All(pendingPlans, plan => Assert.Equal("PAUSED_FOR_PROFESSOR_APPROVAL", plan.ApprovalStatus));
    }

    [Fact]
    public async Task SubmitProfessorDecision_UpdatesStatusAndNotes()
    {
        // Arrange
        var dto = new SessionFinalTranscriptDTO
        {
            SessionId = Guid.NewGuid(),
            StudentId = Guid.NewGuid(),
            TopicName = "Entity Framework Core",
            FinalScore = 55,
            FlaggedMisconceptions = new() { "N+1 Query Issue" }
        };

        var report = await _approvalService.ProcessSessionEvaluationAsync(dto);
        var planId = report.RemedialPlan!.Id;

        // Act: Professor approves the plan with feedback
        var updatedPlan = await _approvalService.SubmitProfessorDecisionAsync(
            planId, 
            "APPROVED_ACTIVE", 
            "Approved. Student must complete EF Core optimization module."
        );

        // Assert
        Assert.NotNull(updatedPlan);
        Assert.Equal("APPROVED_ACTIVE", updatedPlan.ApprovalStatus);
        Assert.Equal("Approved. Student must complete EF Core optimization module.", updatedPlan.ProfessorNotes);
        Assert.NotNull(updatedPlan.ApprovedAt);
    }
}