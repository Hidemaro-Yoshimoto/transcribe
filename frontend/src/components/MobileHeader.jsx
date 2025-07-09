import React from 'react';

const MobileHeader = ({ onToggleSidebar, onLogoClick }) => {
  return (
    <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="relative flex items-center justify-center h-16 px-4">
        {/* Menu Button - Left */}
        <button
          onClick={onToggleSidebar}
          className="absolute left-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Logo - Center */}
        <button
          onClick={onLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <img 
            src="../public/logo.png" 
            alt="Logo" 
            className="w-8 h-8 object-contain"
            onError={(e) => {
              // Fallback to text logo if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className="text-lg font-semibold text-gray-900">Transcribe</span>
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;