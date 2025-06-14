
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (process.env.ENABLE_ANALYTICS !== 'true') {
    return res.status(200).json({ success: true, disabled: true })
  }

  try {
    const { event, url, action, metadata, timestamp } = req.body

    // Log analytics event (no personal data)
    const analyticsData = {
      event,
      url: url ? new URL(url).pathname : undefined, // Remove query params and domain
      action,
      metadata,
      timestamp,
      userAgent: req.headers['user-agent']?.substring(0, 100), // Truncate user agent
      // No IP tracking for privacy
    }

    console.log('Analytics:', analyticsData)

    // TODO: Send to privacy-compliant analytics service
    // await sendToAnalyticsService(analyticsData)

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return res.status(500).json({ error: 'Analytics logging failed' })
  }
}
