import React, { useState } from 'react';

const Sidebar = ({ history, onDownload, isOpen, onToggle }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Simple feedback without notification
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'コピー完了';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
        );
      case 'processing':
        return (
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        );
      case 'failed':
        return (
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        );
      default:
        return (
          <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
        );
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0 lg:static lg:w-96`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">履歴</h2>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>履歴がありません</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedItem === item.id
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                  }`}
                  onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(item.status)}
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.original_filename}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>{formatDate(item.created_at)}</span>
                        <span>{formatDuration(item.duration)}</span>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${
                      selectedItem === item.id ? 'rotate-180' : ''
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Expanded Content */}
                  {selectedItem === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {item.status === 'completed' && (
                        <>
                          <div className="mb-4">
                            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {item.transcription_text}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.transcription_text);
                              }}
                              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              コピー
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownload(item.id);
                              }}
                              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-800 border border-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                            >
                              ダウンロード
                            </button>
                          </div>
                        </>
                      )}
                      
                      {item.status === 'failed' && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            処理に失敗しました
                          </p>
                        </div>
                      )}
                      
                      {item.status === 'processing' && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            処理中...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;