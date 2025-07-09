// Vercel API Route for renaming transcription record
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { recordId } = req.query
  const { name } = req.body

  console.log('📝 Rename request for record:', recordId, 'new name:', name)

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' })
  }

  try {
    // Update the record with new name
    const { data, error } = await supabase
      .from('transcription_records')
      .update({ 
        original_filename: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()

    if (error) {
      console.error('❌ Database update error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Record not found' })
    }

    console.log('✅ Record renamed successfully')

    return res.status(200).json({
      message: 'Record renamed successfully',
      updated_record: data[0]
    })

  } catch (error) {
    console.error('❌ Rename operation error:', error)
    return res.status(500).json({ 
      error: 'Failed to rename record',
      details: error.message 
    })
  }
}