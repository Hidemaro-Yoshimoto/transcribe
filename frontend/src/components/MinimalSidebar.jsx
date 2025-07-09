import React, { useState } from 'react';

const MinimalSidebar = ({ 
  history, 
  onNewTranscription, 
  selectedId, 
  onSelectHistory, 
  isOpen, 
  onToggle,
  onLogoClick,
  onDeleteHistory,
  onRenameHistory 
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
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

  const handleMenuClick = (e, itemId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === itemId ? null : itemId);
  };

  const handleRenameClick = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingName(item.original_filename);
    setOpenMenuId(null);
  };

  const handleRenameSubmit = async (e, itemId) => {
    e.preventDefault();
    if (editingName.trim() && editingName.trim() !== history.find(h => h.id === itemId)?.original_filename) {
      await onRenameHistory(itemId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteClick = (e, itemId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    onDeleteHistory(itemId);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden"
          onClick={() => {
            onToggle();
            setOpenMenuId(null);
          }}
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
                src="/logo.png" 
                alt="Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback to text logo if image fails to load
                  e.target.style.display = 'none';
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
                  className={`sidebar-item ${
                    selectedId === item.id ? 'sidebar-item-active' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelectHistory(item)}
                    >
                      <div className="flex items-center space-x-2">
                        {/* Status indicator */}
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'completed' ? 'bg-gray-400' :
                          item.status === 'processing' ? 'bg-gray-300 animate-pulse' :
                          item.status === 'failed' ? 'bg-gray-200' :
                          'bg-gray-100'
                        }`} />
                        
                        {/* Editable title */}
                        {editingId === item.id ? (
                          <form onSubmit={(e) => handleRenameSubmit(e, item.id)} className="flex-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => handleRenameCancel()}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') handleRenameCancel();
                              }}
                              className="w-full text-sm font-medium bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
                              autoFocus
                            />
                          </form>
                        ) : (
                          <span className="text-sm font-medium truncate">
                            {truncateFilename(item.original_filename)}
                          </span>
                        )}
                      </div>
                      
                      {editingId !== item.id && (
                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(item.created_at)}
                        </div>
                      )}
                    </div>
                    
                    {/* Three dots menu */}
                    {editingId !== item.id && (
                      <div className="relative">
                        <button
                          onClick={(e) => handleMenuClick(e, item.id)}
                          className="flex-shrink-0 p-1 ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="メニュー"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown menu */}
                        {openMenuId === item.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                            <div className="py-1">
                              <button
                                onClick={(e) => handleRenameClick(e, item)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                                名前を変更
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, item.id)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                削除
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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