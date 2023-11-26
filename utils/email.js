const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) CREATE A TRANSPORTER
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) DEFINE THE EMAIL OPTIONS
  const mailOptions = {
    from: 'Rahul J <rahul@rahul.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) ACTUALLY SEND THE MAIL
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
