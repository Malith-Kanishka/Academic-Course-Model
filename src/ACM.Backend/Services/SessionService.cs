using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
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
        private readonly HttpClient _httpClient;

        // Inject the Database AND the HttpClientFactory
        public SessionService(ACMDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
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
            await _context.SaveChangesAsync();

            return session;
        }

        public async Task<string> ProcessStudentAudioAsync(AudioStreamDto dto)
        {
            // 1. Save the raw .m4a audio file locally
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "audio");
            Directory.CreateDirectory(uploadsFolder);
            
            var fileName = $"{Guid.NewGuid()}_{dto.AudioFile.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.AudioFile.CopyToAsync(stream);
            }

            // 2. Transcribe Audio (Mocked for now until we add Whisper API)
            var transcribedText = $"[Simulated Transcription]: I think polymorphism means classes share an interface."; 

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

            // ==========================================
            // 4. CALL THE PYTHON FASTAPI MICROSERVICE
            // ==========================================
            var payload = new
            {
                session_id = dto.SessionId.ToString(),
                student_text = transcribedText
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            // Make the POST request to your running Python server
            var response = await _httpClient.PostAsync("http://127.0.0.1:8000/api/ai/process", content);
            
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Python AI Service failed with status code: {response.StatusCode}");
            }

            // Read the JSON response and extract the 'ai_text'
            var responseString = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(responseString);
            var aiResponseText = jsonDoc.RootElement.GetProperty("ai_text").GetString();

            // 5. Save the real Groq AI response to the Database
            var aiTurn = new DialogueTurn
            {
                SessionId = dto.SessionId,
                Speaker = SpeakerType.AI_Socratic,
                Text = aiResponseText!,
                Timestamp = DateTime.UtcNow
            };
            
            _context.DialogueTurns.Add(aiTurn);
            await _context.SaveChangesAsync();

            return aiResponseText!;
        }

        public async Task<StudySession> GetSessionHistoryAsync(Guid sessionId)
        {
            return await _context.StudySessions
                .Include(s => s.DialogueTurns)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
        }
    }
}