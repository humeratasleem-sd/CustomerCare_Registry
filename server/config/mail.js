const nodemailer = require('nodemailer');

const createMailTransporter = () => {
  // If email config is missing, return a dummy mailer that logs to the console
  if (
    !process.env.EMAIL_USER || 
    process.env.EMAIL_USER === 'your_email@gmail.com' ||
    !process.env.EMAIL_PASS
  ) {
    console.log('WARNING: Mail transporter not configured. Emails will be logged to the console.');
    return {
      sendMail: async (options) => {
        console.log('---------------- Email Simulator ----------------');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body:\n${options.text || options.html}`);
        console.log('--------------------------------------------------');
        return { messageId: 'simulated-id' };
      }
    };
  }

  // Create real transporter
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const transporter = createMailTransporter();

/**
 * Send an email
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} html HTML body content
 * @param {string} text Text fallback body content
 */
const sendEmail = async ({ to, subject, html, text = '' }) => {
  try {
    const from = process.env.EMAIL_USER || 'system@customercare.com';
    const info = await transporter.sendMail({
      from: `"Customer Care Registry" <${from}>`,
      to,
      subject,
      html,
      text
    });
    return info;
  } catch (error) {
    console.error(`Email send error: ${error.message}`);
    return null;
  }
};

module.exports = {
  sendEmail
};
