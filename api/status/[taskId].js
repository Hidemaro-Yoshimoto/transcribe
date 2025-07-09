// Vercel API Route for task status
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { taskId } = req.query
  console.log('📊 Status check for task:', taskId)

  try {
    // Get transcription record
    const { data: record, error: recordError } = await supabase
      .from('transcription_records')
      .select('*')
      .eq('id', taskId)
      .single()

    if (recordError || !record) {
      console.log('❌ Task not found:', taskId, recordError)
      return res.status(404).json({ error: 'Task not found' })
    }
    
    console.log('📝 Record found:', {
      id: record.id,
      status: record.status,
      filename: record.original_filename
    })

    // Get progress if processing
    let progress = 0
    let message = ''

    if (record.status === 'processing') {
      const { data: progressData } = await supabase
        .from('task_progress')
        .select('progress, message')
        .eq('task_id', taskId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (progressData) {
        progress = progressData.progress
        message = progressData.message
      }
    }

    // Determine response based on status
    let response = {
      task_id: taskId,
      status: record.status,
    }

    switch (record.status) {
      case 'pending':
        response.message = 'Task is waiting to be processed'
        break
        
      case 'processing':
        response.progress = progress
        response.message = message || 'Processing'
        break
        
      case 'completed':
        response.transcription = record.transcription_text
        response.duration = record.duration
        response.record_id = record.id
        response.message = 'Transcription completed successfully'
        break
        
      case 'failed':
        response.error = record.error_message
        response.message = 'Transcription failed'
        break
    }

    console.log('📤 Returning status:', response)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Status check error:', error)
    return res.status(500).json({ 
      error: 'Failed to check task status' 
    })
  }
}