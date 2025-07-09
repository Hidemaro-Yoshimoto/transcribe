import React from 'react';

const MinimalProgressIndicator = ({ currentTask, isUploading }) => {
  if (!currentTask && !isUploading) return null;

  const getStatusText = (status) => {
    if (isUploading && (!currentTask || currentTask.status === 'pending')) {
      return 'アップロード中...';
    }
    
    switch (status) {
      case 'pending':
        return '処理開始を待機中...';
      case 'processing':
        return '文字起こし中...';
      case 'completed':
        return '完了';
      case 'failed':
        return '失敗';
      default:
        return '処理中...';
    }
  };

  const progress = currentTask?.progress || 0;
  const status = currentTask?.status || 'pending';

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md text-center space-y-4 sm:space-y-6 px-4">
        {/* Progress Circle */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#374151"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          
          {/* Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Status Text */}
        <div>
          <p className="text-base sm:text-lg font-medium text-gray-900 break-words">
            {getStatusText(status)}
          </p>
          {currentTask?.message && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
              {currentTask.message}
            </p>
          )}
        </div>

        {/* Error Message */}
        {status === 'failed' && currentTask?.error && (
          <div className="p-3 sm:p-4 bg-gray-50 rounded text-left">
            <p className="text-xs sm:text-sm text-gray-700 break-words">
              {currentTask.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalProgressIndicator;