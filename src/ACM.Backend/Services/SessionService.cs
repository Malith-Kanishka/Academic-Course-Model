using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
        private readonly IConfiguration _config;

        // Inject Database, HttpClient, and Configuration (for Secrets)
        public SessionService(ACMDbContext context, IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _config = config;
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
            // 1. Save the raw audio file locally
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "audio");
            Directory.CreateDirectory(uploadsFolder);
            
            var fileName = $"{Guid.NewGuid()}_{dto.AudioFile.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.AudioFile.CopyToAsync(stream);
            }

            // ==========================================
            // 2. TRANSCRIBE AUDIO VIA GROQ WHISPER API
            // ==========================================
            var groqApiKey = _config["GroqApiKey"];
            if (string.IsNullOrEmpty(groqApiKey)) 
                throw new Exception("Groq API Key is missing from User Secrets.");

            using var form = new MultipartFormDataContent();
            
            // Open the file to stream up to Groq
            await using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            var fileContent = new StreamContent(fileStream);
            
            // Groq needs to know what kind of audio file we are sending
            var contentType = !string.IsNullOrEmpty(dto.AudioFile.ContentType) ? dto.AudioFile.ContentType : "audio/wav";
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
            
            form.Add(fileContent, "file", dto.AudioFile.FileName);
            form.Add(new StringContent("whisper-large-v3"), "model");

            // Build and send the HTTP request
            using var whisperRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/audio/transcriptions");
            whisperRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", groqApiKey);
            whisperRequest.Content = form;

            var whisperResponse = await _httpClient.SendAsync(whisperRequest);
            if (!whisperResponse.IsSuccessStatusCode)
            {
                var error = await whisperResponse.Content.ReadAsStringAsync();
                throw new Exception($"Whisper Transcription failed: {error}");
            }

            // Extract the real spoken text from the response
            var whisperJson = await whisperResponse.Content.ReadAsStringAsync();
            using var whisperDoc = JsonDocument.Parse(whisperJson);
            var transcribedText = whisperDoc.RootElement.GetProperty("text").GetString();

            // 3. Save Student's Real Dialogue Turn to Database
            var studentTurn = new DialogueTurn
            {
                SessionId = dto.SessionId,
                Speaker = SpeakerType.Student,
                Text = transcribedText!,
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

            var response = await _httpClient.PostAsync("http://127.0.0.1:8000/api/ai/process", content);
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Python AI Service failed with status code: {response.StatusCode}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(responseString);
            var aiResponseText = jsonDoc.RootElement.GetProperty("ai_text").GetString();

            // 5. Save the AI response to the Database
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