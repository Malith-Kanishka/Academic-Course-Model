import { Bell, CheckCheck, ChevronRight, Command, Info, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

const routeTitles = {
  '/admin/users': 'User Management',
  '/curriculum': 'Curriculum Dashboard',
  '/approvals': 'Approvals Inbox',
  '/sessions': 'Session Archive',
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    icon: CheckCheck,
    iconColor: '#f59e0b',
    iconBg: '#fef3c7',
    title: 'New evaluation pending approval',
    body: 'A student remedial plan is awaiting your review.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 2,
    icon: RefreshCw,
    iconColor: '#3b82f6',
    iconBg: '#eff6ff',
    title: 'System status sync active',
    body: 'Background sync completed successfully across all modules.',
    time: '18 min ago',
    read: false,
  },
  {
    id: 3,
    icon: Info,
    iconColor: '#8b5cf6',
    iconBg: '#f5f3ff',
    title: 'Syllabus updated',
    body: 'CS3042 – Database Systems syllabus has been revised.',
    time: '1 hr ago',
    read: false,
  },
];

export default function Navbar() {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || 'Dashboard';

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <header className="relative z-40 flex min-h-20 shrink-0 items-center justify-between gap-6 border-b border-slate-200/60 bg-white/60 px-5 backdrop-blur-md md:px-7">
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
          <span>Workspace</span>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-slate-600">{pageTitle}</span>
        </div>
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
          <span className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
            <Command className="h-3 w-3" />K
          </span>
        </label>

        {/* ── Notification Bell with Dropdown ── */}
        <div className="relative z-50" ref={dropdownRef}>
          <button
            id="notif-bell-btn"
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-full border border-slate-200 bg-white/70 p-2.5 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              id="notif-dropdown"
              className="absolute right-0 top-full z-[9999] mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
              role="dialog"
              aria-label="Notifications panel"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  id="notif-mark-all-read"
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-blue-600 transition hover:text-blue-800 disabled:opacity-40"
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>

              {/* Notification list */}
              <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <li className="flex flex-col items-center gap-2 px-4 py-8 text-slate-400">
                    <Bell className="h-8 w-8 opacity-30" />
                    <span className="text-sm">You're all caught up!</span>
                  </li>
                ) : (
                  notifications.map(({ id, icon: Icon, iconColor, iconBg, title, body, time, read }) => (
                    <li
                      key={id}
                      className={`group flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${!read ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Icon avatar */}
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: iconBg }}
                      >
                        <Icon className="h-4 w-4" style={{ color: iconColor }} />
                      </span>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold leading-snug ${read ? 'text-slate-600' : 'text-slate-800'}`}>
                          {title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{body}</p>
                        <p className="mt-1 text-[10px] font-medium text-slate-300">{time}</p>
                      </div>

                      {/* Unread dot */}
                      {!read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}

                      {/* Dismiss */}
                      <button
                        type="button"
                        onClick={() => dismiss(id)}
                        className="ml-1 mt-0.5 shrink-0 rounded-md p-0.5 text-slate-300 opacity-0 transition hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100"
                        aria-label={`Dismiss notification: ${title}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))
                )}
              </ul>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                  <button
                    id="notif-clear-all"
                    type="button"
                    onClick={() => setNotifications([])}
                    className="text-xs font-semibold text-slate-400 transition hover:text-rose-500"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => authService.logout()}
          className="hidden rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 sm:block"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}