using System;

namespace ACM.Backend.Core.Entities.Rag
{
    public class ChatMessage
    {
        public Guid Id { get; set; }
        public Guid SessionId { get; set; }
        public string Sender { get; set; } // "user" or "assistant"
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
