const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendReorderAlert(items) {
  if (!items.length) return;
  const rows = items.map(i => `  • ${i.name}: ${i.current_stock} ${i.unit} (caution: ${i.caution_level})`).join('\n');
  await transporter.sendMail({
    from: `"Inventory System" <${process.env.SMTP_USER}>`,
    to: process.env.OWNER_ALERT_EMAIL,
    subject: '⚠️ Weekly Reorder Alert — Low Stock Items',
    text: `The following items are below their caution level:\n\n${rows}\n\nPlease reorder soon.`,
  });
}

module.exports = { sendReorderAlert };