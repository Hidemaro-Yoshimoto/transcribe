import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const Dropzone = ({ onUpload, isUploading, hasActiveTask }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4', '.avi', '.mov', '.mkv']
    },
    maxFiles: 1,
    disabled: isUploading || hasActiveTask
  });

  const isDisabled = isUploading || hasActiveTask;

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
        isDragActive 
          ? 'border-gray-400 bg-gray-50/50 scale-[1.02]' 
          : isDisabled
            ? 'border-gray-200 bg-gray-50/30'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/20'
      } ${isDisabled ? 'cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
               backgroundSize: '20px 20px'
             }} 
        />
      </div>
      
      <div className="relative z-10">
        {isDisabled ? (
          <div className="text-gray-400">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-9V6a2 2 0 00-2-2H8a2 2 0 00-2 2v3m12 0v1a2 2 0 01-2 2H8a2 2 0 01-2-2v-1m12 0H4" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">処理中...</p>
            <p className="text-sm text-gray-500">
              現在のタスクが完了するまでお待ちください
            </p>
          </div>
        ) : (
          <div className="text-gray-600">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDragActive 
                ? 'bg-gray-200 scale-110' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}>
              <svg
                className={`w-8 h-8 transition-all duration-300 ${
                  isDragActive ? 'text-gray-700 scale-110' : 'text-gray-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium mb-2 text-gray-700">ファイルをドロップ</p>
                <p className="text-sm text-gray-500">ファイルを離してアップロード</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">音声・動画ファイルをアップロード</p>
                <p className="text-sm text-gray-500 mb-4">
                  ドラッグ&ドロップ または{' '}
                  <span className="text-gray-700 underline font-medium">クリックして選択</span>
                </p>
                <div className="inline-flex items-center space-x-4 text-xs text-gray-400">
                  <span>MP3, WAV, M4A, MP4, AVI, MOV, MKV</span>
                  <span>•</span>
                  <span>最大 400MB</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;