// Vercel Serverless Function for transcription processing
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import ffmpeg from 'fluent-ffmpeg'
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

    // Process audio file (convert to WAV if needed)
    const wavFilePath = await convertToWav(tempFilePath, tempDir)
    
    // Split into segments if longer than 25 minutes
    const segments = await splitAudio(wavFilePath, tempDir)
    
    // Transcribe each segment
    const transcriptions = []
    let totalDuration = 0

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      
      // Update progress
      const progress = Math.round(((i + 1) / segments.length) * 100)
      await updateProgress(taskId, progress, `Processing segment ${i + 1}/${segments.length}`)

      // Transcribe with OpenAI
      const audioFile = fs.createReadStream(segment.path)
      const transcript = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'text',
      })

      transcriptions.push(transcript)
      totalDuration += segment.duration
      
      // Close file stream
      audioFile.destroy()
    }

    // Combine transcriptions
    const fullTranscription = transcriptions.join('\n')

    // Update database with results
    await supabase
      .from('transcription_records')
      .update({
        status: 'completed',
        transcription_text: fullTranscription,
        duration: totalDuration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // Cleanup temporary files
    cleanupFiles([tempFilePath, wavFilePath, ...segments.map(s => s.path)])

    // Delete file from storage to save space
    await supabase.storage
      .from('audio-files')
      .remove([fileName])

    return res.status(200).json({
      status: 'completed',
      transcription: fullTranscription,
      duration: totalDuration,
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

async function convertToWav(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `${uuidv4()}.wav`)
    
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath)
  })
}

async function splitAudio(inputPath, outputDir) {
  const maxDuration = 25 * 60 // 25 minutes in seconds
  
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      const duration = metadata.format.duration
      
      if (duration <= maxDuration) {
        resolve([{ path: inputPath, duration }])
        return
      }

      const segments = []
      const numSegments = Math.ceil(duration / maxDuration)

      let completed = 0
      
      for (let i = 0; i < numSegments; i++) {
        const startTime = i * maxDuration
        const segmentPath = path.join(outputDir, `${uuidv4()}_segment_${i}.wav`)
        
        ffmpeg(inputPath)
          .seekInput(startTime)
          .duration(maxDuration)
          .on('end', () => {
            segments.push({ 
              path: segmentPath, 
              duration: Math.min(maxDuration, duration - startTime) 
            })
            completed++
            
            if (completed === numSegments) {
              resolve(segments)
            }
          })
          .on('error', reject)
          .save(segmentPath)
      }
    })
  })
}

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