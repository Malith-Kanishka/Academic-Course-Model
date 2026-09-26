import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * AudioPlayerCard
 *
 * A stylised HTML5 audio player for reviewing raw session recordings.
 * Props:
 *  - session: the active session object from useSessionLogs (contains audioFileUrl, moduleTopic, studentName, date, duration)
 */
export default function AudioPlayerCard({ session }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);

  const audioUrl = session?.audioFileUrl ?? null;

  // Reset state when the session changes.
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Waveform visualiser bars (decorative, driven by progress).
  const bars = [28, 42, 34, 66, 48, 78, 55, 88, 64, 44, 72, 52, 92, 58, 38,
    69, 46, 80, 56, 32, 61, 74, 49, 87, 42, 66, 52, 76, 40, 58];
  const playedCount = Math.floor((progress / 100) * bars.length);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setLoading(true);
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  const handleVolumeToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    audio.muted = next;
    setMuted(next);
  };

  const sessionDate = session?.date
    ? new Date(session.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const durationLabel =
    session?.duration != null
      ? typeof session.duration === 'number'
        ? `${Math.round(session.duration / 60)} min`
        : session.duration
      : null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-md shadow-slate-200/50 backdrop-blur-xl">
      {/* Hidden real audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onEnded={() => setPlaying(false)}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          preload="metadata"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Now reviewing
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 truncate max-w-xs">
            {session?.moduleTopic ?? 'Select a session'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {[session?.studentName, sessionDate, durationLabel]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            audioUrl
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {audioUrl ? 'Audio ready' : 'No audio'}
        </span>
      </div>

      {/* Waveform visualiser */}
      <div className="mt-5 flex h-20 items-center gap-[3px] rounded-xl border border-slate-200 bg-slate-900 px-4">
        {bars.map((height, index) => (
          <span
            key={index}
            className={`flex-1 rounded-full transition-all duration-150 ${
              index < playedCount
                ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
                : 'bg-slate-700'
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* Seek bar */}
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={handleSeek}
        disabled={!audioUrl}
        className="mt-3 w-full accent-blue-500 disabled:opacity-40"
        aria-label="Audio seek position"
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSkip(-10)}
            disabled={!audioUrl}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Rewind 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            disabled={!audioUrl || loading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-40 transition"
            aria-label={playing ? 'Pause audio' : 'Play audio'}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(10)}
            disabled={!audioUrl}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Skip 10 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleVolumeToggle}
            className="ml-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Playback speed */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {[0.75, 1, 1.25, 1.5].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSpeedChange(option)}
              className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                speed === option
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
