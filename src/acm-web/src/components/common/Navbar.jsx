import { Bell, ChevronRight, Command, Search } from 'lucide-react';
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
    <header className="flex min-h-20 shrink-0 items-center justify-between gap-6 border-b border-slate-200/60 bg-white/60 px-5 backdrop-blur-md md:px-7">
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400"><span>Workspace</span><ChevronRight className="h-3 w-3" /><span className="truncate text-slate-600">{pageTitle}</span></div>
        <h1 className="mt-1 truncate text-xl font-bold text-slate-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-400 lg:flex">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder="Search"
            className="w-44 border-0 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
          />
          <span className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400"><Command className="h-3 w-3" />K</span>
        </label>

        <button
          type="button"
          className="relative rounded-full border border-slate-200 bg-white/70 p-2.5 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <button onClick={() => authService.logout()} className="hidden rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 sm:block">Sign out</button>
      </div>
    </header>
  );
}