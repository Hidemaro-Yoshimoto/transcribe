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
    responseLimit: false,
  },
  maxDuration: 60,
}

export default async function handler(req, res) {
  console.log('🔄 Upload API called, method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📝 Starting file processing...')
    // Parse form data - Vercel has 4.5MB limit for serverless functions
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB (safe limit for Vercel)
    })

    const [fields, files] = await form.parse(req)
    const file = files.file[0]
    
    console.log('📁 File parsed:', {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype
    })

    // Validate file type
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.mp4', '.avi', '.mov', '.mkv']
    const fileExt = file.originalFilename.toLowerCase().slice(-4)
    
    if (!allowedTypes.some(ext => fileExt.includes(ext))) {
      console.log('❌ Unsupported file type:', fileExt)
      return res.status(400).json({ 
        error: 'Unsupported file format' 
      })
    }

    // Generate task ID
    const taskId = uuidv4()
    const fileName = `${taskId}_${file.originalFilename}`
    console.log('🆔 Generated task ID:', taskId)

    // Read file data
    const fs = require('fs')
    const fileBuffer = fs.readFileSync(file.filepath)
    console.log('📖 File read, buffer size:', fileBuffer.length)
    
    // Upload to Supabase Storage
    console.log('☁️ Uploading to Supabase...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
      })

    if (uploadError) {
      console.log('❌ Supabase upload error:', uploadError)
      throw uploadError
    }
    console.log('✅ Supabase upload successful')

    // Create database record
    console.log('💾 Creating database record...')
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
      console.log('❌ Database error:', dbError)
      throw dbError
    }
    console.log('✅ Database record created')

    // Initialize progress
    console.log('📊 Initializing progress...')
    await supabase
      .from('task_progress')
      .insert({
        task_id: taskId,
        progress: 10,
        message: 'File uploaded successfully. Starting transcription...',
        updated_at: new Date().toISOString(),
      })

    // Start transcription process
    let baseUrl
    if (process.env.VERCEL_URL) {
      baseUrl = process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`
    } else if (req.headers.host) {
      baseUrl = `https://${req.headers.host}`
    } else {
      baseUrl = req.headers.origin || 'http://localhost:3000'
    }
    
    console.log('🚀 Triggering transcription process:', `${baseUrl}/api/transcribe`)
    console.log('🔧 Environment info:', {
      vercelUrl: process.env.VERCEL_URL,
      origin: req.headers.origin,
      host: req.headers.host,
      finalUrl: baseUrl,
      protocol: req.headers['x-forwarded-proto'] || 'http'
    })
    
    // Try to start transcription process via HTTP
    try {
      console.log('🔄 Starting transcription via HTTP call...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
      
      const transcribeResponse = await fetch(`${baseUrl}/api/transcribe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Vercel-Internal-Call'
        },
        body: JSON.stringify({
          taskId,
          fileName,
          originalFilename: file.originalFilename,
          fileSize: file.size,
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('🎵 Transcribe response status:', transcribeResponse.status)
      
      if (!transcribeResponse.ok) {
        const errorText = await transcribeResponse.text()
        console.error('❌ Transcribe response error:', errorText)
        
        // Update database with error
        await supabase
          .from('transcription_records')
          .update({
            status: 'failed',
            error_message: `Transcription HTTP call failed: ${transcribeResponse.status} - ${errorText}`,
          })
          .eq('id', taskId)
      } else {
        console.log('✅ Transcription HTTP call successful')
      }
    } catch (error) {
      console.error('❌ Transcription trigger error:', error)
      
      // Update database with error
      await supabase
        .from('transcription_records')
        .update({
          status: 'failed',
          error_message: 'Failed to start transcription process: ' + error.message,
        })
        .eq('id', taskId)
    }

    console.log('✅ Upload completed successfully')
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