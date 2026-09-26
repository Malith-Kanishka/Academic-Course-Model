import apiClient from './apiClient';

const unwrap = (response) => response?.data ?? response ?? [];

/**
 * Normalises a raw session list item from the backend DTO.
 * Handles both camelCase and PascalCase shapes.
 */
const normalizeSession = (session) => ({
  ...session,
  id: session.id ?? session.Id ?? session.sessionId ?? session.SessionId,
  studentName:
    session.studentName ??
    session.StudentName ??
    `Student ${session.studentId ?? session.StudentId ?? ''}`.trim(),
  moduleTopic:
    session.moduleTopic ??
    session.ModuleTopic ??
    session.module ??
    session.Module ??
    'Unknown Module',
  date:
    session.date ??
    session.Date ??
    session.createdAt ??
    session.CreatedAt ??
    session.startedAt ??
    session.StartedAt,
  duration:
    session.duration ??
    session.Duration ??
    session.durationSeconds ??
    session.DurationSeconds,
  audioFileUrl:
    session.audioFileUrl ??
    session.AudioFileUrl ??
    session.audioUrl ??
    session.AudioUrl ??
    null,
  messages:
    session.messages ??
    session.Messages ??
    session.transcript ??
    session.Transcript ??
    [],
});

/**
 * Normalises a single chat message within a SessionFinalTranscriptDTO.
 */
const normalizeMessage = (msg) => ({
  ...msg,
  id: msg.id ?? msg.Id ?? msg.messageId ?? msg.MessageId ?? crypto.randomUUID(),
  role:
    msg.role ??
    msg.Role ??
    msg.sender ??
    msg.Sender ??
    msg.speakerRole ??
    msg.SpeakerRole ??
    'Unknown',
  content:
    msg.content ??
    msg.Content ??
    msg.text ??
    msg.Text ??
    msg.message ??
    msg.Message ??
    '',
  timestamp:
    msg.timestamp ??
    msg.Timestamp ??
    msg.sentAt ??
    msg.SentAt ??
    null,
});

/**
 * Normalises a full session detail DTO (includes messages array).
 */
const normalizeSessionDetail = (session) => {
  const base = normalizeSession(session);
  const rawMessages =
    session.messages ??
    session.Messages ??
    session.chatMessages ??
    session.ChatMessages ??
    session.transcript ??
    session.Transcript ??
    [];
  return {
    ...base,
    messages: rawMessages.map(normalizeMessage),
  };
};

const sessionService = {
  /**
   * Fetches metadata for the session history list.
   * GET /api/sessions
   */
  async getAllSessions() {
    try {
      const response = await apiClient.get('/sessions');
      const payload = unwrap(response);
      const items = Array.isArray(payload)
        ? payload
        : payload?.items ?? payload?.data ?? payload?.sessions ?? [];
      return items.map(normalizeSession);
    } catch (error) {
      if (error.response?.status === 404) return [];
      throw error;
    }
  },

  /**
   * Fetches the full SessionFinalTranscriptDTO for a single session.
   * GET /api/sessions/{id}
   */
  async getSessionById(id) {
    const response = await apiClient.get(`/sessions/${id}`);
    return normalizeSessionDetail(unwrap(response));
  },
};

export default sessionService;
