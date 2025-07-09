import React, { useState } from 'react';

const MinimalTranscriptionView = ({ transcription, onDownload, onBack }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription.transcription_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
        {/* Title */}
        <div>
          <h1 className="text-lg sm:text-xl font-medium text-gray-900 break-words">
            {transcription.original_filename}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {formatDate(transcription.created_at)}
            {transcription.duration && ` • ${formatDuration(transcription.duration)}`}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={copyToClipboard}
            className="minimal-button flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.375A2.25 2.25 0 014.125 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            <span className="text-sm">{copied ? 'コピー済み' : 'コピー'}</span>
          </button>
          
          <button
            onClick={() => onDownload(transcription.id)}
            className="minimal-button flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="text-sm">ダウンロード</span>
          </button>
        </div>
      </div>

      {/* Transcription Content */}
      <div className="flex-1 bg-white">
        <div className="prose prose-gray max-w-none">
          <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-sm sm:text-base break-words">
            {transcription.transcription_text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalTranscriptionView;