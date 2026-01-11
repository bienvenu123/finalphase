const nodemailer = require('nodemailer');



// Validate email configuration

const validateEmailConfig = () => {

  const errors = [];

  

  if (!process.env.EMAIL_USER) {

    errors.push('EMAIL_USER is not set in .env file');

  }

  

  if (!process.env.EMAIL_PASSWORD) {

    errors.push('EMAIL_PASSWORD is not set in .env file');

  }

  

  if (errors.length > 0) {

    console.error('❌ Email Configuration Errors:');

    errors.forEach(error => console.error(`   - ${error}`));

    console.error('\n📝 Please add these to your .env file:');

    console.error('   EMAIL_USER=your-email@gmail.com');

    console.error('   EMAIL_PASSWORD=your-app-password');

    console.error('\n💡 For Gmail, you need to use an App Password, not your regular password.');

    console.error('   Learn more: https://support.google.com/accounts/answer/185833\n');

    return false;

  }

  

  return true;

};



// Create transporter (configure with your email service)

// Only create transporter if required environment variables are present

let transporter = null;



const createTransporter = () => {

  if (transporter) {

    return transporter; // Return existing transporter if already created

  }



  // Check if we should reject unauthorized certificates

  // Default: false in development (allows self-signed certs), true in production (secure)

  // Can be overridden with EMAIL_REJECT_UNAUTHORIZED env variable

  let rejectUnauthorized = true; // Default to secure

  if (process.env.NODE_ENV !== 'production') {

    rejectUnauthorized = false; // Allow self-signed certs in development

  }

  if (process.env.EMAIL_REJECT_UNAUTHORIZED === 'false') {

    rejectUnauthorized = false; // Explicitly allow if set

  }

  if (process.env.EMAIL_REJECT_UNAUTHORIZED === 'true') {

    rejectUnauthorized = true; // Explicitly reject if set

  }



  if (process.env.SMTP_HOST) {

    // Option 2: SMTP (for production)

    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;

    const smtpPass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;

    

    if (!smtpUser || !smtpPass) {

      return null;

    }

    

    transporter = nodemailer.createTransport({

      host: process.env.SMTP_HOST,

      port: parseInt(process.env.SMTP_PORT) || 587,

      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports

      auth: {

        user: smtpUser,

        pass: smtpPass

      },

      tls: {

        rejectUnauthorized: rejectUnauthorized

      }

    });

  } else {

    // Option 1: Gmail (for testing)

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {

      return null;

    }

    

    // Clean password - remove spaces (Gmail app passwords don't have spaces)

    const cleanPassword = process.env.EMAIL_PASSWORD.replace(/\s+/g, '');

    

    transporter = nodemailer.createTransport({

      service: 'gmail',

      auth: {

        user: process.env.EMAIL_USER,

        pass: cleanPassword

      },

      tls: {

        rejectUnauthorized: rejectUnauthorized

      }

    });

  }

  

  return transporter;

};



/**

 * Send schedule change notification email

 * @param {Object} emailData - Email data object

 */

exports.sendScheduleChangeEmail = async (emailData) => {

  try {

    // Validate email configuration first

    if (!validateEmailConfig()) {

      throw new Error('Email configuration is missing. Please check your .env file.');

    }



    // Ensure transporter is created

    const emailTransporter = createTransporter();

    if (!emailTransporter) {

      throw new Error('Email transporter could not be created. Please check your .env file.');

    }



    // Validate required email data

    const {

      to,

      subject,

      patientName,

      doctorName,

      oldSchedule,

      newSchedule

    } = emailData;



    if (!to) {

      throw new Error('Recipient email address (to) is required');

    }



    if (!patientName) {

      throw new Error('Patient name is required');

    }



    if (!oldSchedule || !newSchedule) {

      throw new Error('Both old and new schedule information are required');

    }



  // HTML email template

  const htmlContent = `

    <!DOCTYPE html>

    <html>

    <head>

      <style>

        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }

        .container { max-width: 600px; margin: 0 auto; padding: 20px; }

        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }

        .content { background-color: #f9f9f9; padding: 20px; }

        .schedule-box { background-color: white; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }

        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }

        .btn { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }

      </style>

    </head>

    <body>

      <div class="container">

        <div class="header">

          <h2>🏥 Hospital Management System</h2>

        </div>

        <div class="content">

          <h3>Appointment Schedule Change Notification</h3>

          <p>Dear ${patientName},</p>

          <p>We are writing to inform you that your appointment with <strong>${doctorName}</strong> has been rescheduled.</p>

          

          <h4>Previous Schedule:</h4>

          <div class="schedule-box">

            <p><strong>Day:</strong> ${oldSchedule.day}</p>

            <p><strong>Date:</strong> ${oldSchedule.date}</p>

            <p><strong>Time:</strong> ${oldSchedule.time}</p>

          </div>

          

          <h4>New Schedule:</h4>

          <div class="schedule-box">

            <p><strong>Day:</strong> ${newSchedule.day}</p>

            <p><strong>Date:</strong> ${newSchedule.date}</p>

            <p><strong>Time:</strong> ${newSchedule.time}</p>

          </div>

          

          <p>Please note the new date and time. If you need to reschedule or have any questions, please contact us.</p>

          <p>We apologize for any inconvenience caused.</p>

          <p>Thank you for your understanding.</p>

        </div>

        <div class="footer">

          <p>Best regards,<br>Hospital Management Team</p>

          <p>This is an automated message. Please do not reply to this email.</p>

        </div>

      </div>

    </body>

    </html>

  `;



  // Plain text version

  const textContent = `

    Appointment Schedule Change Notification

    

    Dear ${patientName},

    

    We are writing to inform you that your appointment with ${doctorName} has been rescheduled.

    

    Previous Schedule:

    - Day: ${oldSchedule.day}

    - Date: ${oldSchedule.date}

    - Time: ${oldSchedule.time}

    

    New Schedule:

    - Day: ${newSchedule.day}

    - Date: ${newSchedule.date}

    - Time: ${newSchedule.time}

    

    Please note the new date and time. If you need to reschedule or have any questions, please contact us.

    

    We apologize for any inconvenience caused.

    

    Best regards,

    Hospital Management Team

  `;



    // Mail options

    const mailOptions = {

      from: `"Hospital Management" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,

      to: to,

      subject: subject || 'Appointment Schedule Change Notification',

      text: textContent,

      html: htmlContent

    };



    // Send email

    console.log(`📧 Attempting to send email to: ${to}`);

    const info = await emailTransporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');

    console.log('   Message ID:', info.messageId);

    console.log('   Response:', info.response);

    return info;

  } catch (error) {

    console.error('❌ Error sending email:');

    console.error('   Error:', error.message);

    

    // Provide helpful error messages

    if (error.code === 'EAUTH') {

      console.error('\n💡 Authentication failed. Possible issues:');

      console.error('   - Wrong email or password in .env file');

      console.error('   - For Gmail: Make sure you\'re using an App Password, not your regular password');

      console.error('   - App passwords don\'t have spaces - remove any spaces from EMAIL_PASSWORD');

      console.error('   - Enable 2-Step Verification and generate App Password:');

      console.error('     https://myaccount.google.com/apppasswords\n');

    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {

      console.error('\n💡 Connection error. Possible issues:');

      console.error('   - Check your internet connection');

      console.error('   - Gmail might be blocking the connection');

      console.error('   - Try using SMTP configuration instead\n');

    } else if (error.code === 'EENVELOPE') {

      console.error('\n💡 Envelope error. Possible issues:');

      console.error('   - Invalid recipient email address');

      console.error('   - Check the "to" email address format\n');

    }

    

    // Re-throw error so caller can handle it

    throw error;

  }

};



/**

 * Verify email configuration

 */

exports.verifyEmailConfig = async () => {

  try {

    // First validate that config exists

    if (!validateEmailConfig()) {

      return false;

    }



    // Ensure transporter is created

    const emailTransporter = createTransporter();

    if (!emailTransporter) {

      console.error('❌ Email configuration verification failed:');

      console.error('   Error: Could not create email transporter');

      console.error('   Reason: Missing EMAIL_USER or EMAIL_PASSWORD in .env file');

      console.error('\n📝 Please add these to your .env file:');

      console.error('   EMAIL_USER=your-email@gmail.com');

      console.error('   EMAIL_PASSWORD=your-app-password');

      console.error('\n💡 For Gmail, you need to use an App Password, not your regular password.');

      console.error('   Learn more: https://support.google.com/accounts/answer/185833\n');

      return false;

    }



    console.log('🔍 Verifying email configuration...');

    await emailTransporter.verify();

    console.log('✅ Email server is ready to send messages');

    return true;

  } catch (error) {

    console.error('❌ Email configuration verification failed:');

    console.error('   Error:', error.message);

    

    if (error.code === 'EAUTH') {

      console.error('\n💡 Authentication failed. Possible issues:');

      console.error('   - Wrong email or password in .env file');

      console.error('   - For Gmail: Make sure you\'re using an App Password, not your regular password');

      console.error('   - App passwords don\'t have spaces - remove any spaces from EMAIL_PASSWORD');

      console.error('   - Enable 2-Step Verification and generate App Password:');

      console.error('     https://myaccount.google.com/apppasswords\n');

    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {

      console.error('\n💡 Connection error. Possible issues:');

      console.error('   - Check your internet connection');

      console.error('   - Gmail might be blocking the connection');

      console.error('   - Try using SMTP configuration instead\n');

    } else if (error.code === 'EENVELOPE') {

      console.error('\n💡 Envelope error. Possible issues:');

      console.error('   - Invalid email configuration');

      console.error('   - Check your EMAIL_USER format\n');

    } else if (error.message && error.message.includes('certificate')) {

      console.error('\n💡 Certificate error detected. This is usually a development environment issue.');

      console.error('   The code has been updated to handle this automatically.');

      console.error('   If you still see this error, try adding to your .env file:');

      console.error('   NODE_ENV=development');

      console.error('   Or set: EMAIL_REJECT_UNAUTHORIZED=false');

      console.error('\n   ⚠️  Note: Only disable certificate validation in development!');

      console.error('   In production, ensure proper SSL certificates are configured.\n');

    } else {

      console.error('\n💡 General error. Please check:');

      console.error('   - Your .env file has EMAIL_USER and EMAIL_PASSWORD set');

      console.error('   - For Gmail: Use App Password (16 characters, no spaces)');

      console.error('   - Generate App Password: https://myaccount.google.com/apppasswords\n');

    }

    

    return false;

  }

};

