/**
 * Transactional email — Nodemailer → Resend (Story 3.3, Decision 4).
 *
 * ENV-GATED (Rule 4, project-rules.md):
 *   - RESEND_API_KEY unset (default/CI/test) → no-op, returns 'skipped'. NO network.
 *   - RESEND_API_KEY set  → sends the owner notification via Resend SMTP.
 *     On a send error: logs id + mail_status ONLY (no PII), catches, returns 'failed'.
 *     NEVER throws — a mail failure must not lose the inquiry (Postgres is the record).
 *
 * NO PII in logs (architecture §Observability, NFR-7):
 *   - Only non-PII fields are ever logged: inquiry id, mail_status.
 *   - Name, email, org, message, topic, attribution are NEVER logged.
 *
 * SPF/DKIM: DNS for the sending domain is the launch prerequisite carried from
 * Story 1.10 — see docs/launch-checklist.md.  Code runs in 'skipped' mode until
 * RESEND_API_KEY + DNS are set on the VM (AC5).
 */
import nodemailer from 'nodemailer';

import { env } from '../env.js';

export type MailStatus = 'sent' | 'failed' | 'skipped';

export interface SendOwnerNotificationOptions {
  /** The newly-persisted inquiry id — logged (non-PII) for traceability. */
  inquiryId: string;
  /** Submitter's name — used in the email body (never logged). */
  submitterName: string;
  /** Submitter's email — reply-to address (never logged). */
  submitterEmail: string;
  /** Optional org name — used in email body only (never logged). */
  submitterOrg?: string;
  /** Inquiry message — used in email body only (never logged). */
  message: string;
  /** Talk topic / interest — used in email body only (never logged). */
  topic?: string;
  /** How the submitter heard about Josh — used in email body only (never logged). */
  attribution: string;
}

/**
 * Send an owner notification email for a new speaking inquiry.
 *
 * Returns:
 *   'skipped' — RESEND_API_KEY not set; no network call made.
 *   'sent'    — email delivered successfully.
 *   'failed'  — send error (caught); inquiry row should record mail_status='failed'.
 */
export async function sendOwnerNotification(
  opts: SendOwnerNotificationOptions,
): Promise<MailStatus> {
  // ENV-GATE: if RESEND_API_KEY is unset, skip with no network (Rule 4).
  if (!env.RESEND_API_KEY) {
    // Log only non-PII: inquiry id + status.
    console.info(`[email] skipped: RESEND_API_KEY not set (id=${opts.inquiryId})`);
    return 'skipped';
  }

  try {
    // Resend SMTP transport (Nodemailer-compatible).
    // Docs: https://resend.com/docs/send-with-nodemailer
    const transport = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: env.RESEND_API_KEY,
      },
    });

    const orgLine = opts.submitterOrg ? `\nOrg: ${opts.submitterOrg}` : '';
    const topicLine = opts.topic ? `\nTopic: ${opts.topic}` : '';

    await transport.sendMail({
      from: env.MAIL_FROM,
      to: env.MAIL_TO,
      replyTo: opts.submitterEmail,
      subject: `New speaking inquiry from ${opts.submitterName}`,
      text: [
        `New speaking inquiry received.`,
        ``,
        `From: ${opts.submitterName}${orgLine}`,
        `Email: ${opts.submitterEmail}`,
        `Attribution: ${opts.attribution}${topicLine}`,
        ``,
        `Message:`,
        opts.message,
        ``,
        `---`,
        `Inquiry ID: ${opts.inquiryId}`,
        `Reply directly to this email to respond to the submitter.`,
      ].join('\n'),
    });

    // Log only non-PII: id + status (no name/email/message).
    console.info(`[email] sent (id=${opts.inquiryId})`);
    return 'sent';
  } catch (err) {
    // Catch, log (non-PII), return 'failed' — NEVER throw.
    // The route handler records mail_status='failed' and still returns success.
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error(`[email] failed (id=${opts.inquiryId}): ${errMessage}`);
    return 'failed';
  }
}
