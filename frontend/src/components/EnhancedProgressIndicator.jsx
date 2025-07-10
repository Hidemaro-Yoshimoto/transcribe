import React from 'react';

const EnhancedProgressIndicator = ({ uploadProgress, currentTask, isUploading }) => {
  const getProgressData = () => {
    // Priority: uploadProgress > currentTask progress
    if (uploadProgress) {
      return {
        progress: uploadProgress.progress || 0,
        message: uploadProgress.message || 'アップロード中...',
        stage: uploadProgress.stage || 'uploading'
      };
    }
    
    if (currentTask) {
      return {
        progress: currentTask.progress || 0,
        message: currentTask.message || '処理中...',
        stage: currentTask.status || 'processing'
      };
    }
    
    return {
      progress: 0,
      message: 'アップロード準備中...',
      stage: 'preparing'
    };
  };

  const { progress, message, stage } = getProgressData();
  
  const getStageColor = (currentStage) => {
    switch (currentStage) {
      case 'uploading':
        return 'text-blue-600';
      case 'creating_task':
        return 'text-yellow-600';
      case 'processing':
        return 'text-purple-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStageIcon = (currentStage) => {
    switch (currentStage) {
      case 'uploading':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
          </svg>
        );
      case 'creating_task':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-3h.008v.008h-.008v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getProgressBarColor = (currentStage) => {
    switch (currentStage) {
      case 'uploading':
        return 'bg-blue-500';
      case 'creating_task':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${getStageColor(stage)}`}>
            {stage === 'error' ? (
              <div className="text-red-600">
                {getStageIcon(stage)}
              </div>
            ) : (
              <div className={`${stage === 'processing' ? 'animate-pulse' : ''}`}>
                {getStageIcon(stage)}
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {stage === 'uploading' && 'ファイルアップロード中'}
            {stage === 'creating_task' && 'タスク作成中'}
            {stage === 'processing' && '文字起こし処理中'}
            {stage === 'completed' && '処理完了'}
            {stage === 'error' && 'エラーが発生しました'}
            {!['uploading', 'creating_task', 'processing', 'completed', 'error'].includes(stage) && '準備中'}
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            {message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>進捗</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(stage)}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between text-xs text-gray-500 mb-6">
          <div className={`flex flex-col items-center ${['uploading', 'creating_task', 'processing', 'completed'].includes(stage) ? 'text-blue-600' : ''}`}>
            <div className={`w-2 h-2 rounded-full mb-1 ${stage === 'uploading' ? 'bg-blue-500' : progress > 0 ? 'bg-blue-300' : 'bg-gray-300'}`}></div>
            <span>アップロード</span>
          </div>
          <div className={`flex flex-col items-center ${['creating_task', 'processing', 'completed'].includes(stage) ? 'text-yellow-600' : ''}`}>
            <div className={`w-2 h-2 rounded-full mb-1 ${stage === 'creating_task' ? 'bg-yellow-500' : ['processing', 'completed'].includes(stage) ? 'bg-yellow-300' : 'bg-gray-300'}`}></div>
            <span>準備</span>
          </div>
          <div className={`flex flex-col items-center ${['processing', 'completed'].includes(stage) ? 'text-purple-600' : ''}`}>
            <div className={`w-2 h-2 rounded-full mb-1 ${stage === 'processing' ? 'bg-purple-500' : stage === 'completed' ? 'bg-purple-300' : 'bg-gray-300'}`}></div>
            <span>処理</span>
          </div>
          <div className={`flex flex-col items-center ${stage === 'completed' ? 'text-green-600' : ''}`}>
            <div className={`w-2 h-2 rounded-full mb-1 ${stage === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>完了</span>
          </div>
        </div>

        {/* Additional Info for Large Files */}
        {(stage === 'uploading' || stage === 'processing') && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              大きなファイルの場合、処理に時間がかかることがあります
            </p>
          </div>
        )}

        {/* Error Details */}
        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-700 mb-2">
              処理中にエラーが発生しました
            </p>
            <p className="text-xs text-red-600">
              しばらく時間をおいてから再度お試しください
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedProgressIndicator;