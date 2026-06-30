/**
 * Sends a Space invitation email via the Resend API.
 *
 * Configuration-required fallback: when RESEND_API_KEY is not set, this returns
 * { sent: false } without throwing so the caller can surface a copy-link flow
 * instead. Server-only (no "use client").
 */
export async function sendSpaceInvite(args: {
  to: string;
  inviteUrl: string;
  spaceName: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false };
  }

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">Vous êtes invité à rejoindre ${args.spaceName}</h1>
      <p style="font-size: 14px; color: #555; line-height: 1.5;">
        Vous avez été invité à collaborer dans l'espace <strong>${args.spaceName}</strong> sur DPM Elevate.
      </p>
      <p style="margin: 24px 0;">
        <a href="${args.inviteUrl}" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-size: 14px; font-weight: 500;">
          Accepter l'invitation
        </a>
      </p>
      <p style="font-size: 12px; color: #888; line-height: 1.5;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
        <a href="${args.inviteUrl}" style="color: #4f46e5;">${args.inviteUrl}</a>
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "noreply@dpm.app",
        to: [args.to],
        subject: `You're invited to ${args.spaceName} on DPM Elevate`,
        html,
      }),
    });
    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
}
