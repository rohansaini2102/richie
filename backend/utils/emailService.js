const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Create email transporter configuration
const createEmailTransporter = () => {
  const config = {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  logger.info('Creating email transporter with configuration:', {
    service: config.service,
    user: config.auth.user ? 'configured' : 'missing',
    pass: config.auth.pass ? 'configured' : 'missing'
  });

  return nodemailer.createTransport(config);
};

// Send email with error handling and logging
const sendEmail = async (transporter, mailOptions) => {
  try {
    logger.info('Attempting to send email:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text
    });

    const result = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully:', {
      messageId: result.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    return {
      success: true,
      messageId: result.messageId,
      result
    };
  } catch (error) {
    logger.error('Failed to send email:', {
      error: error.message,
      to: mailOptions.to,
      subject: mailOptions.subject,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message
    };
  }
};

// Verify email transporter configuration
const verifyEmailTransporter = async (transporter) => {
  try {
    logger.info('Verifying email transporter...');
    await transporter.verify();
    logger.info('Email transporter verified successfully');
    return true;
  } catch (error) {
    logger.error('Email transporter verification failed:', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

module.exports = {
  createEmailTransporter,
  sendEmail,
  verifyEmailTransporter
};