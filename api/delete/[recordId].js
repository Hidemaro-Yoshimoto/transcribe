// Vercel API Route for deleting transcription record
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { recordId } = req.query
  console.log('🗑️ Delete request for record:', recordId)

  try {
    // First, get the record to check if it exists and get filename
    const { data: record, error: fetchError } = await supabase
      .from('transcription_records')
      .select('*')
      .eq('id', recordId)
      .single()

    if (fetchError || !record) {
      console.log('❌ Record not found:', recordId)
      return res.status(404).json({ error: 'Record not found' })
    }

    console.log('📝 Found record to delete:', record.original_filename)

    // Delete from task_progress table (cascading should handle this, but let's be explicit)
    const { error: progressError } = await supabase
      .from('task_progress')
      .delete()
      .eq('task_id', recordId)

    if (progressError) {
      console.error('⚠️ Progress deletion error (non-critical):', progressError)
    } else {
      console.log('✅ Progress data deleted')
    }

    // Delete the transcription record
    const { error: deleteError } = await supabase
      .from('transcription_records')
      .delete()
      .eq('id', recordId)

    if (deleteError) {
      console.error('❌ Database deletion error:', deleteError)
      throw deleteError
    }

    console.log('✅ Record deleted from database')

    // Try to delete file from storage if it still exists
    // (Files are usually deleted after transcription, but just in case)
    if (record.filename) {
      const { error: storageError } = await supabase.storage
        .from('audio-files')
        .remove([record.filename])

      if (storageError) {
        console.log('⚠️ Storage deletion error (non-critical):', storageError)
      } else {
        console.log('✅ File deleted from storage')
      }
    }

    return res.status(200).json({
      message: 'Record deleted successfully',
      deleted_record: {
        id: record.id,
        filename: record.original_filename
      }
    })

  } catch (error) {
    console.error('❌ Delete operation error:', error)
    return res.status(500).json({ 
      error: 'Failed to delete record',
      details: error.message 
    })
  }
}