import { BookOpen, BriefcaseBusiness, CheckCheck, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const links = [
  { name: 'Dashboard', path: '/curriculum', icon: LayoutDashboard },
  { name: 'User Management', path: '/admin/users', icon: Users },
  { name: 'Curriculum', path: '/curriculum', icon: BookOpen },
  { name: 'Approvals', path: '/approvals', icon: CheckCheck },
  { name: 'Sessions', path: '/sessions', icon: BriefcaseBusiness },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const role = user?.role ?? user?.Role ?? 'Student';
  const roleLabel = String(role).replace(/([A-Z])/g, ' $1').trim() || 'Student';

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-black text-white shadow-lg shadow-blue-500/30">
          A
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">ACM</p>
          <p className="text-base font-bold text-white">Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {links.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl bg-slate-900 p-3 ring-1 ring-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Account</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{user?.email || 'user@acm.edu'}</p>
            </div>
            <span className="inline-flex rounded-full bg-indigo-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-200">
              {roleLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}