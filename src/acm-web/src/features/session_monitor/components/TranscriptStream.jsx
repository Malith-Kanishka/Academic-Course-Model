import { Bot, Loader2, MessageSquareText, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * TranscriptStream
 *
 * Renders the Socratic AI tutor conversation as a chat-bubble UI.
 * Student messages → right-aligned blue bubbles.
 * AI Tutor messages → left-aligned slate/gray bubbles.
 *
 * Props:
 *  - messages: normalised message array from SessionFinalTranscriptDTO
 *  - isLoading: boolean — show skeleton while the detail is fetching
 */
export default function TranscriptStream({ messages = [], isLoading = false }) {
  const bottomRef = useRef(null);

  // Scroll to bottom whenever messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (ts) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  /**
   * Determine if a message is from the student or the AI.
   * The C# backend might use: "Student", "User", "Human" for the student,
   * and "AI", "AITutor", "Assistant", "Bot", "Tutor" for the AI.
   */
  const isStudentMessage = (role) => {
    if (!role) return false;
    const lower = role.toLowerCase();
    return ['student', 'user', 'human'].some((k) => lower.includes(k));
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/80 shadow-md shadow-slate-200/50 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">
            Session transcript
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-slate-900">
            Conversation stream
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          AI classified
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0 max-h-[520px]">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
            <p className="text-sm">Loading transcript…</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <MessageSquareText className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium">No transcript available</p>
            <p className="text-xs text-slate-400">
              Select a session from the archive to view its conversation.
            </p>
          </div>
        )}

        {/* Chat bubbles */}
        {!isLoading &&
          messages.map((msg) => {
            const isStudent = isStudentMessage(msg.role);
            const time = formatTimestamp(msg.timestamp);

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                    isStudent ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  {isStudent ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`relative max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    isStudent
                      ? 'rounded-br-sm bg-blue-500 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800'
                  }`}
                >
                  {/* Sender label */}
                  <p
                    className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${
                      isStudent ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.role}
                  </p>

                  {/* Message text */}
                  <p className="text-sm leading-relaxed">{msg.content}</p>

                  {/* Timestamp */}
                  {time && (
                    <p
                      className={`mt-1.5 text-right text-[10px] ${
                        isStudent ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {time}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

        <div ref={bottomRef} />
      </div>

      {/* Footer stats */}
      {!isLoading && messages.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 shrink-0">
          <span>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          <span>
            {messages.filter((m) => isStudentMessage(m.role)).length} student ·{' '}
            {messages.filter((m) => !isStudentMessage(m.role)).length} AI
          </span>
        </div>
      )}
    </div>
  );
}
