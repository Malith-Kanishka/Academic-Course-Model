import { useState } from 'react';
import { FileUp, Search, Plus } from 'lucide-react';

const tabs = ['Modules List', 'Upload Syllabus', 'Topic Builder'];

const metricCards = [
  { label: 'Total Modules', value: '24', tone: 'bg-blue-100 text-blue-700' },
  { label: 'Active Topics', value: '128', tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'Draft Curriculum', value: '7', tone: 'bg-violet-100 text-violet-700' },
];

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('Modules List');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Curriculum</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Course Planning</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            New Module
          </button>
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
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              <input
                type="search"
                placeholder="Search modules"
                className="w-36 border-0 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FileUp className="h-4 w-4" />
              Upload PDF
            </button>
          </div>
        </div>

        <div className="mt-5">
          {activeTab === 'Modules List' && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">Modules list panel ready</p>
              <p className="mt-2 text-sm text-slate-500">{/* TEAMMATE COMPONENT SLOT: Insert ModuleList here */}</p>
            </div>
          )}

          {activeTab === 'Upload Syllabus' && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">Syllabus upload area ready</p>
              <p className="mt-2 text-sm text-slate-500">{/* TEAMMATE COMPONENT SLOT: Insert PdfUploader here */}</p>
            </div>
          )}

          {activeTab === 'Topic Builder' && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">Topic builder ready</p>
              <p className="mt-2 text-sm text-slate-500">{/* TEAMMATE COMPONENT SLOT: Insert TopicForm here */}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
