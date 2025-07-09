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
      // Upload directly to Supabase Storage
      const { data, error } = await supabase.storage
        .from('audio-files')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        })
      
      if (error) {
        console.error('❌ Supabase upload error:', error)
        throw error
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
      throw error
    }
  }
  
  static async createTranscriptionTask(uploadResult) {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
      import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000'
    )
    
    console.log('📝 Creating transcription task:', uploadResult)
    
    try {
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create transcription task')
      }
      
      const data = await response.json()
      console.log('✅ Transcription task created:', data)
      
      return data
      
    } catch (error) {
      console.error('❌ Failed to create transcription task:', error)
      throw error
    }
  }
}