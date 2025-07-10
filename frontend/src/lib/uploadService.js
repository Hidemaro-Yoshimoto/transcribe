import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

export class UploadService {
  static async uploadFileDirectly(file, onProgress) {
    const taskId = uuidv4()
    const fileName = `${taskId}_${file.name}`
    
    console.log('🚀 Starting direct upload to Supabase:', {
      taskId,
      fileName,
      fileSize: file.size,
      fileSizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
    })
    
    try {
      // Notify start of upload
      if (onProgress) {
        onProgress({
          stage: 'uploading',
          progress: 0,
          message: `ファイルをアップロード中... (${(file.size / (1024 * 1024)).toFixed(1)}MB)`
        })
      }

      // Upload directly to Supabase Storage with progress simulation
      // Note: Supabase doesn't provide real upload progress, so we simulate it
      const uploadPromise = supabase.storage
        .from('audio-files')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        })

      // Simulate upload progress for large files
      const progressInterval = setInterval(() => {
        if (onProgress) {
          const elapsed = Date.now() - startTime
          const estimatedTime = (file.size / (1024 * 1024)) * 1000 // Rough estimate: 1MB per second
          const progress = Math.min(90, (elapsed / estimatedTime) * 100) // Max 90% until complete
          
          onProgress({
            stage: 'uploading',
            progress: Math.round(progress),
            message: `ファイルをアップロード中... ${Math.round(progress)}%`
          })
        }
      }, 500)

      const startTime = Date.now()
      const { data, error } = await uploadPromise
      clearInterval(progressInterval)
      
      if (error) {
        console.error('❌ Supabase upload error:', error)
        
        // Enhanced error messages
        let errorMessage = 'アップロードに失敗しました'
        if (error.message?.includes('row-level security')) {
          errorMessage = 'ストレージへのアクセス権限がありません。管理者にお問い合わせください。'
        } else if (error.message?.includes('file already exists')) {
          errorMessage = 'ファイルが既に存在します。別の名前で再試行してください。'
        } else if (error.message?.includes('payload too large')) {
          errorMessage = 'ファイルサイズが大きすぎます。より小さなファイルをお試しください。'
        } else if (error.message) {
          errorMessage = `アップロードエラー: ${error.message}`
        }
        
        const uploadError = new Error(errorMessage)
        uploadError.originalError = error
        throw uploadError
      }
      
      if (onProgress) {
        onProgress({
          stage: 'uploading',
          progress: 100,
          message: 'アップロード完了'
        })
      }
      
      console.log('✅ File uploaded to Supabase successfully:', data)
      
      return {
        taskId,
        fileName,
        supabasePath: data.path,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type
      }
      
    } catch (error) {
      console.error('❌ Direct upload failed:', error)
      
      if (onProgress) {
        onProgress({
          stage: 'error',
          progress: 0,
          message: error.message || 'アップロードに失敗しました'
        })
      }
      
      throw error
    }
  }
  
  static async createTranscriptionTask(uploadResult, onProgress) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
      import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000'
    )
    
    console.log('📝 Creating transcription task:', uploadResult)
    
    try {
      if (onProgress) {
        onProgress({
          stage: 'creating_task',
          progress: 0,
          message: '文字起こしタスクを作成中...'
        })
      }

      const response = await fetch(`${API_BASE_URL}/api/create-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: uploadResult.taskId,
          filename: uploadResult.fileName,
          original_filename: uploadResult.originalFilename,
          file_size: uploadResult.fileSize,
          mime_type: uploadResult.mimeType,
          supabase_path: uploadResult.supabasePath
        })
      })
      
      if (!response.ok) {
        let errorMessage = 'タスクの作成に失敗しました'
        
        try {
          const errorData = await response.json()
          if (response.status === 400) {
            errorMessage = 'ファイル形式がサポートされていません'
          } else if (response.status === 413) {
            errorMessage = 'ファイルサイズが大きすぎます'
          } else if (response.status === 500) {
            errorMessage = 'サーバーエラーが発生しました。しばらく待ってから再試行してください。'
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } catch (parseError) {
          errorMessage = `サーバーエラー (${response.status})`
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('✅ Transcription task created:', data)
      
      if (onProgress) {
        onProgress({
          stage: 'task_created',
          progress: 100,
          message: 'タスク作成完了。文字起こしを開始します...'
        })
      }
      
      return data
      
    } catch (error) {
      console.error('❌ Failed to create transcription task:', error)
      
      if (onProgress) {
        onProgress({
          stage: 'error',
          progress: 0,
          message: error.message || 'タスクの作成に失敗しました'
        })
      }
      
      throw error
    }
  }
}