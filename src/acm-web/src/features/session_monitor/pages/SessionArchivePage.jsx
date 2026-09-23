import { useState } from 'react';

const metricCards = [
  { label: 'Recorded Sessions', value: '136', tone: 'bg-blue-100 text-blue-700' },
  { label: 'Total Hours', value: '284h', tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'Audio Transcripts', value: '94%', tone: 'bg-cyan-100 text-cyan-700' },
];

export default function SessionArchivePage() {
  const [moduleFilter, setModuleFilter] = useState('All modules');
  const [dateRange, setDateRange] = useState('This month');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Sessions</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Session Archive</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition focus:border-cyan-500"
          >
            <option>All modules</option>
            <option>CS101</option>
            <option>CS201</option>
            <option>SEF</option>
          </select>

          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition focus:border-cyan-500"
          >
            <option>This month</option>
            <option>Past 90 days</option>
            <option>Last semester</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-bold text-slate-900">{card.value}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${card.tone}`}>
                Updated
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Session timeline</h2>
          <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Export transcript
          </button>
        </div>

        {/* TEAMMATE COMPONENT SLOT: Insert SessionTable or AudioInsightsChart here */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-700">Session archive panel ready for integration</p>
          <p className="mt-2 text-sm text-slate-500">Insert the real session table, audio transcript viewer, or analytics chart here.</p>
        </div>
      </div>
    </div>
  );
}
