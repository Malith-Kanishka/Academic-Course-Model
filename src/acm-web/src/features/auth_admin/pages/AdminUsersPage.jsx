import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import UserTable from '../components/UserTable';
import useAuth from '../hooks/useAuth';

const ROLE_VALUES = ['DepartmentHead', 'Lecturer', 'Teacher', 'Student'];
const roleOptions = ['All Roles', ...ROLE_VALUES];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const EMPTY_ADD_FORM = { email: '', firstName: '', lastName: '', password: '', role: 'Lecturer' };

function validateAddForm(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  else if (form.firstName.length > 100) errors.firstName = 'First name is too long';

  if (!form.lastName.trim()) errors.lastName = 'Last name is required';
  else if (form.lastName.length > 100) errors.lastName = 'Last name is too long';

  if (!form.password) errors.password = 'Password is required';
  else if (!PASSWORD_PATTERN.test(form.password)) {
    errors.password = 'Min 8 characters, with upper, lower, digit, and special character';
  }

  if (!ROLE_VALUES.includes(form.role)) errors.role = 'Select a role';

  return errors;
}

function validateEditForm(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  else if (form.firstName.length > 100) errors.firstName = 'First name is too long';

  if (!form.lastName.trim()) errors.lastName = 'Last name is required';
  else if (form.lastName.length > 100) errors.lastName = 'Last name is too long';

  if (!ROLE_VALUES.includes(form.role)) errors.role = 'Select a role';

  return errors;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addErrors, setAddErrors] = useState({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'Lecturer' });
  const [editErrors, setEditErrors] = useState({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const {
    users, isLoading, error, actionError,
    activateUser, deactivateUser, createUser, updateUser,
  } = useAuth({ loadUsers: true, search: searchTerm, roleFilter });

  const stats = [
    { label: 'Total Users', value: users.length || 0, tone: 'bg-blue-100 text-blue-700' },
    { label: 'Active Accounts', value: users.filter((user) => user.isActive).length || 0, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Roles Overview', value: `${ROLE_VALUES.length} Roles`, tone: 'bg-violet-100 text-violet-700' },
  ];

  const closeAddModal = () => {
    setAddOpen(false);
    setAddForm(EMPTY_ADD_FORM);
    setAddErrors({});
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    const errors = validateAddForm(addForm);
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingAdd(true);
    try {
      await createUser({
        email: addForm.email.trim(),
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        password: addForm.password,
        role: addForm.role,
      });
      closeAddModal();
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.message ?? requestError.response?.data;
      if (typeof serverMessage === 'string' && serverMessage.toLowerCase().includes('email')) {
        setAddErrors((current) => ({ ...current, email: serverMessage }));
      }
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setEditForm({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', role: user.role ?? 'Lecturer' });
    setEditErrors({});
  };

  const closeEditModal = () => {
    setEditUser(null);
    setEditErrors({});
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editUser) return;

    const errors = validateEditForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmittingEdit(true);
    try {
      await updateUser(editUser.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        role: editForm.role,
      });
      closeEditModal();
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.message;
      setEditErrors((current) => ({ ...current, form: serverMessage ?? 'Unable to save changes.' }));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Governance</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Department Admin · User Management</h1>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
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
      {actionError && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{actionError}</p>}

      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-md shadow-slate-200/50 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
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
            users={users}
            isLoading={isLoading}
            onActivate={activateUser}
            onDeactivate={deactivateUser}
            onEdit={openEditModal}
          />
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm">
          <aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white/95 shadow-2xl shadow-slate-400/30">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Directory</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Add a new member</h2>
              </div>
              <button type="button" onClick={closeAddModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4 overflow-y-auto p-6">
              <label className="block text-sm font-semibold text-slate-700">
                First name
                <input
                  value={addForm.firstName}
                  onChange={(event) => setAddForm((f) => ({ ...f, firstName: event.target.value }))}
                  placeholder="e.g. Maya"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
                {addErrors.firstName && <p className="mt-1 text-xs text-rose-600">{addErrors.firstName}</p>}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Last name
                <input
                  value={addForm.lastName}
                  onChange={(event) => setAddForm((f) => ({ ...f, lastName: event.target.value }))}
                  placeholder="e.g. Sen"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
                {addErrors.lastName && <p className="mt-1 text-xs text-rose-600">{addErrors.lastName}</p>}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Institutional email
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(event) => setAddForm((f) => ({ ...f, email: event.target.value }))}
                  placeholder="name@acm.edu"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
                {addErrors.email && <p className="mt-1 text-xs text-rose-600">{addErrors.email}</p>}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Temporary password
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(event) => setAddForm((f) => ({ ...f, password: event.target.value }))}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
                {addErrors.password
                  ? <p className="mt-1 text-xs text-rose-600">{addErrors.password}</p>
                  : <p className="mt-1 text-xs text-slate-400">At least 8 characters, with upper, lower, digit &amp; special character.</p>}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Access role
                <select
                  value={addForm.role}
                  onChange={(event) => setAddForm((f) => ({ ...f, role: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  {ROLE_VALUES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>

              <button
                type="submit"
                disabled={isSubmittingAdd}
                className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmittingAdd ? 'Creating…' : 'Create user'}
              </button>
            </form>
          </aside>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm">
          <aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white/95 shadow-2xl shadow-slate-400/30">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Directory</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Edit member</h2>
                <p className="mt-1 text-xs text-slate-400">{editUser.email}</p>
              </div>
              <button type="button" onClick={closeEditModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4 overflow-y-auto p-6">
              {editErrors.form && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{editErrors.form}</p>}

              <label className="block text-sm font-semibold text-slate-700">
                First name
                <input
                  value={editForm.firstName}
                  onChange={(event) => setEditForm((f) => ({ ...f, firstName: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
                {editErrors.firstName && <p className="mt-1 text-xs text-rose-600">{editErrors.firstName}</p>}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Last name
                <input
                  value={editForm.lastName}
                  onChange={(event) => setEditForm((f) => ({ ...f, lastName: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                />
                {editErrors.lastName && <p className="mt-1 text-xs text-rose-600">{editErrors.lastName}</p>}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Access role
                <select
                  value={editForm.role}
                  onChange={(event) => setEditForm((f) => ({ ...f, role: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                  {ROLE_VALUES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>

              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmittingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}
