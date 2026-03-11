const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendMail = ({ to, subject, html }) =>
  getTransporter().sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Tovo'}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

module.exports = { sendMail };
