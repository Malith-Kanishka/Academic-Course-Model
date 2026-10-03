import {
  BookOpen,
  ChevronDown,
  UserRoundPlus,
  Pencil,
  Trash2,
  FileText,
  Eye,
  Download,
  BookMarked,
} from 'lucide-react';
import { useState } from 'react';
import { curriculumService } from '../../../services/curriculumService';
import apiClient from '../../../services/apiClient';

export default function ModuleList({
  modules = [],
  canManageEnrollments = false,
  canManageCurriculum = false,
  onManageEnrollments,
  onEditModule,
  onDeleted,
}) {
  const [open, setOpen] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (moduleId, moduleName) => {
    if (!window.confirm(`Delete module "${moduleName}"? This cannot be undone.`)) return;
    setDeletingId(moduleId);
    try {
      await curriculumService.deleteModule(moduleId);
      if (onDeleted) onDeleted();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete module.');
    } finally {
      setDeletingId(null);
    }
  };

  if (modules.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        No modules found. Create your first module using the button above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const moduleId = module.id || module.code;
        const topics = module.topics || [];
        const isOpen = open === moduleId;

        return (
          <div
            key={moduleId}
            className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
          >
            {/* Module header row */}
            <div className="flex items-center gap-3 p-4">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>

              {/* Clickable title area */}
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : moduleId)}
                className="min-w-0 flex-1 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600">
                    {module.code || 'MOD'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      module.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : module.status === 'Review'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {module.status || 'Active'}
                  </span>
                </div>
                <p className="mt-1 truncate font-semibold text-slate-800">
                  {module.title || module.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {module.owner || 'Department Faculty'} · {topics.length} topic{topics.length !== 1 ? 's' : ''}
                </p>
              </button>

              {/* Action buttons (lecturer/admin only) */}
              {canManageCurriculum && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditModule?.(module)}
                    title="Edit module"
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(moduleId, module.title || module.name)}
                    disabled={deletingId === moduleId}
                    title="Delete module"
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {canManageEnrollments && (
                <button
                  type="button"
                  onClick={() =>
                    onManageEnrollments?.(
                      modules.find((m) => (m.id || m.code) === moduleId)
                    )
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  aria-label={`Manage enrollments for ${module.title || module.name}`}
                >
                  <UserRoundPlus className="h-4 w-4" />
                  <span className="hidden lg:inline">Manage enrollments</span>
                </button>
              )}

              <ChevronDown
                className={`hidden h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 sm:block ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>

            {/* Expanded: topics + materials */}
            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:pl-16">
                {topics.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No topics yet. Use Topic Builder to add topics to this module.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topics.map((topic) => {
                      const materials = topic.materials || topic.studyMaterials || [];
                      return (
                        <div
                          key={topic.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          {/* Topic header */}
                          <div className="flex items-center gap-2">
                            <BookMarked className="h-4 w-4 shrink-0 text-indigo-500" />
                            <span className="text-sm font-semibold text-slate-800">
                              {topic.title}
                            </span>
                            {topic.contentDescription && (
                              <span className="ml-auto hidden text-xs text-slate-400 md:block">
                                {topic.contentDescription}
                              </span>
                            )}
                          </div>

                          {/* Materials under this topic */}
                          {materials.length > 0 && (
                            <div className="mt-2.5 space-y-2 pl-6">
                              {materials.map((mat) => (
                                <div
                                  key={mat.id}
                                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                                >
                                  <FileText className="h-4 w-4 shrink-0 text-rose-500" />
                                  <span className="flex-1 truncate text-xs font-medium text-slate-700">
                                    {mat.title || mat.fileName || 'Untitled PDF'}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={`${apiClient.defaults.baseURL}/syllabus/materials/${mat.id}/preview`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Preview PDF"
                                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </a>
                                    <a
                                      href={`${apiClient.defaults.baseURL}/syllabus/materials/${mat.id}/download`}
                                      download={mat.fileName || mat.title || 'material.pdf'}
                                      title="Download PDF"
                                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}