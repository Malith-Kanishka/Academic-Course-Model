import { useState, useEffect } from 'react';
import { FileUp, Search, Plus } from 'lucide-react';
import ModuleList from '../components/ModuleList';
import PdfUploader from '../components/PdfUploader';
import TopicForm from '../components/TopicForm';
import useCurriculum from '../hooks/useCurriculum';

const tabs = ['Modules List', 'Upload Syllabus', 'Topic Builder'];

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('Modules List');
  const { modules, loading, error, fetchModules } = useCurriculum();

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Calculate dynamic stats from real data
  const totalModulesCount = modules.length;
  const totalTopicsCount = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
  const draftModulesCount = modules.filter(m => m.status === 'Draft').length;

  const metricCards = [
    { label: 'Total Modules', value: totalModulesCount.toString(), tone: 'bg-blue-100 text-blue-700' },
    { label: 'Active Topics', value: totalTopicsCount.toString(), tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Draft Curriculum', value: draftModulesCount.toString(), tone: 'bg-violet-100 text-violet-700' },
  ];

  // Flatten all topics for the PdfUploader component dropdown
  const allTopics = modules.flatMap(m => m.topics || []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Curriculum intelligence</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Course Planning</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('Topic Builder')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Module / Topic
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-md shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 hover:shadow-lg">
            <p className="text-sm text-slate-600">{card.label}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">{card.value}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${card.tone}`}>
                Live
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-md shadow-slate-200/50 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              <input
                type="search"
                placeholder="Search modules"
                className="w-36 border-0 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={() => setActiveTab('Upload Syllabus')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <FileUp className="h-4 w-4" />
              Upload PDF
            </button>
          </div>
        </div>

        <div className="mt-5">
          {loading && modules.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Loading curriculum data...</div>
          ) : (
            <>
              {activeTab === 'Modules List' && <ModuleList modules={modules} />}

              {activeTab === 'Upload Syllabus' && <PdfUploader topics={allTopics} onUploadSuccess={fetchModules} />}

              {activeTab === 'Topic Builder' && <TopicForm modules={modules} onCreated={() => { fetchModules(); setActiveTab('Modules List'); }} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}