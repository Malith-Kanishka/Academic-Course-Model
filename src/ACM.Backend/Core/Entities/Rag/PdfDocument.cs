using System;

namespace ACM.Backend.Core.Entities.Rag
{
    public class PdfDocument
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public Guid UploadedByUserId { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
