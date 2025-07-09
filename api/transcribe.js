// Vercel Serverless Function for transcription processing
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { taskId, fileName, originalFilename, fileSize } = req.body

  try {
    // Update status to processing
    await supabase
      .from('transcription_records')
      .update({ status: 'processing' })
      .eq('id', taskId)

    // Download file from Supabase Storage
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

    // Update progress to 50%
    await updateProgress(taskId, 50, 'Starting transcription...')

    // Transcribe with OpenAI (直接ファイルを送信)
    const audioFile = fs.createReadStream(tempFilePath)
    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    })

    // Close file stream
    audioFile.destroy()

    // Update progress to 90%
    await updateProgress(taskId, 90, 'Finalizing transcription...')

    const fullTranscription = transcript

    // Update database with results
    await supabase
      .from('transcription_records')
      .update({
        status: 'completed',
        transcription_text: fullTranscription,
        duration: null, // We'll skip duration calculation for now
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // Update progress to 100%
    await updateProgress(taskId, 100, 'Transcription completed!')

    // Cleanup temporary files
    cleanupFiles([tempFilePath])

    // Delete file from storage to save space
    await supabase.storage
      .from('audio-files')
      .remove([fileName])

    return res.status(200).json({
      status: 'completed',
      transcription: fullTranscription,
      duration: null,
    })

  } catch (error) {
    console.error('Transcription error:', error)
    
    // Update database with error
    await supabase
      .from('transcription_records')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', taskId)

    return res.status(500).json({ 
      error: error.message || 'Transcription failed' 
    })
  }
}

// Removed FFmpeg functions - simplifying for Vercel environment

async function updateProgress(taskId, progress, message) {
  // Store progress in Supabase (could use a separate table)
  await supabase
    .from('task_progress')
    .upsert({
      task_id: taskId,
      progress,
      message,
      updated_at: new Date().toISOString(),
    })
}

function cleanupFiles(filePaths) {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })
}