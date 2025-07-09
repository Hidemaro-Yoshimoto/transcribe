import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadService } from '../lib/uploadService';

const MinimalUploadArea = ({ onUpload, isUploading, hasActiveTask, recentTranscription, onDownload, showNotification }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const maxSize = 400 * 1024 * 1024; // 400MB
      
      if (file.size > maxSize) {
        showNotification('ファイルサイズが大きすぎます。400MB以下のファイルをアップロードしてください。', 'error');
        return;
      }
      
      // Use direct upload service
      try {
        console.log('🚀 Starting direct upload process...');
        showNotification('アップロード開始中...', 'info');
        
        // Step 1: Upload directly to Supabase
        const uploadResult = await UploadService.uploadFileDirectly(file);
        console.log('✅ Direct upload completed:', uploadResult);
        
        // Step 2: Create transcription task
        const taskResult = await UploadService.createTranscriptionTask(uploadResult);
        console.log('✅ Task created:', taskResult);
        
        // Call parent onUpload with task info
        onUpload({
          task_id: taskResult.task_id,
          message: taskResult.message,
          originalFilename: uploadResult.originalFilename
        });
        
      } catch (error) {
        console.error('❌ Direct upload failed:', error);
        showNotification(`アップロードに失敗しました: ${error.message}`, 'error');
      }
    }
  }, [onUpload, showNotification]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4', '.avi', '.mov', '.mkv']
    },
    maxFiles: 1,
    maxSize: 400 * 1024 * 1024, // 400MB
    disabled: isUploading || hasActiveTask
  });

  const isDisabled = isUploading || hasActiveTask;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recentTranscription.transcription_text);
      showNotification('クリップボードにコピーしました', 'success');
    } catch (error) {
      console.error('コピーに失敗しました:', error);
      showNotification('コピーに失敗しました', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Upload Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          {...getRootProps()}
          className={`w-full max-w-lg h-64 sm:h-80 flex flex-col items-center justify-center text-center transition-all duration-200 px-4 ${
            isDragActive 
              ? 'text-gray-900' 
              : isDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 cursor-pointer hover:text-gray-900'
          }`}
        >
          <input {...getInputProps()} />
          
          {isDisabled ? (
            <div className="space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto">
                <div className="w-full h-full border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-base sm:text-lg font-medium">処理中...</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                  現在のタスクが完了するまでお待ちください
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto">
                <svg 
                  className="w-full h-full stroke-current" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" 
                  />
                </svg>
              </div>
              
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-medium">
                  {isDragActive ? 'ファイルをドロップしてください' : 'クリックしてファイルを選択'}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 break-words">
                  または、ファイルをここにドラッグ&ドロップ
                </p>
                <p className="text-xs text-gray-400 break-words">
                  MP3, WAV, M4A, MP4, AVI, MOV, MKV • 最大 400MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transcription */}
      {recentTranscription && recentTranscription.status === 'completed' && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                最新の文字起こし結果
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopy}
                  className="minimal-button text-gray-700 hover:bg-gray-100 border border-gray-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  <span className="hidden sm:inline">コピー</span>
                  <span className="sm:hidden">コピー</span>
                </button>
                <button
                  onClick={() => onDownload(recentTranscription.id)}
                  className="minimal-button text-gray-700 hover:bg-gray-100 border border-gray-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span className="hidden sm:inline">ダウンロード</span>
                  <span className="sm:hidden">DL</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 break-words">
                  {recentTranscription.original_filename}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(recentTranscription.completed_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="relative">
                <div className="max-h-60 overflow-y-auto">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans leading-relaxed pr-2">
                    {recentTranscription.transcription_text}
                  </pre>
                </div>
                
                {/* Mobile copy button (floating) */}
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 sm:hidden p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                  title="コピー"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalUploadArea;