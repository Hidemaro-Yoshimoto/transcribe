// Test endpoint to check Vercel limits
export default async function handler(req, res) {
  console.log('🔍 Test upload endpoint called')
  console.log('📊 Request method:', req.method)
  console.log('📊 Request headers:', {
    'content-length': req.headers['content-length'],
    'content-type': req.headers['content-type'],
    'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'],
    'x-vercel-id': req.headers['x-vercel-id']
  })
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // Get raw body size
    const contentLength = req.headers['content-length']
    console.log('📏 Content-Length:', contentLength)
    
    if (contentLength) {
      const sizeInMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2)
      console.log('📏 Request size:', sizeInMB, 'MB')
      
      // Check if request size exceeds Vercel limits
      if (parseInt(contentLength) > 100 * 1024 * 1024) { // 100MB Pro limit
        return res.status(413).json({
          error: 'Request size exceeds Vercel Pro limit (100MB)',
          received_size: contentLength,
          size_mb: sizeInMB,
          vercel_limit: '100MB'
        })
      }
    }
    
    return res.status(200).json({
      message: 'Test endpoint working',
      content_length: contentLength,
      size_mb: contentLength ? (parseInt(contentLength) / (1024 * 1024)).toFixed(2) : 'unknown',
      vercel_info: {
        deployment_url: req.headers['x-vercel-deployment-url'],
        vercel_id: req.headers['x-vercel-id']
      }
    })
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return res.status(500).json({
      error: error.message,
      code: error.code
    })
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: '100mb'
  },
  maxDuration: 30
}