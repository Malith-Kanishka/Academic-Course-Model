namespace ACM.Backend.Core.DTOs.Member4;

public class SessionFinalTranscriptDTO
{
    public Guid SessionId { get; set; }
    public Guid StudentId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int FinalScore { get; set; }
    public List<string> FlaggedMisconceptions { get; set; } = new();
    public List<string> SessionTranscript { get; set; } = new();
}