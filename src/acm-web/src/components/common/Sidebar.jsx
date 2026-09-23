import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    // These paths will connect to the pages we build in the next phases
    const links = [
        { name: 'Dashboard', path: '/' },
        { name: 'Curriculum (M2)', path: '/curriculum' },
        { name: 'Approvals Inbox (M4)', path: '/approvals' },
        { name: 'Session Archive (M3)', path: '/sessions' },
        { name: 'User Management (M1)', path: '/users' },
    ];

    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col shrink-0">
            <div className="h-16 flex items-center px-6 text-xl font-bold border-b border-gray-800 tracking-wide">
                ACM Admin
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {links.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        className={({ isActive }) =>
                            `block px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        {link.name}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}