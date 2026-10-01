using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using ACM.Backend.Core.Entities.Rag;

namespace ACM.Backend.Controllers
{
    [ApiController]
    [Route("api/rag")]
    public class RagChatController : ControllerBase
    {
        private readonly ACM.Backend.Infrastructure.Data.ACMDbContext _context;
        private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;

        public RagChatController(ACM.Backend.Infrastructure.Data.ACMDbContext context, System.Net.Http.IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("upload-pdf")]
        public async Task<IActionResult> UploadPdf(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is missing.");
            
            var client = _httpClientFactory.CreateClient();
            using var content = new System.Net.Http.MultipartFormDataContent();
            using var stream = file.OpenReadStream();
            content.Add(new System.Net.Http.StreamContent(stream), "file", file.FileName);
            
            var response = await client.PostAsync("http://localhost:8000/api/ai/rag/process-pdf", content);
            if (!response.IsSuccessStatusCode)
                return StatusCode(500, "Python service failed");

            var result = await response.Content.ReadAsStringAsync();
            var pdfDoc = new PdfDocument { Id = Guid.NewGuid(), FileName = file.FileName, UploadedAt = DateTime.UtcNow };
            _context.Set<PdfDocument>().Add(pdfDoc);
            await _context.SaveChangesAsync();

            return Ok(new { PdfDocument = pdfDoc, Chunks = result });
        }

        public class ChatRequest
        {
            public Guid SessionId { get; set; }
            public string Query { get; set; }
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            var userMsg = new ChatMessage { Id = Guid.NewGuid(), SessionId = request.SessionId, Sender = "user", Content = request.Query, Timestamp = DateTime.UtcNow };
            _context.Set<ChatMessage>().Add(userMsg);
            
            // Retrieve history
            var historyEntities = System.Linq.Enumerable.ToList(System.Linq.Enumerable.Where(_context.Set<ChatMessage>(), m => m.SessionId == request.SessionId));
            var history = System.Linq.Enumerable.ToList(System.Linq.Enumerable.Select(historyEntities, m => new { role = m.Sender, content = m.Content }));

            var client = _httpClientFactory.CreateClient();
            var payload = new { query = request.Query, history = history, context_chunks = new List<string>() };
            var response = await client.PostAsJsonAsync("http://localhost:8000/api/ai/rag/chat", payload);
            
            if (!response.IsSuccessStatusCode)
                return StatusCode(500, "Python service failed");

            var result = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            string aiResponse = result.GetProperty("response").GetString();

            var botMsg = new ChatMessage { Id = Guid.NewGuid(), SessionId = request.SessionId, Sender = "assistant", Content = aiResponse, Timestamp = DateTime.UtcNow };
            _context.Set<ChatMessage>().Add(botMsg);
            await _context.SaveChangesAsync();
            
            return Ok(new { Response = botMsg.Content });
        }

        [HttpGet("history/{sessionId}")]
        public async Task<IActionResult> GetHistory(Guid sessionId)
        {
            var history = System.Linq.Enumerable.ToList(System.Linq.Enumerable.Where(_context.Set<ChatMessage>(), m => m.SessionId == sessionId));
            return Ok(history);
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions()
        {
            var sessions = System.Linq.Enumerable.ToList(_context.Set<ChatSession>());
            return Ok(sessions);
        }
    }
}
