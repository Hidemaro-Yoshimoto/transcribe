// New API endpoint for creating transcription tasks after direct upload
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Only metadata, no file content
    },
  },
  maxDuration: 900, // 15 minutes for transcription
}

export default async function handler(req, res) {
  console.log('🔄 Create-task API called, method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { 
    task_id, 
    filename, 
    original_filename, 
    file_size, 
    mime_type,
    supabase_path 
  } = req.body

  console.log('📝 Creating transcription task:', {
    task_id,
    filename,
    original_filename,
    file_size,
    mime_type,
    supabase_path
  })

  try {
    // Validate required fields
    if (!task_id || !filename || !original_filename || !file_size || !supabase_path) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['task_id', 'filename', 'original_filename', 'file_size', 'supabase_path']
      })
    }

    // Validate file type
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.mp4', '.avi', '.mov', '.mkv']
    const fileExt = original_filename.toLowerCase().slice(-4)
    
    if (!allowedTypes.some(ext => fileExt.includes(ext))) {
      console.log('❌ Unsupported file type:', fileExt)
      return res.status(400).json({ 
        error: 'Unsupported file format',
        supported: allowedTypes
      })
    }

    // Create database record
    console.log('💾 Creating database record...')
    const { data: dbData, error: dbError } = await supabase
      .from('transcription_records')
      .insert({
        id: task_id,
        filename: filename,
        original_filename: original_filename,
        status: 'pending',
        file_size: file_size,
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
        task_id: task_id,
        progress: 10,
        message: 'File uploaded successfully. Starting transcription...',
        updated_at: new Date().toISOString(),
      })

    // Start transcription process
    console.log('🚀 Starting transcription process...')
    
    // Start transcription immediately before returning response
    let transcriptionStarted = false
    const startTranscription = async () => {
      if (transcriptionStarted) {
        console.log('⚠️ Transcription already started, skipping...')
        return
      }
      transcriptionStarted = true
      
      try {
        console.log('🎵 Starting transcription for task:', task_id)
        
        // Update status to processing
        console.log('📝 Updating status to processing...')
        const { error: statusError } = await supabase
          .from('transcription_records')
          .update({ status: 'processing' })
          .eq('id', task_id)
        
        if (statusError) {
          console.error('❌ Status update error:', statusError)
          throw statusError
        }
        console.log('✅ Status updated to processing')

        // Update progress to 30%
        await supabase
          .from('task_progress')
          .upsert({
            task_id: task_id,
            progress: 30,
            message: 'Downloading file from storage...',
            updated_at: new Date().toISOString(),
          })

        // Download file from Supabase Storage
        console.log('⬇️ Downloading file from Supabase storage...')
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('audio-files')
          .download(supabase_path)

        if (downloadError) {
          console.error('❌ Download error:', downloadError)
          throw downloadError
        }
        console.log('✅ File downloaded from storage')

        // Update progress to 50%
        await supabase
          .from('task_progress')
          .upsert({
            task_id: task_id,
            progress: 50,
            message: 'Preparing file for transcription...',
            updated_at: new Date().toISOString(),
          })

        // Convert to buffer and save temporarily
        const buffer = await fileData.arrayBuffer()
        const tempDir = '/tmp'
        const tempFilePath = path.join(tempDir, filename)
        
        fs.writeFileSync(tempFilePath, Buffer.from(buffer))
        console.log('✅ File saved temporarily')

        // Update progress to 70%
        await supabase
          .from('task_progress')
          .upsert({
            task_id: task_id,
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
          .eq('id', task_id)

        // Update progress to 100%
        await supabase
          .from('task_progress')
          .upsert({
            task_id: task_id,
            progress: 100,
            message: 'Transcription completed!',
            updated_at: new Date().toISOString(),
          })

        // Cleanup temporary file
        try {
          fs.unlinkSync(tempFilePath)
        } catch (cleanupError) {
          console.error('⚠️ Cleanup error:', cleanupError)
        }

        // Delete file from storage (optional, keep for now)
        // await supabase.storage
        //   .from('audio-files')
        //   .remove([supabase_path])

        console.log('🎉 Transcription process completed successfully!')

      } catch (error) {
        console.error('❌ Transcription error:', error)
        
        // Update database with error
        await supabase
          .from('transcription_records')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', task_id)

        // Update progress with error
        await supabase
          .from('task_progress')
          .upsert({
            task_id: task_id,
            progress: 0,
            message: `Error: ${error.message}`,
            updated_at: new Date().toISOString(),
          })
      }
    }
    
    // Start synchronous processing with timeout protection
    const timeoutId = setTimeout(() => {
      console.log('⏰ Transcription timeout - returning response')
      if (!res.headersSent) {
        res.status(200).json({
          task_id: task_id,
          message: 'Task created successfully. Processing started.',
        })
      }
    }, 120000) // 2 minutes timeout
    
    try {
      // Attempt full transcription
      await startTranscription()
      clearTimeout(timeoutId)
      
      // If successful, return completed response
      if (!res.headersSent) {
        return res.status(200).json({
          task_id: task_id,
          message: 'Task created and transcription completed successfully.',
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
          task_id: task_id,
          message: 'Task created successfully. Processing in background.',
        })
      }
    }

  } catch (error) {
    console.error('❌ Create-task error:', error)
    
    // Try to clean up the uploaded file on error
    try {
      await supabase.storage
        .from('audio-files')
        .remove([supabase_path])
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError)
    }
    
    return res.status(500).json({ 
      error: error.message || 'Failed to create transcription task',
      details: error.stack
    })
  }
}