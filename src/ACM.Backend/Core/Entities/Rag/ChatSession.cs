using System;

namespace ACM.Backend.Core.Entities.Rag
{
    public class ChatSession
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
