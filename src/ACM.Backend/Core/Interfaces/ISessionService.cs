using System;
using System.Threading.Tasks;
using ACM.Backend.Core.DTOs.Member3;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Core.Interfaces
{
    public interface ISessionService
    {
        Task<StudySession> StartSessionAsync(SessionStartDto dto);
        
        // Returns the AI's text response after processing the student's audio
        Task<string> ProcessStudentAudioAsync(AudioStreamDto dto); 
        
        Task<StudySession> GetSessionHistoryAsync(Guid sessionId);
    }
}