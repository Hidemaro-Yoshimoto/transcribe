import React from 'react';

const HistoryTable = ({ history, onDownload }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      completed: '完了',
      processing: '処理中',
      failed: 'エラー',
      pending: '待機中'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('テキストがクリップボードにコピーされました');
    } catch (err) {
      console.error('コピーに失敗しました:', err);
      alert('コピーに失敗しました');
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ファイル名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                サイズ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {item.original_filename}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(item.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatFileSize(item.file_size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(item.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {item.status === 'completed' && (
                    <>
                      <button
                        onClick={() => copyToClipboard(item.transcription_text)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        コピー
                      </button>
                      <button
                        onClick={() => onDownload(item.id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        ダウンロード
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 文字起こしテキストの表示 */}
      {history.some(item => item.status === 'completed') && (
        <div className="border-t border-gray-200">
          {history.filter(item => item.status === 'completed').map((item) => (
            <div key={`text-${item.id}`} className="p-4 border-b border-gray-100 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {item.original_filename}
                </h4>
                <button
                  onClick={() => copyToClipboard(item.transcription_text)}
                  className="text-xs text-blue-600 hover:text-blue-900 ml-2"
                >
                  コピー
                </button>
              </div>
              <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.transcription_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;