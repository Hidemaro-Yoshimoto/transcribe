// Vercel Serverless Function for file upload
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 400 * 1024 * 1024, // 400MB
    })

    const [fields, files] = await form.parse(req)
    const file = files.file[0]

    // Validate file type
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.mp4', '.avi', '.mov', '.mkv']
    const fileExt = file.originalFilename.toLowerCase().slice(-4)
    
    if (!allowedTypes.some(ext => fileExt.includes(ext))) {
      return res.status(400).json({ 
        error: 'Unsupported file format' 
      })
    }

    // Generate task ID
    const taskId = uuidv4()
    const fileName = `${taskId}_${file.originalFilename}`

    // Read file data
    const fs = require('fs')
    const fileBuffer = fs.readFileSync(file.filepath)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
      })

    if (uploadError) {
      throw uploadError
    }

    // Create database record
    const { data: dbData, error: dbError } = await supabase
      .from('transcription_records')
      .insert({
        id: taskId,
        filename: fileName,
        original_filename: file.originalFilename,
        status: 'pending',
        file_size: file.size,
        created_at: new Date().toISOString(),
      })
      .select()

    if (dbError) {
      throw dbError
    }

    // Initialize progress
    await supabase
      .from('task_progress')
      .insert({
        task_id: taskId,
        progress: 10,
        message: 'File uploaded successfully. Starting transcription...',
        updated_at: new Date().toISOString(),
      })

    // Start transcription process (fire and forget)
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    // Don't wait for the response - fire and forget
    fetch(`${baseUrl}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        fileName,
        originalFilename: file.originalFilename,
        fileSize: file.size,
      }),
    }).catch(error => {
      console.error('Transcription trigger error:', error)
      // Update database with error
      supabase
        .from('transcription_records')
        .update({
          status: 'failed',
          error_message: 'Failed to start transcription process',
        })
        .eq('id', taskId)
    })

    return res.status(200).json({
      task_id: taskId,
      message: 'File uploaded successfully. Processing started.',
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ 
      error: error.message || 'Upload failed' 
    })
  }
}