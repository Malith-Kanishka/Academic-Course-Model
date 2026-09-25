import { BookOpen, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

const fallbackModules = [
  { code: 'SEF-301', name: 'Software Engineering Fundamentals', topics: 12, done: 9, owner: 'Dr. A. Fernando', status: 'Active' },
  { code: 'DS-204', name: 'Data Structures & Algorithms', topics: 16, done: 11, owner: 'Prof. R. Silva', status: 'Active' },
  { code: 'DB-210', name: 'Database Systems', topics: 10, done: 6, owner: 'Dr. N. Perera', status: 'Draft' },
  { code: 'AI-220', name: 'Applied Machine Learning', topics: 14, done: 8, owner: 'Prof. K. Jayasuriya', status: 'Review' }
];

export default function ModuleList({ modules = [] }) {
  // Use backend modules if provided and not empty, otherwise fallback
  const displayModules = modules.length > 0 ? modules.map(m => ({
    code: m.code || 'MOD-000',
    name: m.title || m.name,
    topics: m.topics?.length || 5, // fallback topic count if relation isn't loaded
    done: m.done || 3,
    owner: m.owner || 'Department Faculty',
    status: m.status || 'Active'
  })) : fallbackModules;

  const [open, setOpen] = useState(displayModules[0]?.code);

  return (
    <div className="space-y-3">
      {displayModules.map((module) => {
        const progress = Math.round(((module.done || 0) / (module.topics || 1)) * 100);
        return (
          <div key={module.code} className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md">
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(open === module.code ? '' : module.code)} 
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600">{module.code}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${module.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : module.status === 'Review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {module.status}
                  </span>
                </div>
                <p className="mt-1 truncate font-semibold text-slate-800">{module.name}</p>
                <p className="mt-1 text-xs text-slate-500">{module.owner} · {module.topics} topics</p>
              </button>

              <div className="hidden w-36 md:block">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Completion</span>
                  <span className="font-semibold text-slate-700">{progress}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" aria-label={`More actions for ${module.name}`}>
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition sm:block ${open === module.code ? 'rotate-180' : ''}`} />
            </div>

            {open === module.code && (
              <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:pl-20">
                <div className="grid gap-2 sm:grid-cols-3">
                  {['Learning objectives', 'Content coverage', 'Assessment map'].map((topic, index) => (
                    <div key={topic} className="rounded-lg border border-slate-200 bg-white/80 p-3">
                      <p className="text-xs font-semibold text-slate-700">{topic}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{Math.max(0, module.done - index)} of {Math.max(1, module.topics - index)} mapped</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}