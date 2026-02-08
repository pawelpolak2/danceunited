import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || '"Dance United" <noreply@danceunited.pl>'

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (process.env.MOCK_EMAIL === 'true') {
    return { messageId: 'mock-id' }
  }

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP credentials missing. Email skipped:', { to, subject })
    return null
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    })
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    return null
  }
}

export function sendWelcomeEmail(to: string, userName: string) {
  const subject = 'Welcome to Dance United!'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #d97706;">Welcome, ${userName}!</h1>
      <p>Thank you for joining <strong>Dance United</strong>. We are thrilled to have you on board.</p>
      <p>You can now:</p>
      <ul>
        <li>Browse our schedule</li>
        <li>Sign up for classes</li>
        <li>Track your progress</li>
      </ul>
      <p>See you on the dance floor!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">Dance United Team</p>
    </div>
  `
  return sendEmail({ to, subject, html })
}

export function sendClassCancellationEmail(to: string, userName: string, className: string, date: string) {
  const subject = `Class Cancelled: ${className}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #ef4444;">Class Cancelled</h1>
      <p>Hi ${userName},</p>
      <p>We regret to inform you that the following class has been cancelled:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 0; font-weight: bold;">${className}</p>
        <p style="margin: 5px 0 0 0; color: #555;">${date}</p>
      </div>
      <p>Any credits used for this reservation have been returned to your package.</p>
      <p>We apologize for the inconvenience.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">Dance United Team</p>
    </div>
  `
  return sendEmail({ to, subject, html })
}

export function sendClassUpdateEmail(
  to: string,
  userName: string,
  className: string,
  _oldDate: string,
  newDate: string,
  changes: string
) {
  const subject = `Class Update: ${className}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #d97706;">Class Update</h1>
      <p>Hi ${userName},</p>
      <p>There have been changes to your upcoming class:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 0; font-weight: bold;">${className}</p>
        <p style="margin: 5px 0 0 0; color: #555;"><strong>New Time:</strong> ${newDate}</p>
        ${changes ? `<p style="margin: 5px 0 0 0; color: #d97706; font-size: 0.9em;">(${changes})</p>` : ''}
      </div>
      <p>Your reservation remains active. If you can no longer attend, please cancel via your dashboard.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">Dance United Team</p>
    </div>
  `
  return sendEmail({ to, subject, html })
}
