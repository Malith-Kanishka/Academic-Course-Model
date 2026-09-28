import { MoreHorizontal } from 'lucide-react';

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
				<thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
					<tr>
						<th className="px-6 py-3 font-semibold">User</th>
						<th className="px-6 py-3 font-semibold">Email</th>
						<th className="px-6 py-3 font-semibold">Department</th>
						<th className="px-6 py-3 font-semibold">Role</th>
						<th className="px-6 py-3 font-semibold">Status</th>
						<th className="px-6 py-3 text-right font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-200">
					{users.map((user) => (
						<tr key={user.id} className="transition hover:bg-blue-50/50">
							<td className="whitespace-nowrap px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{user.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><p className="font-semibold text-slate-800">{user.fullName}</p><p className="font-mono text-[10px] text-slate-400">{user.id}</p></div></div></td>
							<td className="whitespace-nowrap px-6 py-4 text-slate-600">{user.department || 'Computing'}<p className="mt-1 text-xs text-slate-400">{user.email}</p></td>
							<td className="whitespace-nowrap px-6 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{user.role}</span></td>
							<td className="whitespace-nowrap px-6 py-4">
								<span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive
										? 'bg-emerald-100 text-emerald-700'
										: 'bg-rose-100 text-rose-700'
									}`}>
									{user.isActive ? 'Active' : 'Inactive'}
								</span>
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right">
								<div className="flex items-center justify-end gap-2"><button type="button" onClick={() => user.isActive ? onDeactivate(user.id) : onActivate(user.id)} className={`relative h-6 w-11 rounded-full transition ${user.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.fullName}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-slate-100 shadow transition ${user.isActive ? 'left-6' : 'left-1'}`} /></button><select
									aria-label={`Actions for ${user.email}`}
									value=""
									onChange={(event) => {
										if (event.target.value === 'activate') onActivate(user.id);
										if (event.target.value === 'deactivate') onDeactivate(user.id);
										event.target.value = '';
									}}
									className="w-8 appearance-none rounded-md border border-slate-200 bg-white bg-none px-1 py-2 text-sm text-slate-600 outline-none focus:border-blue-500"
								>
									<option value="">Select action</option>
									{user.isActive ? (
										<option value="deactivate">Deactivate</option>
									) : (
										<option value="activate">Activate</option>
									)}
								</select><MoreHorizontal className="pointer-events-none -ml-8 h-4 w-4 text-slate-400" /></div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
