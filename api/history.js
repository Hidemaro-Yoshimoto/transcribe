// Vercel API Route for transcription history
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { limit = 100 } = req.query

  try {
    const { data: records, error } = await supabase
      .from('transcription_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      throw error
    }

    const formattedRecords = records.map(record => ({
      id: record.id,
      original_filename: record.original_filename,
      transcription_text: record.transcription_text || '',
      created_at: record.created_at,
      completed_at: record.completed_at,
      status: record.status,
      duration: record.duration,
      file_size: record.file_size,
    }))

    return res.status(200).json(formattedRecords)

  } catch (error) {
    console.error('History fetch error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch history' 
    })
  }
}