/**
 * Serverless / Backend Endpoint for Creator Nihar Service Booking
 * Recipient: nhrnhl0507@gmail.com
 * Handles validation, sanitization, unique Booking ID generation,
 * and email notification dispatch.
 */

// Helper to sanitize text input
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 2000);
}

// Generate unique Booking ID
function generateBookingId() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CN-BK-${dateStr}-${rand}`;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};

    const name = sanitize(body.name || body.clientName);
    const email = sanitize(body.email || body.clientEmail);
    const phone = sanitize(body.phone || body.clientPhone);
    const service = sanitize(body.service || body.selectedService);
    const project = sanitize(body.project || body.projectName || 'Not specified');
    const details = sanitize(body.details || body.projectDetails);
    const budget = sanitize(body.budget || 'To be discussed');
    const deadline = sanitize(body.deadline || 'Flexible');
    const additional = sanitize(body.additional || body.additionalRequirements || 'None');
    const bookingId = body.bookingId || generateBookingId();
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

    // Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Valid customer name is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, error: 'Valid 10+ digit phone/WhatsApp number is required' });
    }

    if (!service) {
      return res.status(400).json({ success: false, error: 'Selected service is required' });
    }

    if (!details || details.length < 5) {
      return res.status(400).json({ success: false, error: 'Project details are required' });
    }

    const recipient = process.env.EMAIL_TO || 'nhrnhl0507@gmail.com';
    const emailSubject = `New Creator Nihar Service Booking - ${service}`;

    const emailBody = `NEW CREATOR NIHAR SERVICE BOOKING

Booking ID:
${bookingId}

Customer Name:
${name}

Customer Email:
${email}

Phone / WhatsApp:
${phone}

Selected Service:
${service}

Project / Brand:
${project}

Budget:
${budget}

Deadline:
${deadline}

Project Details:
${details}

Additional Requirements:
${additional}

Booking Date & Time:
${timestamp}`;

    // Dispatch email via configured provider or FormSubmit backend
    let emailSent = false;
    let providerError = null;

    // Check if Resend API Key is available in environment
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Creator Nihar <booking@creatornihar.co.in>',
            to: [recipient],
            subject: emailSubject,
            text: emailBody
          })
        });
        if (resendRes.ok) {
          emailSent = true;
        } else {
          providerError = await resendRes.text();
        }
      } catch (err) {
        providerError = err.message;
      }
    }

    // Fallback to FormSubmit / Web3Forms if Resend is not configured or failed
    if (!emailSent) {
      try {
        const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${recipient}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': 'https://creatornihar.co.in/'
          },
          body: JSON.stringify({
            _subject: emailSubject,
            booking_id: bookingId,
            customer_name: name,
            customer_email: email,
            phone_whatsapp: phone,
            selected_service: service,
            project_brand: project,
            budget: budget,
            deadline: deadline,
            project_details: details,
            additional_requirements: additional,
            booking_timestamp: timestamp,
            message: emailBody
          })
        });

        const data = await formSubmitRes.json();
        if (data.success === 'true' || data.success === true) {
          emailSent = true;
        } else {
          providerError = data.message || 'Email delivery pending activation';
        }
      } catch (err) {
        providerError = err.message;
      }
    }

    if (emailSent) {
      return res.status(200).json({
        success: true,
        bookingId: bookingId,
        message: 'Booking notification sent successfully to ' + recipient
      });
    } else {
      return res.status(502).json({
        success: false,
        bookingId: bookingId,
        error: providerError || 'Failed to dispatch email notification'
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error processing booking'
    });
  }
}
