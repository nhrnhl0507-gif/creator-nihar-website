/**
 * CREATOR NIHAR - FREE CONSULTATION CONTROLLER
 * Ensures reliable delivery of consultation requests to nhrnhl0507@gmail.com
 * Handles native FormSubmit POST for file:// and online hosting,
 * sets up dynamic email subject & redirect targets, and renders the success state.
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
      clientName: urlParams.get('name') || 'Valued Client',
      clientEmail: urlParams.get('email') || 'Provided',
      whatsapp: urlParams.get('phone') || 'Provided',
      selectedService: urlParams.get('service') || 'Consultation',
      preferredDate: urlParams.get('date') || 'Selected Date',
      preferredTime: urlParams.get('time') || 'Selected Time',
      timeZone: urlParams.get('tz') || 'IST'
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

  // Ensure form targets the invisible iframe so the main page never leaves or shows resubmission prompts
  form.setAttribute('target', 'hidden_form_iframe');

  form.addEventListener('submit', (e) => {
    // Validate native form inputs
    if (!form.checkValidity()) {
      form.reportValidity();
      e.preventDefault();
      return;
    }

    const checkbox = document.getElementById('confirmPolicy');
    if (checkbox && !checkbox.checked) {
      alert('Please check the confirmation box to proceed.');
      checkbox.focus();
      e.preventDefault();
      return;
    }

    // Extract values
    const clientName = document.getElementById('fullName').value.trim();
    const clientEmail = document.getElementById('emailAddress').value.trim();
    const whatsapp = document.getElementById('whatsappNumber').value.trim();
    const company = document.getElementById('companyName').value.trim() || 'Not specified';
    const selectedService = document.getElementById('selectService').value;
    const businessName = document.getElementById('projectName').value.trim() || 'Not specified';
    const discussionTopic = document.getElementById('discussionTopic').value.trim();
    const projectDetails = document.getElementById('projectDetails').value.trim();
    const preferredDate = document.getElementById('preferredDate').value;
    const preferredTime = document.getElementById('preferredTime').value;
    const timeZone = document.getElementById('timeZone').value;
    const expectedBudget = document.getElementById('expectedBudget').value.trim() || 'To be discussed';
    const additionalMessage = document.getElementById('additionalMessage').value.trim() || 'None';

    const emailSubject = `New Free Consultation Request - ${clientName}`;

    // Set FormSubmit hidden configuration inputs
    const subjectInput = document.getElementById('emailSubjectInput');
    if (subjectInput) subjectInput.value = emailSubject;

    // Button loading feedback
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span>Submitting Request...</span>
    `;

    const submissionData = {
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

    // Store in session storage in case of local preview
    try {
      sessionStorage.setItem('nihar_consultation_data', JSON.stringify(submissionData));
    } catch (err) {
      // safe fallback
    }

    // Optional background API dispatch via Web3Forms (unblockable Cloudflare infrastructure)
    if (typeof WEB3FORMS_ACCESS_KEY !== 'undefined' && WEB3FORMS_ACCESS_KEY && WEB3FORMS_ACCESS_KEY.trim() !== '') {
      try {
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
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
            booking_status: 'PENDING — Awaiting Personal Confirmation'
          })
        }).catch(e => console.warn('Background Web3Forms fetch error:', e));
      } catch (err) {
        console.warn('Web3Forms dispatch error:', err);
      }
    }

    // Record in Supabase bookings table
    try {
      if (window.CNBookings && typeof window.CNBookings.createBooking === 'function') {
        const randId = `CN-CS-${Date.now().toString().slice(-6)}`;
        await window.CNBookings.createBooking({
          booking_id: randId,
          name: clientName,
          email: clientEmail,
          phone: whatsapp,
          service: selectedService,
          project: businessName || 'Not specified',
          details: `Topic: ${discussionTopic} | Details: ${projectDetails}`,
          budget: expectedBudget || 'To be discussed',
          deadline: `${preferredDate} at ${preferredTime} (${timeZone})`,
          additional: additionalMessage || 'None',
          status: 'pending'
        });
        console.log('Consultation: Booking successfully recorded in Supabase:', randId);
      }
    } catch (e) {
      console.warn('Consultation: Supabase booking recording warning:', e);
    }

    // Smoothly transition to Success Screen (Section 7) after the browser dispatches POST
    setTimeout(() => {
      renderSuccessScreen(submissionData);
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>Request Free Consultation</span>
        <svg viewBox="0 0 24 24">
          <path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }, 500);
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
    if (dateTimeElem) dateTimeElem.textContent = `${data.preferredDate} at ${data.preferredTime} (${data.timeZone})`;

    const contactElem = document.getElementById('summaryContact');
    if (contactElem) contactElem.textContent = `${data.whatsapp} | ${data.clientEmail}`;

    const emailSubject = `New Free Consultation Request - ${data.clientName || 'Valued Client'}`;
    const formattedEmailBody = 
`----------------------------------------
CREATOR NIHAR - FREE CONSULTATION REQUEST
----------------------------------------

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
Time Zone: ${data.timeZone || 'IST'}
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
*Client Name:* ${data.clientName}
*Email:* ${data.clientEmail}
*WhatsApp:* ${data.whatsapp}
*Service:* ${data.selectedService}
*Topic:* ${data.discussionTopic || 'General Consultation'}
*Details:* ${data.projectDetails || 'None'}
*Requested Slot:* ${data.preferredDate} at ${data.preferredTime} (${data.timeZone})
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
