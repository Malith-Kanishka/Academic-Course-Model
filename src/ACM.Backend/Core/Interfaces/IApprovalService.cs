namespace ACM.Backend.Core.Interfaces;

using ACM.Backend.Core.DTOs.Member4;
using ACM.Backend.Core.Entities;

public interface IApprovalService
{
    Task<MasteryReport> ProcessSessionEvaluationAsync(SessionFinalTranscriptDTO dto);
    Task<IEnumerable<RemedialPlan>> GetPendingApprovalsAsync();
    Task<RemedialPlan?> SubmitProfessorDecisionAsync(Guid planId, string status, string? notes);
}