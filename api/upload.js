// Vercel Serverless Function for file upload
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: '400mb', // Set body size limit to 400MB
  },
  maxDuration: 900, // 15 minutes (for larger files)
}

export default async function handler(req, res) {
  console.log('🔄 Upload API called, method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📝 Starting file processing...')
    console.log('📊 Request headers:', {
      'content-length': req.headers['content-length'],
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    })
    
    // Parse form data - handling large files up to 400MB
    const form = formidable({
      maxFileSize: 400 * 1024 * 1024, // 400MB
      keepExtensions: true,
      multiples: false,
    })

    const [fields, files] = await form.parse(req)
    const file = files.file[0]
    
    if (!file) {
      console.log('❌ No file received')
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    console.log('📁 File parsed:', {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
    })
    
    // Check file size before processing
    if (file.size > 400 * 1024 * 1024) {
      console.log('❌ File too large:', file.size, 'bytes')
      return res.status(413).json({ 
        error: 'File size exceeds 400MB limit',
        received_size: file.size,
        max_size: 400 * 1024 * 1024
      })
    }

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
    
    // Start transcription process directly in upload function
    console.log('🔄 Starting transcription process directly...')
    
    // Immediately start transcription process (don't use setTimeout)
    let transcriptionStarted = false
    const startTranscription = async () => {
      if (transcriptionStarted) {
        console.log('⚠️ Transcription already started, skipping...')
        return
      }
      transcriptionStarted = true
      
      try {
        console.log('🎵 Starting background transcription for task:', taskId)
        
        // Update status to processing
        console.log('📝 Updating status to processing...')
        const { error: statusError } = await supabase
          .from('transcription_records')
          .update({ status: 'processing' })
          .eq('id', taskId)
        
        if (statusError) {
          console.error('❌ Status update error:', statusError)
          throw statusError
        }
        console.log('✅ Status updated to processing')

        // Update progress to 50%
        await supabase
          .from('task_progress')
          .upsert({
            task_id: taskId,
            progress: 50,
            message: 'Starting transcription...',
            updated_at: new Date().toISOString(),
          })

        // Download file from Supabase Storage
        console.log('⬇️ Downloading file from Supabase...')
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('audio-files')
          .download(fileName)

        if (downloadError) {
          throw downloadError
        }

        // Convert to buffer and save temporarily
        const buffer = await fileData.arrayBuffer()
        const tempDir = '/tmp'
        const tempFilePath = path.join(tempDir, fileName)
        
        fs.writeFileSync(tempFilePath, Buffer.from(buffer))
        console.log('✅ File saved temporarily')

        // Update progress to 70%
        await supabase
          .from('task_progress')
          .upsert({
            task_id: taskId,
            progress: 70,
            message: 'Transcribing audio...',
            updated_at: new Date().toISOString(),
          })

        // Transcribe with OpenAI
        console.log('🤖 Starting OpenAI transcription...')
        const audioFile = fs.createReadStream(tempFilePath)
        const transcript = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          response_format: 'text',
        })

        audioFile.destroy()
        console.log('✅ Transcription completed')

        // Update database with results
        await supabase
          .from('transcription_records')
          .update({
            status: 'completed',
            transcription_text: transcript,
            duration: null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', taskId)

        // Update progress to 100%
        await supabase
          .from('task_progress')
          .upsert({
            task_id: taskId,
            progress: 100,
            message: 'Transcription completed!',
            updated_at: new Date().toISOString(),
          })

        // Cleanup
        try {
          fs.unlinkSync(tempFilePath)
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError)
        }

        // Delete file from storage
        await supabase.storage
          .from('audio-files')
          .remove([fileName])

        console.log('🎉 Transcription process completed successfully!')

      } catch (error) {
        console.error('❌ Background transcription error:', error)
        
        // Update database with error
        await supabase
          .from('transcription_records')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', taskId)
      }
    }
    
    console.log('✅ Upload completed successfully')
    
    // Start transcription immediately before returning response
    console.log('🚀 Starting transcription before response...')
    
    // Start transcription - at least update status synchronously
    try {
      console.log('📝 Updating status to processing synchronously...')
      const { error: statusError } = await supabase
        .from('transcription_records')
        .update({ status: 'processing' })
        .eq('id', taskId)
      
      if (statusError) {
        console.error('❌ Status update error:', statusError)
      } else {
        console.log('✅ Status updated to processing synchronously')
      }
      
      // Update progress to 20%
      await supabase
        .from('task_progress')
        .upsert({
          task_id: taskId,
          progress: 20,
          message: 'Processing started...',
          updated_at: new Date().toISOString(),
        })
        
      console.log('📊 Progress updated to 20%')
    } catch (syncError) {
      console.error('❌ Synchronous processing error:', syncError)
    }
    
    // Try full transcription process synchronously (with timeout protection)
    const timeoutId = setTimeout(() => {
      console.log('⏰ Transcription timeout - returning response')
      if (!res.headersSent) {
        res.status(200).json({
          task_id: taskId,
          message: 'File uploaded successfully. Processing started.',
        })
      }
    }, 120000) // 2 minutes timeout (for larger files)
    
    try {
      // Attempt full transcription
      await startTranscription()
      clearTimeout(timeoutId)
      
      // If successful, return completed response
      if (!res.headersSent) {
        return res.status(200).json({
          task_id: taskId,
          message: 'File uploaded and transcription completed successfully.',
        })
      }
    } catch (fullTranscriptionError) {
      console.error('❌ Full transcription failed:', fullTranscriptionError)
      clearTimeout(timeoutId)
      
      // Start background transcription as fallback
      startTranscription().catch(error => {
        console.error('❌ Background transcription fallback error:', error)
      })
      
      // Return processing response
      if (!res.headersSent) {
        return res.status(200).json({
          task_id: taskId,
          message: 'File uploaded successfully. Processing in background.',
        })
      }
    }

  } catch (error) {
    console.error('❌ Upload error:', error)
    
    // Handle specific error types
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File size exceeds limit',
        details: error.message,
        max_size: '400MB'
      })
    }
    
    if (error.code === 'ENOENT') {
      return res.status(400).json({ 
        error: 'File not found or corrupted',
        details: error.message
      })
    }
    
    return res.status(500).json({ 
      error: error.message || 'Upload failed',
      code: error.code,
      details: error.stack
    })
  }
}