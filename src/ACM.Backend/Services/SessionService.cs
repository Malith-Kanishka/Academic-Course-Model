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

        public async Task<SessionTurnResponseDto> ProcessStudentAudioAsync(AudioStreamDto dto)
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

            return await ProcessStudentTextAsync(new StudentTextTurnDto
            {
                SessionId = dto.SessionId,
                StudentText = transcribedText ?? string.Empty
            }, filePath);
        }

        public Task<SessionTurnResponseDto> ProcessStudentTextAsync(StudentTextTurnDto dto)
        {
            return ProcessStudentTextAsync(dto, audioFilePath: null);
        }

        private async Task<SessionTurnResponseDto> ProcessStudentTextAsync(
            StudentTextTurnDto dto,
            string? audioFilePath)
        {
            if (string.IsNullOrWhiteSpace(dto.StudentText))
                throw new ArgumentException("A student message is required.");

            var session = await _context.StudySessions
                .Include(item => item.DialogueTurns)
                .FirstOrDefaultAsync(item => item.Id == dto.SessionId);
            if (session == null) throw new KeyNotFoundException("Session not found.");

            var turnCount = session.DialogueTurns.Count(turn => turn.Speaker == SpeakerType.AI_Socratic);
            var studentText = dto.StudentText.Trim();
            _context.DialogueTurns.Add(new DialogueTurn
            {
                SessionId = dto.SessionId,
                Speaker = SpeakerType.Student,
                Text = studentText,
                AudioFilePath = audioFilePath,
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var topic = await _context.Topics.FindAsync(session.TopicId);
            var history = await _context.DialogueTurns
                .Where(turn => turn.SessionId == dto.SessionId)
                .OrderBy(turn => turn.Timestamp)
                .Select(turn => $"{turn.Speaker}: {turn.Text}")
                .ToListAsync();
            var payload = new
            {
                session_id = dto.SessionId.ToString(),
                student_text = studentText,
                topic_name = topic?.Title ?? "General Topic",
                turn_count = turnCount,
                history
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("http://127.0.0.1:8000/api/ai/process", content);
            if (!response.IsSuccessStatusCode)
                throw new Exception($"Python AI Service failed with status code: {response.StatusCode}");

            var responseString = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(responseString);
            var aiResponseText = jsonDoc.RootElement.GetProperty("ai_text").GetString();
            if (string.IsNullOrWhiteSpace(aiResponseText))
                throw new InvalidOperationException("Python AI Service returned an empty response.");

            _context.DialogueTurns.Add(new DialogueTurn
            {
                SessionId = dto.SessionId,
                Speaker = SpeakerType.AI_Socratic,
                Text = aiResponseText,
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return new SessionTurnResponseDto
            {
                Transcript = studentText,
                AiText = aiResponseText
            };
        }

        public async Task<StudySession> GetSessionHistoryAsync(Guid sessionId)
        {
            var session = await _context.StudySessions
                .Include(s => s.DialogueTurns)
                .Include(s => s.Topic)
                    .ThenInclude(topic => topic!.Module)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session is not null)
                await LoadStudentsAsync(new[] { session });

            return session;
        }

        public async Task<IEnumerable<StudySession>> GetAllSessionsAsync()
        {
            var sessions = await _context.StudySessions
                .AsNoTracking()
                .Include(session => session.DialogueTurns)
                .Include(session => session.Topic)
                    .ThenInclude(topic => topic!.Module)
                .OrderByDescending(session => session.StartTime)
                .ToListAsync();

            await LoadStudentsAsync(sessions);
            return sessions;
        }

        private async Task LoadStudentsAsync(IEnumerable<StudySession> sessions)
        {
            var sessionList = sessions.ToList();
            var studentIds = sessionList.Select(session => session.StudentId).Distinct().ToList();
            if (studentIds.Count == 0) return;

            var students = await _context.Users
                .AsNoTracking()
                .Where(user => studentIds.Contains(user.Id))
                .ToDictionaryAsync(user => user.Id);

            foreach (var session in sessionList)
            {
                if (students.TryGetValue(session.StudentId, out var student))
                    session.Student = student;
            }
        }

        public async Task<bool> DeleteSessionAsync(Guid sessionId)
        {
            var session = await _context.StudySessions
                .Include(item => item.DialogueTurns)
                .FirstOrDefaultAsync(item => item.Id == sessionId);
            if (session is null) return false;

            _context.DialogueTurns.RemoveRange(session.DialogueTurns);
            _context.StudySessions.Remove(session);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string> EndAndEvaluateSessionAsync(Guid sessionId)
        {
            var session = await _context.StudySessions
                .Include(s => s.DialogueTurns)
                .Include(s => s.Topic)
                    .ThenInclude(topic => topic!.Module)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
                
            if (session == null) throw new Exception("Session not found");

            int totalQuestions = session.DialogueTurns.Count(t => t.Speaker == SpeakerType.AI_Socratic);
            var misconceptions = new System.Collections.Generic.List<string>();
            var studentTurns = session.DialogueTurns
                .Where(turn => turn.Speaker == SpeakerType.Student)
                .OrderBy(turn => turn.Timestamp)
                .ToList();
            
            // To deliberately fail sessions (QA requirement), we flag short or poor answers
            foreach(var turn in studentTurns) 
            {
                if (turn.Text.Split(' ').Length < 5) 
                {
                    misconceptions.Add("Student provided overly brief or incorrect answers indicating lack of depth.");
                    break;
                }
            }
            
            int correctAnswers = misconceptions.Any() ? totalQuestions / 2 : totalQuestions;
            
            var orderedTurns = session.DialogueTurns.OrderBy(turn => turn.Timestamp).ToList();
            var studentSubmission = string.Join("\n", studentTurns.Select(turn => turn.Text));
            var topicName = session.Topic?.Title?.Trim();
            if (string.IsNullOrWhiteSpace(topicName))
                topicName = session.Topic?.Module?.Title?.Trim();
            if (string.IsNullOrWhiteSpace(topicName))
                topicName = "General Topic";

            var expectedStandard = new[]
                {
                    session.Topic?.ContentDescription,
                    session.Topic?.Module?.Description
                }
                .FirstOrDefault(text => !string.IsNullOrWhiteSpace(text))
                ?.Trim();
            if (string.IsNullOrWhiteSpace(expectedStandard))
                expectedStandard = $"Demonstrate core conceptual mastery and provide complete explanations for {topicName}.";
            var payload = new
            {
                session_id = sessionId.ToString(),
                student_id = session.StudentId.ToString(),
                topic_name = topicName,
                correct_answers = correctAnswers,
                total_questions = totalQuestions,
                flagged_misconceptions = misconceptions,
                student_submission = studentSubmission,
                expected_standard = expectedStandard,
                session_transcript = orderedTurns.Select(turn =>
                    $"{(turn.Speaker == SpeakerType.Student ? "Student" : "Assistant")}: {turn.Text}").ToList()
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            // Post to the newly added Python endpoint
            var response = await _httpClient.PostAsync("http://127.0.0.1:8000/api/internal/evaluate-session", content);
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Python Evaluator Service failed: {response.StatusCode}");
            }

            session.Status = SessionStatus.Completed;
            await _context.SaveChangesAsync();

            return await response.Content.ReadAsStringAsync();
        }
    }
}