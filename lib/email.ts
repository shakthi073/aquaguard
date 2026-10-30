import { Resend } from 'resend';
import type { Complaint, ComplaintStatus } from './types';
import { getStatusLabel } from './complaint-utils';
import { escapeHtml } from './aiVerify';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_xxxxxxxx') return null;
  return new Resend(apiKey);
}

function fromAddress() {
  return process.env.EMAIL_FROM || 'AquaGuard <onboarding@resend.dev>';
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function sendComplaintFiledEmail(complaint: Complaint) {
  const resend = getResend();
  if (!resend) {
    console.log(`
======================================================================
[EMAIL SIMULATION] (RESEND_API_KEY not configured or simulated)
From: ${fromAddress()}
To: ${complaint.reporter.email}
Subject: Complaint filed: ${complaint.id}
----------------------------------------------------------------------
Your complaint has been filed.
Hi ${complaint.reporter.name},
Thank you for reporting water body encroachment through AquaGuard.

Complaint ID: ${complaint.id}
Location: ${complaint.location.address}
AI verification: ${complaint.aiVerification.verified ? 'Verified' : 'Unverified'} (${complaint.aiVerification.confidence}% confidence)

Track your complaint: ${appUrl()}/status?id=${complaint.id}
======================================================================
    `);
    return;
  }

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: complaint.reporter.email,
      subject: `Complaint filed: ${complaint.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#050d1a;color:#e8f4fd;padding:32px;border-radius:12px;">
          <h2 style="color:#00b4d8;margin-top:0;">✅ Complaint Filed Successfully</h2>
          <p>Hi ${escapeHtml(complaint.reporter.name)},</p>
          <p>Thank you for reporting water body encroachment through AquaGuard.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">Complaint ID</td><td style="padding:8px;font-weight:bold;border-bottom:1px solid rgba(0,180,216,0.15);">${escapeHtml(complaint.id)}</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">Location</td><td style="padding:8px;border-bottom:1px solid rgba(0,180,216,0.15);">${escapeHtml(complaint.location.address)}</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;">AI Verification</td><td style="padding:8px;">${complaint.aiVerification.verified ? '<span style="color:#06d6a0;">✓ Verified</span>' : '<span style="color:#ffd166;">⚠ Unverified</span>'} (${complaint.aiVerification.confidence}% confidence)</td></tr>
          </table>
          <a href="${appUrl()}/status?id=${encodeURIComponent(complaint.id)}" style="display:inline-block;background:linear-gradient(135deg,#00b4d8,#0077b6);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Track Your Complaint →</a>
          <p style="color:#4a6480;font-size:12px;margin-top:24px;">This is an automated notification from AquaGuard. Please do not reply to this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[email sendComplaintFiledEmail error]:', error);
  }
}

export async function sendAuthorityNotification(
  complaint: Complaint,
  authorityEmail = process.env.AUTHORITY_EMAIL
) {
  const resend = getResend();
  if (!authorityEmail || !resend) {
    if (!authorityEmail) {
      console.warn('[email] AUTHORITY_EMAIL not set — skipping authority notification');
    } else {
      console.log(`
======================================================================
[EMAIL SIMULATION] (RESEND_API_KEY not configured or simulated)
From: ${fromAddress()}
To: ${authorityEmail}
Subject: [AquaGuard] New encroachment report ${complaint.id} — ${complaint.severity.toUpperCase()}
----------------------------------------------------------------------
New encroachment complaint:
ID: ${complaint.id}
Location: ${complaint.location.address} (${complaint.location.lat}, ${complaint.location.lng})
Type: ${complaint.encroachmentType.replace(/_/g, ' ')}
Severity: ${complaint.severity}
Description: ${complaint.description}
Reporter: ${complaint.reporter.name} (${complaint.reporter.email}${complaint.reporter.phone ? `, ${complaint.reporter.phone}` : ''})
AI: ${complaint.aiVerification.verified ? 'Verified' : 'Unverified'} — ${complaint.aiVerification.confidence}%

Manage via admin portal: ${appUrl()}/admin
======================================================================
      `);
    }
    return;
  }

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: authorityEmail,
      subject: `[AquaGuard] New encroachment report ${complaint.id} — ${complaint.severity.toUpperCase()}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#050d1a;color:#e8f4fd;padding:32px;border-radius:12px;">
          <h2 style="color:#ef233c;margin-top:0;">🚨 New Encroachment Report</h2>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">ID</td><td style="padding:8px;font-weight:bold;border-bottom:1px solid rgba(0,180,216,0.15);">${escapeHtml(complaint.id)}</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">Location</td><td style="padding:8px;border-bottom:1px solid rgba(0,180,216,0.15);">${escapeHtml(complaint.location.address)} (${complaint.location.lat}, ${complaint.location.lng})</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">Type</td><td style="padding:8px;border-bottom:1px solid rgba(0,180,216,0.15);">${escapeHtml(complaint.encroachmentType.replace(/_/g, ' '))}</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">Severity</td><td style="padding:8px;border-bottom:1px solid rgba(0,180,216,0.15);font-weight:bold;">${escapeHtml(complaint.severity.toUpperCase())}</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">Description</td><td style="padding:8px;border-bottom:1px solid rgba(0,180,216,0.15);">${escapeHtml(complaint.description)}</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;border-bottom:1px solid rgba(0,180,216,0.15);">Reporter</td><td style="padding:8px;border-bottom:1px solid rgba(0,180,216,0.15);">${escapeHtml(complaint.reporter.name)} (${escapeHtml(complaint.reporter.email)}${complaint.reporter.phone ? `, ${escapeHtml(complaint.reporter.phone)}` : ''})</td></tr>
            <tr><td style="padding:8px;color:#8ba8c4;">AI Status</td><td style="padding:8px;">${complaint.aiVerification.verified ? '<span style="color:#06d6a0;">✓ Verified</span>' : '<span style="color:#ffd166;">⚠ Unverified</span>'} — ${complaint.aiVerification.confidence}%</td></tr>
          </table>
          <a href="${appUrl()}/admin" style="display:inline-block;background:linear-gradient(135deg,#00b4d8,#0077b6);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">Open Admin Dashboard →</a>
        </div>
      `,
    });
  } catch (error) {
    console.error('[email sendAuthorityNotification error]:', error);
  }
}

export async function sendStatusUpdateEmail(
  complaint: Complaint,
  newStatus: ComplaintStatus,
  note: string
) {
  const resend = getResend();
  if (!resend) {
    console.log(`
======================================================================
[EMAIL SIMULATION] (RESEND_API_KEY not configured or simulated)
From: ${fromAddress()}
To: ${complaint.reporter.email}
Subject: Complaint ${complaint.id} — ${getStatusLabel(newStatus)}
----------------------------------------------------------------------
Complaint status updated.
Hi ${complaint.reporter.name},

Your complaint ${complaint.id} is now: ${getStatusLabel(newStatus)}
Status Update Note: "${note}"

View full timeline: ${appUrl()}/status?id=${complaint.id}
======================================================================
    `);
    return;
  }

  try {
    await resend.emails.send({
      from: fromAddress(),
      to: complaint.reporter.email,
      subject: `Complaint ${complaint.id} — ${getStatusLabel(newStatus)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#050d1a;color:#e8f4fd;padding:32px;border-radius:12px;">
          <h2 style="color:#00b4d8;margin-top:0;">📋 Complaint Status Updated</h2>
          <p>Hi ${escapeHtml(complaint.reporter.name)},</p>
          <p>Your complaint <strong>${escapeHtml(complaint.id)}</strong> has been updated:</p>
          <p style="font-size:18px;font-weight:bold;color:#06d6a0;">${escapeHtml(getStatusLabel(newStatus))}</p>
          <div style="background:rgba(0,180,216,0.08);border:1px solid rgba(0,180,216,0.2);padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#8ba8c4;">Authority Note:</p>
            <p style="margin:8px 0 0;">${escapeHtml(note)}</p>
          </div>
          <a href="${appUrl()}/status?id=${encodeURIComponent(complaint.id)}" style="display:inline-block;background:linear-gradient(135deg,#00b4d8,#0077b6);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">View Full Timeline →</a>
          <p style="color:#4a6480;font-size:12px;margin-top:24px;">This is an automated notification from AquaGuard. Please do not reply to this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[email sendStatusUpdateEmail error]:', error);
  }
}
