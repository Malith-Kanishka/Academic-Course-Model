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
      className="group fixed bottom-6 right-6 z-50 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300"
      aria-label="Open Chat Workspace"
    >
      <img
        src="/bot-avatar.png"
        alt=""
        aria-hidden="true"
        className="h-full w-full rounded-full object-contain transition-transform duration-300 group-hover:scale-110"
      />
    </button>
  );
};

export default FloatingChatWidget;
