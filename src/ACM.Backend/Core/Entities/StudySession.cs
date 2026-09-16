using System;
using System.Collections.Generic;

namespace ACM.Backend.Core.Entities
{
    public class StudySession
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        // Links to Member 1's User table
        public Guid StudentId { get; set; } 
        
        // Links to Member 2's Topic table
        public Guid TopicId { get; set; }
        
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        
        public SessionStatus Status { get; set; } = SessionStatus.Active;

        // Navigation property: One session has many dialogue turns
        public ICollection<DialogueTurn> DialogueTurns { get; set; } = new List<DialogueTurn>();
    }

    public enum SessionStatus
    {
        Active,
        Analyzing,
        PausedForApproval,
        Completed
    }
}