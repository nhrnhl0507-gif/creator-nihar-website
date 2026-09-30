/**
 * CREATOR NIHAR - FREE CONSULTATION CONTROLLER
 * Ensures reliable delivery of consultation requests to nhrnhl0507@gmail.com
 * Handles AJAX Web3Forms submission, Supabase booking database integration,
 * dynamic email subjects & WhatsApp messages, and renders the success state.
 */

// Web3Forms Access Key configuration for nhrnhl0507@gmail.com
const WEB3FORMS_ACCESS_KEY = "c5f04805-e094-4297-87ec-73f55acf118d";

document.addEventListener('DOMContentLoaded', () => {
  initConsultationForm();
  initDateConstraints();
  initMobileToggle();
  initScrollReveal();
  checkUrlSuccessState();
  initAnotherRequestButton();
});

function initDateConstraints() {
  const dateInput = document.getElementById('preferredDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
}

function initMobileToggle() {
  const toggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (toggle && navMenu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      navMenu.classList.toggle('open');
      document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });
  }
}

function checkUrlSuccessState() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    const data = {
      bookingId: urlParams.get('ref') || `CN-CS-${Date.now().toString().slice(-6)}`,
      clientName: urlParams.get('name') || 'Valued Client',
      clientEmail: urlParams.get('email') || 'Provided',
      whatsapp: urlParams.get('phone') || 'Provided',
      selectedService: urlParams.get('service') || 'Consultation',
      preferredDate: urlParams.get('date') || 'Selected Date',
      preferredTime: urlParams.get('time') || 'Selected Time',
      timeZone: urlParams.get('tz') || 'India Standard Time (IST)'
    };
    renderSuccessScreen(data);
  }
}

function initAnotherRequestButton() {
  const anotherBtn = document.getElementById('submitAnotherBtn');
  if (anotherBtn) {
    anotherBtn.addEventListener('click', () => {
      const successPanel = document.getElementById('consultationSuccessPanel');
      const form = document.getElementById('freeConsultationForm');
      if (successPanel && form) {
        successPanel.classList.remove('active');
        form.style.display = 'block';
        form.reset();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

function initConsultationForm() {
  const form = document.getElementById('freeConsultationForm');
  const submitBtn = document.getElementById('submitConsultationBtn');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    // Prevent default form navigation / reload
    e.preventDefault();

    // Validate native form inputs
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const checkbox = document.getElementById('confirmPolicy');
    if (checkbox && !checkbox.checked) {
      alert('Please check the confirmation box to proceed.');
      checkbox.focus();
      return;
    }

    // Extract values cleanly
    const clientName = (document.getElementById('fullName')?.value || '').trim();
    const clientEmail = (document.getElementById('emailAddress')?.value || '').trim();
    const whatsapp = (document.getElementById('whatsappNumber')?.value || '').trim();
    const company = (document.getElementById('companyName')?.value || '').trim() || 'Not specified';
    const selectedService = document.getElementById('selectService')?.value || 'General Consultation';
    const businessName = (document.getElementById('projectName')?.value || '').trim() || 'Not specified';
    const discussionTopic = (document.getElementById('discussionTopic')?.value || '').trim();
    const projectDetails = (document.getElementById('projectDetails')?.value || '').trim();
    const preferredDate = document.getElementById('preferredDate')?.value || '';
    const preferredTime = document.getElementById('preferredTime')?.value || '';
    const timeZone = document.getElementById('timeZone')?.value || 'India Standard Time (IST)';
    const expectedBudget = (document.getElementById('expectedBudget')?.value || '').trim() || 'To be discussed';
    const additionalMessage = (document.getElementById('additionalMessage')?.value || '').trim() || 'None';

    // Unique Booking ID for tracking in Supabase and notifications
    const bookingId = `CN-CS-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    const emailSubject = `New Free Consultation Request - ${clientName || 'Valued Client'} [${bookingId}]`;

    // Button loading feedback
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span>Submitting Request...</span>
    `;

    const submissionData = {
      bookingId,
      clientName,
      clientEmail,
      whatsapp,
      company,
      selectedService,
      businessName,
      discussionTopic,
      projectDetails,
      preferredDate,
      preferredTime,
      timeZone,
      expectedBudget,
      additionalMessage
    };

    // Store in session storage as local cache
    try {
      sessionStorage.setItem('nihar_consultation_data', JSON.stringify(submissionData));
    } catch (err) {
      // safe fallback
    }

    // 1. Dispatch to Web3Forms API
    const web3Promise = (async () => {
      if (typeof WEB3FORMS_ACCESS_KEY !== 'undefined' && WEB3FORMS_ACCESS_KEY) {
        const payload = {
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: emailSubject,
          from_name: 'Creator Nihar Website',
          name: clientName,
          email: clientEmail,
          phone: whatsapp,
          company: company,
          service: selectedService,
          project: businessName,
          topic: discussionTopic,
          details: projectDetails,
          date: preferredDate,
          time: preferredTime,
          timezone: timeZone,
          budget: expectedBudget,
          notes: additionalMessage,
          booking_id: bookingId,
          booking_status: 'PENDING — Awaiting Personal Confirmation'
        };

        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const resData = await res.json();
        console.log('Consultation: Web3Forms submission response:', resData);
        return resData;
      }
      return null;
    })().catch(err => {
      console.warn('Consultation: Web3Forms dispatch warning:', err);
      return null;
    });

    // 2. Record in Supabase bookings table
    const supabasePromise = (async () => {
      if (window.CNBookings && typeof window.CNBookings.createBooking === 'function') {
        const res = await window.CNBookings.createBooking({
          booking_id: bookingId,
          name: clientName,
          email: clientEmail,
          phone: whatsapp,
          service: selectedService,
          project: businessName || 'Not specified',
          details: `Topic: ${discussionTopic} | Details: ${projectDetails} | Company: ${company}`,
          budget: expectedBudget || 'To be discussed',
          deadline: `${preferredDate} at ${preferredTime} (${timeZone})`,
          additional: additionalMessage || 'None',
          status: 'pending'
        });
        console.log('Consultation: Booking successfully recorded in Supabase:', bookingId);
        return res;
      } else {
        console.warn('Consultation: window.CNBookings not ready or not found.');
        return null;
      }
    })().catch(e => {
      console.warn('Consultation: Supabase booking recording warning:', e);
      return null;
    });

    // Await both dispatches with safety timeout so user is never frozen
    try {
      await Promise.race([
        Promise.allSettled([web3Promise, supabasePromise]),
        new Promise(resolve => setTimeout(resolve, 4000))
      ]);
    } catch (raceErr) {
      console.warn('Consultation: Dispatch race warning:', raceErr);
    }

    // Render Success Screen
    renderSuccessScreen(submissionData);

    // Restore button in case user navigates back
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
  });
}

function renderSuccessScreen(data) {
  const formCard = document.querySelector('.consult-form-card');
  const successPanel = document.getElementById('consultationSuccessPanel');

  if (formCard && successPanel) {
    const formElement = document.getElementById('freeConsultationForm');
    if (formElement) formElement.style.display = 'none';

    // Populate submitted details
    const nameElem = document.getElementById('summaryName');
    if (nameElem) nameElem.textContent = data.clientName || 'Valued Client';

    const serviceElem = document.getElementById('summaryService');
    if (serviceElem) serviceElem.textContent = data.selectedService || 'Consultation';

    const dateTimeElem = document.getElementById('summaryDateTime');
    if (dateTimeElem) dateTimeElem.textContent = `${data.preferredDate || 'Selected Date'} at ${data.preferredTime || 'Selected Time'} (${data.timeZone || 'IST'})`;

    const contactElem = document.getElementById('summaryContact');
    if (contactElem) contactElem.textContent = `${data.whatsapp || 'Provided'} | ${data.clientEmail || 'Provided'}`;

    // Update status pill to display booking reference
    const statusPill = successPanel.querySelector('.success-status-pill span');
    if (statusPill) {
      if (data.bookingId) {
        statusPill.textContent = `● Status: Pending Personal Confirmation (Ref: ${data.bookingId})`;
      } else {
        statusPill.textContent = `● Status: Pending Personal Confirmation`;
      }
    }

    const emailSubject = `New Free Consultation Request - ${data.clientName || 'Valued Client'}${data.bookingId ? ` [${data.bookingId}]` : ''}`;
    const formattedEmailBody = 
`----------------------------------------
CREATOR NIHAR - FREE CONSULTATION REQUEST
----------------------------------------
Booking Reference: ${data.bookingId || 'Pending'}

Client Name: ${data.clientName || 'Not specified'}
Email Address: ${data.clientEmail || 'Not specified'}
WhatsApp Number: ${data.whatsapp || 'Not specified'}
Company / Brand: ${data.company || 'Not specified'}

Selected Service: ${data.selectedService || 'Consultation'}
Project / Business: ${data.businessName || 'Not specified'}
Discussion Topic: ${data.discussionTopic || 'Not specified'}
Project Details: ${data.projectDetails || 'Not specified'}

Requested Date: ${data.preferredDate || 'Not specified'}
Requested Time: ${data.preferredTime || 'Not specified'}
Time Zone: ${data.timeZone || 'India Standard Time (IST)'}
Expected Budget: ${data.expectedBudget || 'To be discussed'}

Additional Message:
${data.additionalMessage || 'None'}

Booking Status:
PENDING — Awaiting Personal Confirmation by Nihar Amrawat
----------------------------------------`;

    // 1-Click Gmail Direct Web Link
    const directGmailBtn = document.getElementById('directGmailBtn');
    if (directGmailBtn) {
      directGmailBtn.href = `https://mail.google.com/mail/?view=cm&fs=1&to=nhrnhl0507@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formattedEmailBody)}`;
    }

    // Default Mail Client Fallback
    const directMailtoBtn = document.getElementById('directMailtoBtn');
    if (directMailtoBtn) {
      directMailtoBtn.href = `mailto:nhrnhl0507@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formattedEmailBody)}`;
    }

    // WhatsApp Message with Comprehensive Consultation Dossier
    const waNotifyBtn = document.getElementById('waNotifyBtn');
    if (waNotifyBtn) {
      const waText = 
`*NEW FREE CONSULTATION REQUEST*
----------------------------------
*Booking Ref:* ${data.bookingId || 'CN-CS'}
*Client Name:* ${data.clientName || 'Client'}
*Email:* ${data.clientEmail || 'Not provided'}
*WhatsApp:* ${data.whatsapp || 'Not provided'}
*Service:* ${data.selectedService || 'Consultation'}
*Topic:* ${data.discussionTopic || 'General Consultation'}
*Details:* ${data.projectDetails || 'None'}
*Requested Slot:* ${data.preferredDate || 'Date'} at ${data.preferredTime || 'Time'} (${data.timeZone || 'IST'})
*Budget:* ${data.expectedBudget || 'To be discussed'}
*Status:* Pending Personal Confirmation
----------------------------------
_Sent via Creator Nihar Website_`;

      waNotifyBtn.href = `https://wa.me/917723913729?text=${encodeURIComponent(waText)}`;
    }

    // Show success panel
    successPanel.classList.add('active');
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach((el) => observer.observe(el));
}
