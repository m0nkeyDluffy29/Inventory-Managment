const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── HTML email builder ────────────────────────────────────────────────────

function buildReorderHTML(items) {
  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#1a1a1a">${i.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;color:#555">${i.category || "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-family:monospace;color:#e53e3e;font-weight:700">${Number(i.current_stock).toFixed(2)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-family:monospace;color:#555">${Number(i.caution_level).toFixed(2)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;color:#555">${i.unit}</td>
    </tr>
  `,
    )
    .join("");

  const now = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,sans-serif">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#4f46e5;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px">⚠️ Weekly Reorder Alert</h1>
      <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px">${now}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        The following <strong>${items.length} item${items.length > 1 ? "s" : ""}</strong>
        are currently below their caution level and need reordering:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 14px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Item</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Category</th>
            <th style="padding:10px 14px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Current Stock</th>
            <th style="padding:10px 14px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Caution Level</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Unit</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="color:#6b7280;font-size:13px;margin:24px 0 0">
        Please place orders with your vendors as soon as possible to avoid stockouts.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        This is an automated alert from your Restaurant Inventory System.
        Log in to update caution levels or view real-time stock.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function buildReorderPlainText(items) {
  const lines = items
    .map(
      (i) =>
        `  • ${i.name} (${i.category || "Uncategorised"}): ${i.current_stock} ${i.unit} — caution level: ${i.caution_level} ${i.unit}`,
    )
    .join("\n");
  const now = new Date().toLocaleString("en-IN");
  return [
    `WEEKLY REORDER ALERT — ${now}`,
    ``,
    `The following ${items.length} item(s) are below their caution level:`,
    ``,
    lines,
    ``,
    `Please reorder as soon as possible.`,
    ``,
    `— Restaurant Inventory System`,
  ].join("\n");
}

// ── Exports ───────────────────────────────────────────────────────────────

/**
 * Send the weekly reorder alert email to the owner.
 * @param {Array} items  — InventoryItem rows with current_stock < caution_level
 */
async function sendReorderAlert(items) {
  if (!items.length) return { skipped: true, reason: "No low-stock items" };

  const info = await transporter.sendMail({
    from: `"Inventory System" <${process.env.SMTP_USER}>`,
    to: process.env.OWNER_ALERT_EMAIL,
    subject: `⚠️ Reorder Alert — ${items.length} item${items.length > 1 ? "s" : ""} need restocking`,
    text: buildReorderPlainText(items),
    html: buildReorderHTML(items),
  });

  return { messageId: info.messageId, accepted: info.accepted };
}

/**
 * Send a test email to verify SMTP config is working.
 */
async function sendTestEmail(toAddress) {
  const info = await transporter.sendMail({
    from: `"Inventory System" <${process.env.SMTP_USER}>`,
    to: toAddress || process.env.OWNER_ALERT_EMAIL,
    subject: "✅ Inventory System — Email Test",
    text: "This is a test email from your Restaurant Inventory System. SMTP is configured correctly.",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:32px auto;padding:32px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#4f46e5">✅ Email Test Successful</h2>
        <p style="color:#374151">Your SMTP configuration is working correctly.</p>
        <p style="color:#6b7280;font-size:13px">Sent from Restaurant Inventory System — ${new Date().toLocaleString()}</p>
      </div>
    `,
  });

  return { messageId: info.messageId, accepted: info.accepted };
}

module.exports = { sendReorderAlert, sendTestEmail };
