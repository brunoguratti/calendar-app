import nodemailer from 'nodemailer';
import type { Appointment, Service, User } from '@prisma/client';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

interface AppointmentEmailData {
  appointment: Appointment & {
    service: Service;
    user: Pick<User, 'name' | 'businessName' | 'email'>;
  };
}

/**
 * Send appointment confirmation email to customer
 */
export const sendAppointmentConfirmationEmail = async (
  data: AppointmentEmailData
): Promise<void> => {
  const { appointment } = data;
  const { service, user } = appointment;

  const appointmentDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #00297f 0%, #0058ab 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        .appointment-details {
          background: #f9fafb;
          border-left: 4px solid #0058ab;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .detail-row {
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #00297f;
        }
        .detail-value {
          color: #4b5563;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          background: #fbbf24;
          color: #78350f;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          color: #6b7280;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #00297f 0%, #0058ab 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .note {
          background: #dfcbb2;
          border-left: 4px solid #693e2d;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          color: #693e2d;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 Appointment Request Received</h1>
      </div>

      <div class="content">
        <h2>Hello ${appointment.customerName}!</h2>
        <p>Thank you for your appointment request with <strong>${user.businessName}</strong>.</p>

        <p>Your appointment is currently <span class="status-badge">Pending Approval</span></p>

        <div class="appointment-details">
          <h3 style="margin-top: 0; color: #00297f;">Appointment Details</h3>

          <div class="detail-row">
            <span class="detail-label">📋 Service:</span>
            <span class="detail-value">${service.name}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📅 Date:</span>
            <span class="detail-value">${appointmentDate}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">🕐 Time:</span>
            <span class="detail-value">${appointment.time}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">⏱️ Duration:</span>
            <span class="detail-value">${service.durationMinutes} minutes</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">💰 Price:</span>
            <span class="detail-value">$${service.price.toFixed(2)}</span>
          </div>
        </div>

        <div class="note">
          <strong>📧 What's Next?</strong><br>
          You will receive another email once ${user.name} confirms your appointment. Please check your email regularly for updates.
        </div>

        <p style="margin-top: 30px;">
          <strong>Professional Contact:</strong><br>
          ${user.name}<br>
          ${user.businessName}<br>
          ${user.email}
        </p>
      </div>

      <div class="footer">
        <p>This email was sent by EasySchedule on behalf of ${user.businessName}</p>
        <p style="font-size: 12px; color: #9ca3af;">
          If you did not request this appointment, please contact the business directly.
        </p>
      </div>
    </body>
    </html>
  `;

  const emailText = `
Appointment Request Received

Hello ${appointment.customerName},

Thank you for your appointment request with ${user.businessName}.

Your appointment is currently PENDING APPROVAL.

APPOINTMENT DETAILS:
Service: ${service.name}
Date: ${appointmentDate}
Time: ${appointment.time}
Duration: ${service.durationMinutes} minutes
Price: $${service.price.toFixed(2)}

WHAT'S NEXT:
You will receive another email once ${user.name} confirms your appointment.

Professional Contact:
${user.name}
${user.businessName}
${user.email}

---
This email was sent by EasySchedule on behalf of ${user.businessName}.
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: appointment.customerEmail,
      subject: `Appointment Request - ${user.businessName}`,
      text: emailText,
      html: emailHtml,
    });

    console.log(`✅ Appointment confirmation email sent to ${appointment.customerEmail}`);
  } catch (error) {
    console.error('❌ Error sending appointment confirmation email:', error);
    throw error;
  }
};

/**
 * Send appointment notification email to professional
 */
export const sendAppointmentNotificationToProfessional = async (
  data: AppointmentEmailData
): Promise<void> => {
  const { appointment } = data;
  const { service, user } = appointment;

  const appointmentDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #00297f 0%, #0058ab 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        .alert-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .detail-box {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .detail-row {
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #00297f 0%, #0058ab 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 10px 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 New Appointment Request</h1>
      </div>

      <div class="content">
        <h2>Hello ${user.name}!</h2>

        <div class="alert-box">
          <strong>⚠️ Action Required:</strong> You have a new appointment request that needs your approval.
        </div>

        <div class="detail-box">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <div class="detail-row">
            <strong>Name:</strong> ${appointment.customerName}
          </div>
          <div class="detail-row">
            <strong>Email:</strong> ${appointment.customerEmail}
          </div>
          ${appointment.customerPhone ? `
          <div class="detail-row">
            <strong>Phone:</strong> ${appointment.customerPhone}
          </div>
          ` : ''}

          <h3>Appointment Details</h3>
          <div class="detail-row">
            <strong>Service:</strong> ${service.name}
          </div>
          <div class="detail-row">
            <strong>Date:</strong> ${appointmentDate}
          </div>
          <div class="detail-row">
            <strong>Time:</strong> ${appointment.time}
          </div>
          <div class="detail-row">
            <strong>Duration:</strong> ${service.durationMinutes} minutes
          </div>
        </div>

        <p style="text-align: center; margin: 30px 0;">
          <strong>Please log in to your dashboard to approve or decline this appointment.</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `New Appointment Request - ${appointment.customerName}`,
      html: emailHtml,
    });

    console.log(`✅ Appointment notification email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Error sending professional notification email:', error);
    // Don't throw here - professional notification failing shouldn't break the booking
  }
};

export default transporter;
