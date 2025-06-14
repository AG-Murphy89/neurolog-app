
interface EmailData {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    // In production, integrate with Resend or similar service
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@neurolog.health',
          to,
          subject,
          html
        })
      })

      if (!response.ok) {
        throw new Error('Email service error')
      }

      return await response.json()
    } else {
      // Development mode - just log
      console.log('Email would be sent:', { to, subject, html })
      return { success: true, development: true }
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  try {
    await sendEmail({
      to: userEmail,
      subject: 'Welcome to NeuroLog',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #005EB8 0%, #003087 100%); color: white; padding: 32px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to NeuroLog</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #e1e5e9; border-radius: 0 0 8px 8px;">
            <h2 style="color: #003087; margin: 0 0 16px 0;">Hello ${userName},</h2>
            <p style="color: #333; line-height: 1.6; margin: 16px 0;">
              Thank you for joining NeuroLog, your secure and GDPR-compliant seizure tracking platform.
            </p>
            <p style="color: #333; line-height: 1.6; margin: 16px 0;">
              Your account is now active and ready to use. You can start tracking seizures, managing medications, and accessing your health data securely.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://neurolog.health/dashboard" style="background: #005EB8; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                Access Your Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin: 24px 0 0 0;">
              🔒 Your data is encrypted and stored securely in EU servers in compliance with GDPR regulations.
            </p>
          </div>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

export async function sendPasswordResetEmail(userEmail: string, resetLink: string) {
  try {
    await sendEmail({
      to: userEmail,
      subject: 'Reset Your NeuroLog Password',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #005EB8; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #e1e5e9;">
            <p style="color: #333; line-height: 1.6;">
              You requested a password reset for your NeuroLog account. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetLink}" style="background: #005EB8; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
          </div>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}
