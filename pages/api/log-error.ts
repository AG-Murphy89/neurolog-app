
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { error, stack, componentStack, timestamp } = req.body

    // Log error (in production, send to monitoring service)
    console.error('Client Error:', {
      error,
      stack,
      componentStack,
      timestamp,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    })

    // TODO: Send to monitoring service like Sentry
    // await Sentry.captureException(new Error(error), {
    //   extra: { stack, componentStack, timestamp }
    // })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Error logging failed:', err)
    return res.status(500).json({ error: 'Error logging failed' })
  }
}
