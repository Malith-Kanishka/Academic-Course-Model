using System.Net.Http.Json;
using ACM.Backend.Core.Entities;
using System.Text.Json.Serialization;

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
                // Prepare payload matching your FastAPI AuditRequest schema
                var payload = new
                {
                    completed_topics = new List<string> { "AI_Foundations" }, // Mock or fetch student's completed topics here
                    target_topic = topic.Title,
                    rules_db = new List<object>
                    {
                        new
                        {
                            premises = new List<string> { "AI_Foundations" },
                            conclusion = topic.Title
                        }
                    }
                };

                // Calls the FastAPI endpoint we just verified
                var response = await _httpClient.PostAsJsonAsync("api/ai/audit", payload);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<PythonAuditResponse>();
                    if (result != null)
                    {
                        Console.WriteLine($"DEBUG: IsUnlocked = {result.IsUnlocked}, Message = {result.Message}");
                        return (result.IsUnlocked, result.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                // Fallback if Python service is temporarily unreachable
                return (false, $"Audit Bridge Error: {ex.Message}");
            }

            return (false, "Python AI Audit returned an unsuccessful status code.");
        }
    }

    public class PythonAuditResponse
{
    [JsonPropertyName("target_topic")]
    public string TargetTopic { get; set; } = string.Empty;

    [JsonPropertyName("is_unlocked")]
    public bool IsUnlocked { get; set; }

    [JsonPropertyName("derived_knowledge")]
    public List<string> DerivedKnowledge { get; set; } = new();

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}
}