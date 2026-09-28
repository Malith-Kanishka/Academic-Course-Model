import { BookOpen, BriefcaseBusiness, CheckCheck, ChevronRight, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import approvalService from '../../services/approvalService';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

const BASE_LINKS = [
  { name: 'Overview', path: '/curriculum', icon: LayoutDashboard },
  { name: 'User directory', path: '/admin/users', icon: Users },
  { name: 'Curriculum', path: '/curriculum', icon: BookOpen },
  { name: 'Approvals', path: '/approvals', icon: CheckCheck },
  { name: 'Session monitor', path: '/sessions', icon: BriefcaseBusiness },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const role = user?.role ?? user?.Role ?? 'Student';
  const roleLabel = String(role).replace(/([A-Z])/g, ' $1').trim() || 'Student';

  const [pendingCount, setPendingCount] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    approvalService
      .getPendingApprovals()
      .then((list) => {
        if (!cancelled) setPendingCount(list.length);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white/80 text-slate-700 backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-base font-black text-white shadow-lg shadow-indigo-500/30">A</div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-600">ACM / 04</p>
            <p className="text-base font-bold text-slate-900">Academic intelligence</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Workspace</p></div>
      <nav className="flex-1 space-y-1 px-3 py-3">
        {BASE_LINKS.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? 'border-l-4 border-blue-600 border-y-transparent border-r-transparent bg-blue-50 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{name}</span>

            {/* Live pending approvals badge */}
            {name === 'Approvals' && pendingCount !== null && pendingCount > 0 && (
              <span
                id="sidebar-approvals-badge"
                className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 tabular-nums"
              >
                {pendingCount}
              </span>
            )}
            {/* Subtle loading pulse while fetching */}
            {name === 'Approvals' && pendingCount === null && (
              <span className="h-3 w-5 animate-pulse rounded-full bg-slate-200" />
            )}

            <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200/80 p-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-md shadow-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-slate-950 ring-4 ring-amber-200">
              {(user?.email || 'JD').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.email || 'professor@acm.edu'}</p>
              <p className="mt-0.5 text-xs text-amber-600">{roleLabel || 'Department Head'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => authService.logout()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}