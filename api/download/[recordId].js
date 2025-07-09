// Vercel API Route for downloading transcription
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { recordId } = req.query

  try {
    // Get transcription record
    const { data: record, error } = await supabase
      .from('transcription_records')
      .select('*')
      .eq('id', recordId)
      .single()

    if (error || !record) {
      return res.status(404).json({ error: 'Record not found' })
    }

    if (record.status !== 'completed') {
      return res.status(400).json({ error: 'Transcription not completed' })
    }

    // Generate filename
    const originalName = record.original_filename.replace(/\.[^/.]+$/, '')
    const filename = `${originalName}_transcription.txt`

    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    return res.status(200).send(record.transcription_text)

  } catch (error) {
    console.error('Download error:', error)
    return res.status(500).json({ 
      error: 'Download failed' 
    })
  }
}