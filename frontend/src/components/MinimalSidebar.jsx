import React from 'react';

const MinimalSidebar = ({ 
  history, 
  onNewTranscription, 
  selectedId, 
  onSelectHistory, 
  isOpen, 
  onToggle,
  onLogoClick 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateFilename = (filename, maxLength = 30) => {
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength) + '...';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 h-screen bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header with Logo */}
        <div className="p-4 border-b border-gray-200">
          {/* Logo */}
          <div className="mb-4">
            <button
              onClick={onLogoClick}
              className="flex items-center space-x-3 w-full text-left hover:opacity-80 transition-opacity"
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
          
          {/* New Transcription Button */}
          <button
            onClick={onNewTranscription}
            className="w-full minimal-button minimal-button-primary"
          >
            新規文字起こし
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2 px-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">履歴</h3>
          </div>
          
          {history.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-gray-500">履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectHistory(item)}
                  className={`sidebar-item ${
                    selectedId === item.id ? 'sidebar-item-active' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {/* Status indicator */}
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'completed' ? 'bg-gray-400' :
                          item.status === 'processing' ? 'bg-gray-300 animate-pulse' :
                          item.status === 'failed' ? 'bg-gray-200' :
                          'bg-gray-100'
                        }`} />
                        
                        <span className="text-sm font-medium truncate">
                          {truncateFilename(item.original_filename)}
                        </span>
                      </div>
                      
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MinimalSidebar;