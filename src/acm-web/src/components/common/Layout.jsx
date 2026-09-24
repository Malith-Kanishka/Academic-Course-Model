import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30">
        <div className="absolute -left-24 top-20 h-96 w-96 rounded-full bg-cyan-200 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-200 blur-[130px]" />
      </div>
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />

          <main className="relative z-10 flex-1 overflow-y-auto bg-transparent p-4 md:p-7">
            <div className="mx-auto max-w-[1440px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
