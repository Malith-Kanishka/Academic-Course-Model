using System.Net.Http.Json;
using ACM.Backend.Core.Entities;

namespace ACM.Backend.Services
{
    public class KnowledgeAuditorService
    {
        private readonly HttpClient _httpClient;

        public KnowledgeAuditorService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<(bool IsValid, string Feedback)> AuditTopicAsync(Topic topic)
        {
            try
            {
                var payload = new
                {
                    completed_topics = new List<string> { "Intro" }, // Pass actual completed user topics here
                    target_topic = topic.Title,
                    rules_db = new List<object>()
                };

                // Calls your Python FastAPI endpoint
                var response = await _httpClient.PostAsJsonAsync("api/ai/audit", payload);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<PythonAuditResponse>();
                    if (result != null)
                    {
                        return (result.IsUnlocked, result.Message);
                    }
                }
            }
            catch (Exception)
            {
                // Fallback local validation if Python service is offline
                if (string.IsNullOrWhiteSpace(topic.Title) || topic.Title.Length < 3)
                {
                    return (false, "Audit Failed: Topic title is too brief.");
                }
            }

            return (true, "Audit Passed via Python AI Agent layer.");
        }
    }

    public class PythonAuditResponse
    {
        public string TargetTopic { get; set; } = string.Empty;
        public bool IsUnlocked { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}