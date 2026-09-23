import { authService } from '../../services/authService';

export default function Navbar() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            <h1 className="text-lg font-semibold text-gray-700">Control Panel</h1>
            <button
                onClick={() => authService.logout()}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded hover:bg-black transition-colors cursor-pointer"
            >
                Log Out
            </button>
        </header>
    );
}