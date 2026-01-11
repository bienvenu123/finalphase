# Backend Email Service Setup Guide

## 📍 File Location

This `emailService.js` file should be placed in your **backend project** (separate from this frontend React app).

### Recommended Backend Structure:

```
your-backend-project/
├── server.js
├── package.json
├── .env
├── routes/
│   └── ...
├── controllers/
│   └── ...
├── services/
│   └── emailService.js    ← Place the emailService.js here
└── models/
    └── ...
```

## 📦 Installation

In your backend project, install nodemailer:

```bash
npm install nodemailer
```

## ⚙️ Environment Variables

Add these to your backend `.env` file:

### Option 1: Gmail (for testing/development)

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-16-chars
EMAIL_FROM=your-email@gmail.com
NODE_ENV=development
```

### Option 2: SMTP (for production)

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
EMAIL_FROM=your-email@domain.com
NODE_ENV=production
```

## 🔐 Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Add it to your `.env` file as `EMAIL_PASSWORD`

## 📝 Usage Example

### In your backend controller (e.g., `appointmentController.js`):

```javascript
const { sendScheduleChangeEmail, verifyEmailConfig } = require('../services/emailService');

// Verify email config on server startup
verifyEmailConfig();

// Send email when schedule changes
const sendEmail = async (patientEmail, patientName, doctorName, oldSchedule, newSchedule) => {
  try {
    await sendScheduleChangeEmail({
      to: patientEmail,
      subject: 'Appointment Schedule Change Notification',
      patientName: patientName,
      doctorName: doctorName,
      oldSchedule: {
        day: 'Monday',
        date: '2024-01-15',
        time: '10:00 AM'
      },
      newSchedule: {
        day: 'Tuesday',
        date: '2024-01-16',
        time: '2:00 PM'
      }
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
};
```

## 🔍 Testing Email Configuration

Add this to your backend `server.js`:

```javascript
const { verifyEmailConfig } = require('./services/emailService');

// On server startup
verifyEmailConfig()
  .then(isValid => {
    if (isValid) {
      console.log('✅ Email service is configured correctly');
    } else {
      console.log('⚠️  Email service is not configured - emails will not be sent');
    }
  })
  .catch(err => {
    console.error('❌ Email service verification failed:', err);
  });
```

## 🚨 Common Issues

### Issue: "EAUTH" Authentication Error
- **Solution**: Use Gmail App Password, not your regular password
- Remove any spaces from the app password
- Ensure 2-Step Verification is enabled

### Issue: "ECONNECTION" Error
- **Solution**: Check internet connection
- Gmail might be blocking - try SMTP instead
- Check firewall settings

### Issue: Certificate Errors (Development)
- **Solution**: Set `NODE_ENV=development` in `.env`
- Or set `EMAIL_REJECT_UNAUTHORIZED=false` (development only!)

## 📧 Email Template Customization

The email template is HTML-based and can be customized in the `sendScheduleChangeEmail` function. Modify the `htmlContent` variable to match your hospital's branding.

## 🔗 Integration Points

This email service can be integrated with:

1. **Appointment Changes** - When doctor schedules are updated
2. **Appointment Rescheduling** - When appointments are moved
3. **Appointment Confirmations** - When new appointments are created
4. **Reminders** - Before appointments (requires scheduling/cron job)

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SMTP Configuration Guide](https://nodemailer.com/smtp/)

