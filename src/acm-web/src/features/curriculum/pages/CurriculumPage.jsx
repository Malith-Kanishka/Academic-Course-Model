import { useState, useEffect } from 'react';
import { FileUp, Search, Plus } from 'lucide-react';
import ModuleList from '../components/ModuleList';
import PdfUploader from '../components/PdfUploader';
import TopicForm from '../components/TopicForm';
import useCurriculum from '../hooks/useCurriculum';
import { useAuthStore } from '../../../store/authStore';
import { hasRole } from '../../../utils/roles';
import approvalService from '../../../services/approvalService';
import StudentRemedialPlanCard from '../../../components/common/StudentRemedialPlanCard';
import EnrollmentAssignmentModal from '../components/EnrollmentAssignmentModal';

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('Modules List');
  const user = useAuthStore((state) => state.user);
  const isStudent = hasRole(user, ['Student']);
  const canManageCurriculum = hasRole(user, ['Professor', 'Admin']);
  const { modules, loading, error, fetchModules } = useCurriculum();
  const [activePlans, setActivePlans] = useState([]);
  const [moduleForEnrollment, setModuleForEnrollment] = useState(null);
  const tabs = canManageCurriculum ? ['Modules List', 'Upload Syllabus', 'Topic Builder'] : ['Modules List'];
  const visibleModules = modules;

  useEffect(() => {
    fetchModules({ student: isStudent });
  }, [fetchModules, isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    approvalService.getMyActiveRemedialPlans().then(setActivePlans).catch(() => setActivePlans([]));
  }, [isStudent]);

  // Calculate dynamic stats from real data
  const totalModulesCount = visibleModules.length;
  const totalTopicsCount = visibleModules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
  const draftModulesCount = visibleModules.filter(m => m.status === 'Draft').length;

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

        {canManageCurriculum && <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('Topic Builder')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Module / Topic
          </button>
        </div>}
      </div>

      {isStudent && activePlans.map((plan) => <StudentRemedialPlanCard key={plan.id} plan={plan} />)}

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
          {canManageCurriculum && <div className="flex flex-wrap gap-2">
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
          </div>}

          {canManageCurriculum && <div className="flex flex-wrap gap-2">
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
          </div>}
        </div>

        <div className="mt-5">
          {loading && modules.length === 0 ? (
            <div className="py-12 text-center text-slate-400">Loading curriculum data...</div>
          ) : (
            <>
              {activeTab === 'Modules List' && (
                isStudent && visibleModules.length === 0
                  ? <p className="py-12 text-center text-sm text-slate-500">No enrolled modules are linked to this account.</p>
                  : <ModuleList
                      modules={visibleModules}
                      canManageEnrollments={canManageCurriculum}
                      onManageEnrollments={setModuleForEnrollment}
                    />
              )}

              {canManageCurriculum && activeTab === 'Upload Syllabus' && <PdfUploader topics={allTopics} onUploadSuccess={fetchModules} />}

              {canManageCurriculum && activeTab === 'Topic Builder' && <TopicForm modules={modules} onCreated={() => { fetchModules(); setActiveTab('Modules List'); }} />}
            </>
          )}
        </div>
      </div>
      {moduleForEnrollment && (
        <EnrollmentAssignmentModal
          module={moduleForEnrollment}
          onClose={() => setModuleForEnrollment(null)}
        />
      )}
    </div>
  );
}