export default function UserTable({ users, onActivate, onDeactivate, isLoading }) {
	if (isLoading) {
		return <p className="py-10 text-center text-sm text-slate-500">Loading users...</p>;
	}

	if (users.length === 0) {
		return <p className="py-10 text-center text-sm text-slate-500">No users found.</p>;
	}

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
				<thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
					<tr>
						<th className="px-6 py-3 font-semibold">User ID</th>
						<th className="px-6 py-3 font-semibold">Email</th>
						<th className="px-6 py-3 font-semibold">Full Name</th>
						<th className="px-6 py-3 font-semibold">Role</th>
						<th className="px-6 py-3 font-semibold">Status</th>
						<th className="px-6 py-3 text-right font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100 bg-white">
					{users.map((user) => (
						<tr key={user.id} className="hover:bg-slate-50">
							<td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-500">{user.id}</td>
							<td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">{user.email}</td>
							<td className="whitespace-nowrap px-6 py-4 text-slate-600">{user.fullName}</td>
							<td className="whitespace-nowrap px-6 py-4 text-slate-600">{user.role}</td>
							<td className="whitespace-nowrap px-6 py-4">
								<span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive
									? 'bg-emerald-100 text-emerald-700'
									: 'bg-red-100 text-red-700'
									}`}>
									{user.isActive ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right">
								<select
									aria-label={`Actions for ${user.email}`}
									value=""
									onChange={(event) => {
										if (event.target.value === 'activate') onActivate(user.id);
										if (event.target.value === 'deactivate') onDeactivate(user.id);
										event.target.value = '';
									}}
									className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								>
									<option value="">Select action</option>
									{user.isActive ? (
										<option value="deactivate">Deactivate</option>
									) : (
										<option value="activate">Activate</option>
									)}
								</select>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
