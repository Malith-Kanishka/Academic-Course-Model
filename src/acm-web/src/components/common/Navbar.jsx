import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

const routeTitles = {
  '/admin/users': 'User Management',
  '/curriculum': 'Curriculum Dashboard',
  '/approvals': 'Approvals Inbox',
  '/sessions': 'Session Archive',
};

export default function Navbar() {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || 'Dashboard';

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <label className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder="Search"
            className="w-48 border-0 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <button
          type="button"
          className="relative rounded-full border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <button
          onClick={() => authService.logout()}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}