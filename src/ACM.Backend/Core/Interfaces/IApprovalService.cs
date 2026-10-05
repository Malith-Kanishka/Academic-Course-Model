namespace ACM.Backend.Core.Interfaces;

using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Core.Entities;

public interface IApprovalService
{
    Task<MasteryReport> ProcessSessionEvaluationAsync(SessionFinalTranscriptDTO dto);
    Task<IEnumerable<RemedialPlan>> GetPendingApprovalsAsync();
    Task<IEnumerable<ApprovalLog>> GetApprovalHistoryAsync();
    Task<bool> DeleteRemedialPlanAsync(Guid planId);
    /// <summary>Gets active remedial plans belonging to the specified student.</summary>
    Task<IEnumerable<RemedialPlan>> GetActivePlansForStudentAsync(Guid studentId);
    Task<string?> GetStudentEmailAsync(Guid studentId);
    Task<RemedialPlan?> SubmitProfessorDecisionAsync(
        Guid planId,
        string status,
        string? notes,
        string? editedPlanSummary);
}