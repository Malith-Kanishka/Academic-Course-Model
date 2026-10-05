import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FloatingChatWidget from '../FloatingChatWidget';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showAccessDenied = Boolean(location.state?.accessDenied);

  useEffect(() => {
    if (!showAccessDenied) return undefined;

    const timeout = window.setTimeout(() => navigate(location.pathname, { replace: true, state: {} }), 3500);
    return () => window.clearTimeout(timeout);
  }, [showAccessDenied, location.pathname, navigate]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30">
        <div className="absolute -left-24 top-20 h-96 w-96 rounded-full bg-cyan-200 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-200 blur-[130px]" />
      </div>
      <div className="relative z-10 flex h-full min-h-0 w-full">
        <Sidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Navbar />

          <main className="relative z-10 min-h-0 flex-1 overflow-y-auto bg-transparent p-4 md:p-8">
            <div className="mx-auto min-w-0 max-w-[1440px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      {showAccessDenied && (
        <div role="status" className="fixed right-5 top-5 z-50 rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 shadow-lg">
          Access Denied
        </div>
      )}
      <FloatingChatWidget />
    </div>
  );
}
