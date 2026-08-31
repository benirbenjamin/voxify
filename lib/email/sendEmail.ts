import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = new Resend(resendApiKey);

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailPayload) {
  try {
    const data = await resend.emails.send({
      from: 'Voxify Space <notifications@voxify.space>',
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send email via Resend:', error);
    return { success: false, error: error.message };
  }
}

export function buildChoirInvitationEmail(choirName: string, choirCode: string, joinLink: string) {
  return `
    <div style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; borderRadius: 16px;">
      <h2 style="color: #c084fc; margin-bottom: 8px;">Invitation to join ${choirName}</h2>
      <p style="color: #94a3b8; font-size: 14px;">You have been invited to join <strong>${choirName}</strong> on Voxify Space platform.</p>
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <span style="display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Choir Code</span>
        <span style="font-size: 28px; font-weight: 800; color: #c084fc; letter-spacing: 4px; font-family: monospace;">${choirCode}</span>
      </div>
      <a href="${joinLink}" style="display: inline-block; background-color: #9333ea; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 12px; font-size: 14px;">Join Choir Now</a>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">If you did not expect this invitation, you can ignore this email.</p>
    </div>
  `;
}
