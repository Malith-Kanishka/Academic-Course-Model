using System;

namespace ACM.Backend.Core.Entities
{
    public class AgentPersonality
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid StudentUserId { get; set; }
        public User StudentUser { get; set; } = null!;

        // Personality traits and configuration
        public string PersonalityType { get; set; } = "Adaptive"; // Adaptive, Strict, Encouraging, Friendly, Socratic
        public string CommunicationStyle { get; set; } = "Conversational"; // Conversational, Formal, Casual, Technical
        public int PatienceLevel { get; set; } = 5; // 1-10 scale
        public int EnthusiasmLevel { get; set; } = 7; // 1-10 scale
        public string[] FocusAreas { get; set; } = Array.Empty<string>(); // e.g., ["problem-solving", "conceptual-understanding"]

        // Learning profile
        public string LearningStyle { get; set; } = "Mixed"; // Visual, Auditory, Kinesthetic, Reading/Writing, Mixed
        public int PerformanceLevel { get; set; } = 3; // 1-5 scale
        public double AverageScore { get; set; } = 0.0;

        // Adaptation flags
        public bool AdaptToPerformance { get; set; } = true;
        public bool ProvideEncouragement { get; set; } = true;
        public bool UsePracticalExamples { get; set; } = true;
        public int MaxRetryAttempts { get; set; } = 3;

        // Metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string? CustomInstructions { get; set; }
    }
}
