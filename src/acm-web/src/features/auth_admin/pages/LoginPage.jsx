import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, isLoading, error } = useAuth();

  const handleLoginSubmit = async (userEmail, userPassword) => {
    try {
      await login(userEmail, userPassword);
    } catch (err) {
      console.error('[Auth Debug] Login process failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleLoginSubmit(email, password);
    } catch (err) {
      console.error('[Auth Debug] submit handler failed:', err);
    }
  };

  const handleQuickLogin = async (event, demoEmail, demoPassword) => {
    if (event) event.preventDefault();

    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      console.error('[Auth Debug] quick login failed:', err);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] p-4 text-slate-900">
      <div className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-cyan-200 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-200 blur-[130px]" />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/80 p-8 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
        <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">ACM / 04</p>
        <h2 className="mb-6 mt-2 text-center text-2xl font-bold text-slate-900">Academic command center</h2>

        {error && (
          <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="name@acm.edu"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* --- Dev Quick Login Role Switcher --- */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Dev Quick Login (Select Role)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'depthead@acm.edu', 'Admin@123')}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              Department Head
            </button>
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'lecturer@acm.edu', 'Lecturer@123')}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              Lecturer
            </button>
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'teacher@acm.edu', 'Teacher@123')}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'student@acm.edu', 'Student@123')}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}