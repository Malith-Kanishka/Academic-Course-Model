import { useState } from 'react';

const metricCards = [
  { label: 'Pending Approvals', value: '18', tone: 'bg-amber-100 text-amber-700' },
  { label: 'Reviewed Changes', value: '42', tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'Mastery Score', value: '88.4%', tone: 'bg-violet-100 text-violet-700' },
];

const filters = ['All', 'Pending', 'Approved', 'Rejected'];

export default function ApprovalsInboxPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Approvals</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Approvals Inbox</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === filter
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-bold text-slate-900">{card.value}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${card.tone}`}>
                Live
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent submissions</h2>
          <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Export Review
          </button>
        </div>

        {/* TEAMMATE COMPONENT SLOT: Insert ReviewTable or ApprovalCardList here */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-lg font-semibold text-slate-700">Approval queue is ready for integration</p>
          <p className="mt-2 text-sm text-slate-500">Insert the real approval table or review cards here.</p>
        </div>
      </div>
    </div>
  );
}
