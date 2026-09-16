using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ACM.Backend.Core.Interfaces;
using ACM.Backend.Core.DTOs.Member3;
using ACM.Backend.Core.Entities;
using ACM.Backend.Infrastructure.Data;

namespace ACM.Backend.Services
{
    public class SessionService : ISessionService
    {
        private readonly ACMDbContext _context;

        // Constructor Injection for the database
        public SessionService(ACMDbContext context)
        {
            _context = context;
        }

        public async Task<StudySession> StartSessionAsync(SessionStartDto dto)
        {
            var session = new StudySession
            {
                StudentId = dto.StudentId,
                TopicId = dto.TopicId,
                Status = SessionStatus.Active,
                StartTime = DateTime.UtcNow
            };

            _context.StudySessions.Add(session);
            await _context.SaveChangesAsync(); // Saves to PostgreSQL

            return session;
        }

        public async Task<string> ProcessStudentAudioAsync(AudioStreamDto dto)
        {
            // 1. Save the raw .m4a audio file locally
            // In a real production app, you would upload this to AWS S3 or Azure Blob Storage
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "audio");
            Directory.CreateDirectory(uploadsFolder);
            
            // Create a unique file name so files don't overwrite each other
            var fileName = $"{Guid.NewGuid()}_{dto.AudioFile.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.AudioFile.CopyToAsync(stream);
            }

            // 2. Transcribe Audio (We will connect the real Whisper API here later)
            var transcribedText = $"[Simulated Transcription of {dto.AudioFile.FileName}]: I think polymorphism means classes share an interface."; 

            // 3. Save Student's Dialogue Turn to Database
            var studentTurn = new DialogueTurn
            {
                SessionId = dto.SessionId,
                Speaker = SpeakerType.Student,
                Text = transcribedText,
                AudioFilePath = filePath,
                Timestamp = DateTime.UtcNow
            };
            
            _context.DialogueTurns.Add(studentTurn);
            await _context.SaveChangesAsync();

            // 4. Send text to Python LangGraph AI Service (We will connect this later)
            // The AI acts as the "Novice" and misunderstands the student
            var aiResponseText = "Wait, what is an interface? Like a user interface with buttons?";

            // 5. Save the AI's response to the Database
            var aiTurn = new DialogueTurn
            {
                SessionId = dto.SessionId,
                Speaker = SpeakerType.AI_Novice,
                Text = aiResponseText,
                Timestamp = DateTime.UtcNow
            };
            
            _context.DialogueTurns.Add(aiTurn);
            await _context.SaveChangesAsync();

            return aiResponseText;
        }

        public async Task<StudySession> GetSessionHistoryAsync(Guid sessionId)
        {
            // Use .Include() to eagerly fetch all dialogue turns associated with this session
            return await _context.StudySessions
                .Include(s => s.DialogueTurns)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
        }
    }
}