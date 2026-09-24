import { useMemo, useState } from 'react';
import { Mail, Plus, Search, X } from 'lucide-react';
import UserTable from '../components/UserTable';
import useAuth from '../hooks/useAuth';

const roleOptions = ['All Roles', 'DepartmentHead', 'Lecturer', 'Teacher', 'Student'];

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [inviteOpen, setInviteOpen] = useState(false);
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Governance</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
        </div>

        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add New User
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-md shadow-slate-200/50 backdrop-blur-xl">
            <p className="text-sm text-slate-600">{stat.label}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">{stat.value}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stat.tone}`}>
                Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-md shadow-slate-200/50 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {['All Roles', 'DepartmentHead', 'Lecturer', 'Student'].map((role) => <button key={role} type="button" onClick={() => setRoleFilter(role)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${roleFilter === role ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{role === 'All Roles' ? 'All users' : role === 'DepartmentHead' ? 'Dept heads' : `${role}s`}</button>)}
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-500">
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
              className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/70">
          <UserTable
            users={filteredUsers}
            isLoading={isLoading}
            onActivate={activateUser}
            onDeactivate={deactivateUser}
          />
        </div>
      </div>
      {inviteOpen && <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm"><aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white/95 shadow-2xl shadow-slate-400/30"><div className="flex items-start justify-between border-b border-slate-200 p-6"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Directory</p><h2 className="mt-1 text-xl font-bold text-slate-900">Invite a new user</h2></div><button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={(event) => { event.preventDefault(); setInviteOpen(false); }} className="space-y-4 p-6"><label className="block text-sm font-semibold text-slate-700">Full name<input required placeholder="e.g. Dr. Maya Sen" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500" /></label><label className="block text-sm font-semibold text-slate-700">Institutional email<input required type="email" placeholder="name@acm.edu" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500" /></label><label className="block text-sm font-semibold text-slate-700">Access role<select className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"><option>Lecturer</option><option>Teacher</option><option>Student</option><option>DepartmentHead</option></select></label><div className="mt-8 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-700"><Mail className="mr-2 inline h-4 w-4" />An invitation link will be sent after confirmation.</div><button type="submit" className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700">Send invitation</button></form></aside></div>}
    </section>
  );
}
