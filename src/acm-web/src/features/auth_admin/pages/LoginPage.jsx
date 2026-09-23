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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">ACM Portal Login</h2>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@acm.edu"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* --- Dev Quick Login Role Switcher --- */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
            Dev Quick Login (Select Role)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'depthead@acm.edu', 'Admin@123')}
              className="rounded bg-purple-100 px-3 py-2 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200"
            >
              Department Head
            </button>
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'lecturer@acm.edu', 'Lecturer@123')}
              className="rounded bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
            >
              Lecturer
            </button>
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'teacher@acm.edu', 'Teacher@123')}
              className="rounded bg-green-100 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-200"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={(event) => handleQuickLogin(event, 'student@acm.edu', 'Student@123')}
              className="rounded bg-amber-100 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200"
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}