import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const MinimalUploadArea = ({ onUpload, isUploading, hasActiveTask }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const maxSize = 400 * 1024 * 1024; // 400MB
      
      if (file.size > maxSize) {
        alert('ファイルサイズが大きすぎます。400MB以下のファイルをアップロードしてください。');
        return;
      }
      
      onUpload(file);
    }
  }, [onUpload]);

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

  return (
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
  );
};

export default MinimalUploadArea;