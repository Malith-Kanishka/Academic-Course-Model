import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingChatWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/chat' || location.pathname.startsWith('/dashboard')) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();
    navigate('/chat');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300"
      aria-label="Open Chat Workspace"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    </button>
  );
};

export default FloatingChatWidget;
