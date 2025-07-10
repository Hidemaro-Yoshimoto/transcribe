import React, { useState, useEffect } from 'react';
import MinimalSidebar from './components/MinimalSidebar';
import MinimalUploadArea from './components/MinimalUploadArea';
import MinimalTranscriptionView from './components/MinimalTranscriptionView';
import EnhancedProgressIndicator from './components/EnhancedProgressIndicator';
import MinimalNotification from './components/MinimalNotification';
import MobileHeader from './components/MobileHeader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.MODE === 'production' 
    ? '' // Vercelでは相対パスを使用
    : 'http://localhost:8000'
);

function App() {
  const [currentTask, setCurrentTask] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedTranscription, setSelectedTranscription] = useState(null);
  const [view, setView] = useState('upload'); // 'upload', 'progress', 'transcription'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentTranscription, setRecentTranscription] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // 履歴を取得
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('履歴の取得に失敗しました:', error);
    }
  };

  // 初回ロード時に履歴を取得
  useEffect(() => {
    fetchHistory();
  }, []);

  // タスクステータスをポーリング
  useEffect(() => {
    if (!currentTask) return;

    const pollStatus = async () => {
      try {
        console.log('🔄 Polling status for task:', currentTask.task_id);
        const response = await fetch(`${API_BASE_URL}/api/status/${currentTask.task_id}`);
        console.log('📊 Status response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📈 Status data:', data);
          setCurrentTask(data);

          if (data.status === 'completed') {
            console.log('🎉 Transcription completed!');
            setIsUploading(false);
            showNotification('文字起こしが完了しました', 'success');
            
            // 最新の文字起こし結果を取得して表示
            try {
              const response = await fetch(`${API_BASE_URL}/api/history`);
              if (response.ok) {
                const historyData = await response.json();
                const latestTranscription = historyData.find(item => item.id === data.task_id);
                if (latestTranscription) {
                  setRecentTranscription(latestTranscription);
                }
              }
            } catch (error) {
              console.error('Failed to fetch latest transcription:', error);
            }
            
            setTimeout(() => {
              fetchHistory();
              setCurrentTask(null);
              setView('upload');
            }, 2000);
          } else if (data.status === 'failed') {
            console.log('💥 Transcription failed:', data.error);
            setIsUploading(false);
            showNotification(`エラー: ${data.error || '文字起こしに失敗しました'}`, 'error');
            setTimeout(() => {
              fetchHistory();
              setCurrentTask(null);
              setView('upload');
            }, 2000);
          } else {
            console.log('⏳ Still processing...', {
              status: data.status,
              progress: data.progress,
              message: data.message
            });
          }
        } else {
          console.error('❌ Status request failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Status polling error:', error);
        setIsUploading(false);
        setCurrentTask(null);
        setView('upload');
        showNotification('ステータスの取得に失敗しました', 'error');
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [currentTask?.task_id]);

  // 通知表示
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // アップロード進捗更新
  const handleUploadProgress = (progressData) => {
    console.log('📊 Upload progress update:', progressData);
    setUploadProgress(progressData);
    
    // Switch to progress view when upload starts
    if (progressData.stage === 'uploading' && view !== 'progress') {
      setView('progress');
      setIsUploading(true);
    }
  };

  // ファイルアップロード（直接アップロード対応）
  const handleUpload = async (uploadData) => {
    console.log('🚀 Upload started (direct):', uploadData);
    
    setIsUploading(true);
    setCurrentTask(null);
    setUploadProgress(null); // Reset upload progress
    setView('progress');

    try {
      setCurrentTask({
        task_id: uploadData.task_id,
        status: 'pending',
        progress: 10,
        message: uploadData.message || 'アップロード完了。処理を開始します...'
      });
      showNotification('ファイルがアップロードされました', 'success');
    } catch (error) {
      console.error('❌ Upload error:', error);
      setIsUploading(false);
      setView('upload');
      setUploadProgress(null);
      showNotification(error.message, 'error');
    }
  };

  // ファイルダウンロード
  const handleDownload = async (recordId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/download/${recordId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `transcription_${recordId}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('ダウンロードが開始されました', 'success');
      } else {
        throw new Error('ダウンロードに失敗しました');
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      showNotification(error.message, 'error');
    }
  };

  // 新規文字起こし
  const handleNewTranscription = () => {
    setView('upload');
    setSelectedTranscription(null);
    setCurrentTask(null);
    setRecentTranscription(null);
    setUploadProgress(null);
    setIsUploading(false);
    setSidebarOpen(false); // モバイルでサイドバーを閉じる
  };

  // 履歴選択
  const handleSelectHistory = (item) => {
    if (item.status === 'completed') {
      setSelectedTranscription(item);
      setView('transcription');
      setRecentTranscription(null);
      setSidebarOpen(false); // モバイルでサイドバーを閉じる
    }
  };

  // 履歴削除
  const handleDeleteHistory = async (recordId) => {
    if (!confirm('この履歴を削除してもよろしいですか？')) {
      return;
    }

    try {
      console.log('🗑️ Deleting record:', recordId);
      
      const response = await fetch(`${API_BASE_URL}/api/delete/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Delete successful:', data);
        
        // 削除された項目が現在選択中の場合、選択を解除
        if (selectedTranscription && selectedTranscription.id === recordId) {
          setSelectedTranscription(null);
          setView('upload');
        }
        
        // 履歴を更新
        fetchHistory();
        showNotification('履歴が削除されました', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      showNotification(error.message, 'error');
    }
  };

  // 履歴リネーム
  const handleRenameHistory = async (recordId, newName) => {
    try {
      console.log('📝 Renaming record:', recordId, 'to:', newName);
      
      const response = await fetch(`${API_BASE_URL}/api/rename/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Rename successful:', data);
        
        // 履歴を更新
        fetchHistory();
        showNotification('名前が変更されました', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '名前の変更に失敗しました');
      }
    } catch (error) {
      console.error('❌ Rename error:', error);
      showNotification(error.message, 'error');
    }
  };

  // 戻る
  const handleBack = () => {
    setView('upload');
    setSelectedTranscription(null);
  };

  // ロゴクリック（TOPに戻る）
  const handleLogoClick = () => {
    setView('upload');
    setSelectedTranscription(null);
    setCurrentTask(null);
    setRecentTranscription(null);
    setUploadProgress(null);
    setIsUploading(false);
    setSidebarOpen(false);
  };

  // サイドバートグル
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const hasActiveTask = currentTask && (currentTask.status === 'processing' || currentTask.status === 'pending');

  const renderMainContent = () => {
    switch (view) {
      case 'progress':
        return (
          <EnhancedProgressIndicator
            uploadProgress={uploadProgress}
            currentTask={currentTask}
            isUploading={isUploading}
          />
        );
      case 'transcription':
        return selectedTranscription ? (
          <MinimalTranscriptionView
            transcription={selectedTranscription}
            onDownload={handleDownload}
            onBack={handleBack}
          />
        ) : null;
      default:
        return (
          <MinimalUploadArea
            onUpload={handleUpload}
            isUploading={isUploading}
            hasActiveTask={hasActiveTask}
            recentTranscription={recentTranscription}
            onDownload={handleDownload}
            showNotification={showNotification}
            onUploadProgress={handleUploadProgress}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <MobileHeader 
        onToggleSidebar={handleToggleSidebar}
        onLogoClick={handleLogoClick}
      />

      <div className="flex">
        {/* Sidebar */}
        <MinimalSidebar
          history={history}
          onNewTranscription={handleNewTranscription}
          selectedId={selectedTranscription?.id}
          onSelectHistory={handleSelectHistory}
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          onLogoClick={handleLogoClick}
          onDeleteHistory={handleDeleteHistory}
          onRenameHistory={handleRenameHistory}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {renderMainContent()}
        </div>
      </div>

      {/* Notification */}
      <MinimalNotification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

export default App;