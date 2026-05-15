const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const templates = {
  'visitor-registered': (data) => ({
    subject: `New Visitor: ${data.visitor.firstName} ${data.visitor.lastName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1a2a4a">New Visitor Registered 👤</h2>
        <p>Hello ${data.host.name},</p>
        <p><strong>${data.visitor.firstName} ${data.visitor.lastName}</strong> from <em>${data.visitor.company || 'N/A'}</em> has been registered for a visit.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#5a6a88;font-size:13px">Purpose</td><td style="padding:8px;font-size:13px">${data.visitor.purpose}</td></tr>
          <tr style="background:#f0f4f8"><td style="padding:8px;color:#5a6a88;font-size:13px">Visit Date</td><td style="padding:8px;font-size:13px">${new Date(data.visitor.visitDate).toLocaleDateString()}</td></tr>
        </table>
        <p style="color:#5a6a88;font-size:12px">Please log in to VisiPass to approve or reject this visit.</p>
      </div>
    `,
  }),

  'visit-approved': (data) => ({
    subject: 'Your visit has been approved — VisiPass',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1a2a4a">Visit Approved ✅</h2>
        <p>Hi ${data.visitor.firstName},</p>
        <p>Your visit to <strong>${data.visitor.department}</strong> has been approved. Your pass will be ready at the reception.</p>
        <p style="color:#5a6a88;font-size:12px">Powered by VisiPass</p>
      </div>
    `,
  }),

  'pass-issued': (data) => ({
    subject: `Your Visitor Pass — ${data.pass.passId}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1a2a4a">Your Pass is Ready 🎫</h2>
        <p>Hi ${data.visitor.firstName},</p>
        <p>Your visitor pass has been issued. Please show this at the reception.</p>
        <div style="background:#1a2a4a;color:#fff;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
          <div style="font-size:22px;font-weight:bold">${data.pass.passId}</div>
          <div style="font-size:12px;color:#8bbcff;margin-top:4px">Valid: ${new Date(data.pass.validFrom).toLocaleString()} → ${new Date(data.pass.validUntil).toLocaleString()}</div>
        </div>
        <p style="color:#5a6a88;font-size:12px">Please bring a valid ID. This pass must be worn visibly at all times.</p>
      </div>
    `,
  }),

  'appointment-invite': (data) => ({
    subject: `You're invited — ${data.appointment.purpose}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1a2a4a">Meeting Invitation 📅</h2>
        <p>Hi ${data.visitorName},</p>
        <p>You have been invited by <strong>${data.hostName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#5a6a88;font-size:13px">Date & Time</td><td style="padding:8px;font-size:13px">${new Date(data.appointment.scheduledAt).toLocaleString()}</td></tr>
          <tr style="background:#f0f4f8"><td style="padding:8px;color:#5a6a88;font-size:13px">Room</td><td style="padding:8px;font-size:13px">${data.appointment.meetingRoom || 'TBD'}</td></tr>
          <tr><td style="padding:8px;color:#5a6a88;font-size:13px">Purpose</td><td style="padding:8px;font-size:13px">${data.appointment.purpose}</td></tr>
        </table>
        <a href="${process.env.CLIENT_URL}/pre-register/${data.appointment.preRegistrationToken}" style="display:inline-block;background:#4f8ef7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Pre-Register Now</a>
        <p style="color:#5a6a88;font-size:12px;margin-top:16px">Powered by VisiPass</p>
      </div>
    `,
  }),
};

/**
 * Send an email using a template or raw HTML
 */
exports.sendEmail = async ({ to, subject, template, data, html }) => {
  let mailContent = { subject, html };

  if (template && templates[template]) {
    const t = templates[template](data || {});
    mailContent.subject = t.subject;
    mailContent.html = t.html;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'VisiPass <noreply@visipass.com>',
    to,
    subject: mailContent.subject,
    html: mailContent.html,
  });
};
