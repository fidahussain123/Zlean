import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const APP_URL = process.env.APP_URL || 'http://localhost:8082';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@zlean.app';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface SendInviteEmailParams {
  to: string;
  token: string;
  inviterName: string;
}

export async function sendInviteEmail({ to, token, inviterName }: SendInviteEmailParams): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('[Email] SENDGRID_API_KEY not set, skipping email send');
    console.log(`[Email] Would send invite to ${to} with link: ${APP_URL}/(auth)/invite/${token}`);
    return true;
  }

  const inviteUrl = `${APP_URL}/(auth)/invite/${token}`;

  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'You\'re invited to join zLean as a Shop Owner',
    text: `
Hi there,

${inviterName} has invited you to join zLean as a shop owner.

Click the link below to set up your account and onboard your car wash shop:

${inviteUrl}

This invitation expires in 48 hours.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The zLean Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F6F8FC; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 24px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1A1A1A; font-size: 24px; font-weight: 700; margin: 0;">Welcome to zLean</h1>
    </div>
    
    <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      Hi there,
    </p>
    
    <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      <strong>${inviterName}</strong> has invited you to join zLean as a shop owner.
    </p>
    
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">
      Click the button below to set up your account and onboard your car wash shop.
    </p>
    
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${inviteUrl}" style="display: inline-block; background-color: #E4FF50; color: #1A1A1A; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px;">
        Set Up My Shop
      </a>
    </div>
    
    <p style="color: #999; font-size: 13px; line-height: 1.5; margin: 0 0 8px; text-align: center;">
      This invitation expires in 48 hours.
    </p>
    
    <p style="color: #999; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Invite sent to ${to}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send invite:', error);
    return false;
  }
}
