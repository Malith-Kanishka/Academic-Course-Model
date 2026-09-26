import {
  AlertCircle,
  Download,
  Headphones,
  Loader2,
  RefreshCw,
  Search,
  Signal,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AudioPlayerCard from '../components/AudioPlayerCard';
import TranscriptStream from '../components/TranscriptStream';
import useSessionLogs from '../hooks/useSessionLogs';

export default function SessionArchivePage() {
  const {
    sessions,
    activeSession,
    isLoading,
    isDetailLoading,
    error,
    selectSession,
    reload,
  } = useSessionLogs();

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All modules');

  // Derive unique module codes from the sessions list for the filter dropdown.
  const moduleOptions = useMemo(() => {
    const codes = [...new Set(sessions.map((s) => s.moduleTopic).filter(Boolean))];
    return codes;
  }, [sessions]);

  // Client-side filter applied on top of the fetched list.
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesModule =
        moduleFilter === 'All modules' || s.moduleTopic === moduleFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        s.moduleTopic?.toLowerCase().includes(query) ||
        s.studentName?.toLowerCase().includes(query);
      return matchesModule && matchesSearch;
    });
  }, [sessions, moduleFilter, searchQuery]);

  // Stat cards (derived from live data when available, fallback to '--').
  const stats = [
    {
      label: 'Recorded sessions',
      value: sessions.length > 0 ? sessions.length.toString() : '--',
      icon: Headphones,
    },
    {
      label: 'Active participants',
      value:
        sessions.length > 0
          ? [...new Set(sessions.map((s) => s.studentName).filter(Boolean))].length.toString()
          : '--',
      icon: Users,
    },
    {
      label: 'Total duration',
      value:
        sessions.length > 0
          ? (() => {
              const totalSec = sessions.reduce((acc, s) => {
                const d =
                  typeof s.duration === 'number'
                    ? s.duration
                    : Number.parseInt(s.duration, 10) || 0;
                return acc + d;
              }, 0);
              const hours = Math.round(totalSec / 3600);
              return hours > 0 ? `${hours}h` : `${Math.round(totalSec / 60)}m`;
            })()
          : '--',
      icon: Signal,
    },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (d) => {
    if (d == null) return '';
    if (typeof d === 'number') return `${Math.round(d / 60)} min`;
    return d;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
            Session intelligence
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Session Monitor
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse student study sessions, audit AI transcripts, and review raw audio recordings.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Module filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="All modules">All modules</option>
            {moduleOptions.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>

          {/* Reload */}
          <button
            type="button"
            onClick={reload}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Reload sessions"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export (stub — wired to future endpoint) */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-md shadow-slate-200/50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">{label}</p>
              <Icon className="h-4 w-4 text-cyan-600" />
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              {isLoading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
              ) : (
                value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Main split-pane layout */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Left column: Audio player + session archive */}
        <div className="space-y-5">
          {/* Audio player */}
          <AudioPlayerCard session={activeSession} />

          {/* Session archive list */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-md shadow-slate-200/50 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Archive
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Recent recordings
                </h2>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <input
                  type="search"
                  placeholder="Search archive"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* List body */}
            <div className="mt-4 divide-y divide-slate-100">
              {/* Loading skeleton */}
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}

              {/* Empty state */}
              {!isLoading && filteredSessions.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                  <Headphones className="h-8 w-8 text-slate-300" />
                  <p className="text-sm">No sessions found</p>
                </div>
              )}

              {/* Session rows */}
              {!isLoading &&
                filteredSessions.map((session) => {
                  const isActive = activeSession?.id === session.id;
                  return (
                    <button
                      type="button"
                      key={session.id}
                      onClick={() => selectSession(session.id)}
                      className={`flex w-full items-center gap-3 rounded-lg py-3 text-left transition hover:bg-blue-50/50 ${
                        isActive ? 'bg-blue-50 px-3' : 'px-1'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        <Headphones className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {session.moduleTopic}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {[session.studentName, formatDate(session.date), formatDuration(session.duration)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      {isDetailLoading && isActive && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right column: Transcript */}
        <TranscriptStream
          messages={activeSession?.messages ?? []}
          isLoading={isDetailLoading}
        />
      </div>
    </div>
  );
}
