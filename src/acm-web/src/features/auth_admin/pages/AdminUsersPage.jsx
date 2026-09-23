import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import UserTable from '../components/UserTable';
import useAuth from '../hooks/useAuth';

const roleOptions = ['All Roles', 'DepartmentHead', 'Lecturer', 'Teacher', 'Student'];

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const { users, isLoading, error, activateUser, deactivateUser } = useAuth({ loadUsers: true });

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const emailMatches = !query || user.email.toLowerCase().includes(query);
      const roleMatches = roleFilter === 'All Roles' || user.role === roleFilter;
      return emailMatches && roleMatches;
    });
  }, [searchTerm, roleFilter, users]);

  const stats = [
    { label: 'Total Users', value: users.length || 0, tone: 'bg-blue-100 text-blue-700' },
    { label: 'Active Accounts', value: users.filter((user) => user.isActive).length || 0, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Roles Overview', value: '5 Roles', tone: 'bg-violet-100 text-violet-700' },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Administration</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Add New User
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stat.tone}`}>
                Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by email"
                className="w-44 border-0 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* TEAMMATE COMPONENT SLOT: Insert UserTable here */}
          <UserTable
            users={filteredUsers}
            isLoading={isLoading}
            onActivate={activateUser}
            onDeactivate={deactivateUser}
          />
        </div>
      </div>
    </section>
  );
}
