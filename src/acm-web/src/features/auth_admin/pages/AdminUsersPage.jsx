import { useMemo, useState } from 'react';
import UserTable from '../components/UserTable';
import useAuth from '../hooks/useAuth';

export default function AdminUsersPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const { users, isLoading, error, activateUser, deactivateUser } = useAuth({ loadUsers: true });

	const filteredUsers = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		return query
			? users.filter((user) => user.email.toLowerCase().includes(query))
			: users;
	}, [searchTerm, users]);

	return (
		<section className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Administration</p>
					<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">User management</h1>
					<p className="mt-2 text-slate-500">Manage department accounts and access status.</p>
				</div>
				<label className="w-full sm:max-w-xs">
					<span className="sr-only">Search users by email</span>
					<input
						type="search"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Search by email"
						className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
					/>
				</label>
			</div>

			{error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<UserTable
					users={filteredUsers}
					isLoading={isLoading}
					onActivate={activateUser}
					onDeactivate={deactivateUser}
				/>
			</div>
		</section>
	);
}
