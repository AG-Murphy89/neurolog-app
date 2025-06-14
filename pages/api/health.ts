
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if we're in maintenance mode
    if (process.env.MAINTENANCE_MODE === 'true') {
      return res.status(503).json({
        status: 'maintenance',
        message: 'System is under maintenance'
      })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check database connection
    const { error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (error) {
      throw new Error('Database connection failed')
    }

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        api: 'operational'
      },
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
