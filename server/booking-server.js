/**
 * Standalone Node.js Booking Server for Creator Nihar
 * Run with: node server/booking-server.js
 * Automatically loads .env and handles /api/booking POST requests.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
}

loadEnv();

const PORT = process.env.PORT || 3000;
const RECIPIENT = process.env.EMAIL_TO || 'nhrnhl0507@gmail.com';

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().slice(0, 2000);
}

function generateBookingId() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CN-BK-${dateStr}-${rand}`;
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.url === '/api/booking' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyData || '{}');
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
        if (!name || name.length < 2 || !email || !phone || !service || !details) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Missing required booking fields' }));
        }

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

        // Forward to FormSubmit or email provider
        const response = await fetch(`https://formsubmit.co/ajax/${RECIPIENT}`, {
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

        const data = await response.json();
        if (data.success === 'true' || data.success === true) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, bookingId }));
        } else {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: data.message }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Creator Nihar Booking Server listening on port ${PORT}`);
});
