using System;
using System.Threading.Tasks;
using ACM.Backend.Core.DTOs.Member3;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Core.Interfaces
{
    public interface ISessionService
    {
        Task<StudySession> StartSessionAsync(SessionStartDto dto);
        
        Task<SessionTurnResponseDto> ProcessStudentAudioAsync(AudioStreamDto dto);
        Task<SessionTurnResponseDto> ProcessStudentTextAsync(StudentTextTurnDto dto);
        
        /// <summary>Gets session summaries for authorized academic staff monitoring.</summary>
        Task<IEnumerable<StudySession>> GetAllSessionsAsync();
        Task<StudySession> GetSessionHistoryAsync(Guid sessionId);
        Task<string> EndAndEvaluateSessionAsync(Guid sessionId);
    }
}