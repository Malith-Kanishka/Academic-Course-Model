import { useCallback, useEffect, useRef, useState } from 'react';
import sessionService from '../../../services/sessionService';

/**
 * useSessionLogs — custom hook for the Session Monitor feature.
 *
 * Manages:
 *  - sessions: the list metadata (sidebar)
 *  - activeSession: the full DTO for the selected session (transcript + audio)
 *  - isLoading / isDetailLoading / error states
 *  - selectSession(id): fetches detail for the chosen session
 */
export default function useSessionLogs() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');

  // Track the in-flight detail request so we can ignore stale responses.
  const activeRequestIdRef = useRef(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await sessionService.getAllSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load study sessions. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch the full transcript + audio for a chosen session.
  const selectSession = useCallback(async (id) => {
    if (!id) {
      setActiveSession(null);
      return;
    }

    const requestId = Symbol();
    activeRequestIdRef.current = requestId;

    setIsDetailLoading(true);
    setError('');
    try {
      const detail = await sessionService.getSessionById(id);
      // Ignore if a newer request has already started.
      if (activeRequestIdRef.current === requestId) {
        setActiveSession(detail);
      }
    } catch (requestError) {
      if (activeRequestIdRef.current === requestId) {
        setError(
          requestError.response?.data?.message ??
            'Unable to load session transcript. Please try again.'
        );
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  }, []);

  // Auto-select the first session once the list is loaded.
  useEffect(() => {
    if (sessions.length > 0 && !activeSession) {
      selectSession(sessions[0].id);
    }
  }, [sessions, activeSession, selectSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    activeSession,
    isLoading,
    isDetailLoading,
    error,
    selectSession,
    reload: loadSessions,
  };
}
