import React from 'react';

const StatusPanel = ({ currentTask, isUploading }) => {
  if (!currentTask && !isUploading) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'processing':
        return (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
        );
      default:
        return (
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
        );
    }
  };

  const getStatusText = (status) => {
    if (isUploading && (!currentTask || currentTask.status === 'pending')) {
      return 'アップロード中...';
    }
    
    switch (status) {
      case 'pending':
        return '処理開始を待機中...';
      case 'processing':
        return '文字起こし処理中...';
      case 'completed':
        return '文字起こし完了';
      case 'failed':
        return '処理に失敗しました';
      default:
        return '処理中...';
    }
  };

  const progress = currentTask?.progress || 0;
  const status = currentTask?.status || 'pending';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(status)}
          <h3 className="text-lg font-medium text-gray-900">
            {getStatusText(status)}
          </h3>
        </div>
        {status === 'processing' && (
          <span className="text-sm text-gray-500 font-mono">
            {progress}%
          </span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              status === 'completed' 
                ? 'bg-gray-800' 
                : status === 'failed' 
                  ? 'bg-gray-400' 
                  : 'bg-gray-600'
            }`}
            style={{ 
              width: status === 'completed' ? '100%' : `${progress}%`,
              minWidth: status === 'processing' || isUploading ? '8px' : '0%'
            }}
          />
        </div>
        
        {/* Progress dots animation */}
        {(status === 'processing' || isUploading) && (
          <div className="absolute top-0 left-0 w-full h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" 
                 style={{ 
                   width: '30%',
                   animation: 'slide 2s ease-in-out infinite',
                   backgroundSize: '200% 100%'
                 }} />
          </div>
        )}
      </div>
      
      {/* Status Message */}
      {currentTask?.message && (
        <p className="text-sm text-gray-600 mt-3 font-medium">
          {currentTask.message}
        </p>
      )}
      
      {/* Error Message */}
      {status === 'failed' && currentTask?.error && (
        <p className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {currentTask.error}
        </p>
      )}
      
      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default StatusPanel;