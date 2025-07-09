import React from 'react';

const ProgressBar = ({ progress, status, message }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '待機中';
      case 'processing':
        return '処理中';
      case 'completed':
        return '完了';
      case 'failed':
        return 'エラー';
      default:
        return '不明';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          ステータス: {getStatusText(status)}
        </span>
        {progress !== null && (
          <span className="text-sm text-gray-500">{progress}%</span>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(status)}`}
          style={{ width: `${progress || 0}%` }}
        ></div>
      </div>
      
      {message && (
        <p className="text-sm text-gray-600 mt-2">{message}</p>
      )}
    </div>
  );
};

export default ProgressBar;