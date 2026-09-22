/**
 * SHIVA AI CHATBOT CONTROLLER
 * Creator Nihar - AI Creative Agency
 * Handles conversational inquiries and step-by-step service booking
 * with automatic email notification to nhrnhl0507@gmail.com.
 * ZERO WhatsApp automation / ZERO WhatsApp API.
 */

(function () {
  'use strict';

  // Config & State
  const RECIPIENT_EMAIL = 'nhrnhl0507@gmail.com';
  const BACKEND_ENDPOINT = '/api/booking';
  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
  // Web3Forms Access Key for nhrnhl0507@gmail.com
  const WEB3FORMS_ACCESS_KEY = 'c5f04805-e094-4297-87ec-73f55acf118d';

  const bookingState = {
    step: 'IDLE',
    editingField: null,
    data: {
      name: '',
      email: '',
      phone: '',
      service: '',
      project: '',
      details: '',
      budget: '',
      deadline: '',
      additional: '',
      bookingId: ''
    },
    isSubmitting: false
  };

  // Generate unique Booking ID
  function generateBookingId() {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CN-BK-${dateStr}-${rand}`;
  }

  // Format timestamp (India Standard Time)
  function getTimestamp() {
    try {
      return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    } catch (e) {
      return new Date().toLocaleString() + ' IST';
    }
  }

  // DOM Elements
  let chatLauncher = null;
  let chatContainer = null;
  let messagesContainer = null;
  let chatForm = null;
  let chatInput = null;

  document.addEventListener('DOMContentLoaded', () => {
    initShivaWidget();
  });

  function initShivaWidget() {
    // 1. Create floating launcher button
    chatLauncher = document.createElement('button');
    chatLauncher.className = 'shiva-floating-btn';
    chatLauncher.setAttribute('aria-label', 'Chat with Shiva AI');
    chatLauncher.innerHTML = `
      <div class="shiva-pulse"></div>
      <span class="shiva-badge">AI</span>
      <span class="shiva-tooltip">Chat with Shiva AI</span>
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    document.body.appendChild(chatLauncher);

    // 2. Create chat window container
    chatContainer = document.createElement('div');
    chatContainer.className = 'shiva-chat-container';
    chatContainer.innerHTML = `
      <div class="shiva-header">
        <div class="shiva-header-profile">
          <div class="shiva-avatar">
            <img src="assets/images/favicon-96x96.png" alt="Shiva AI Avatar" onerror="this.src='../assets/images/favicon-96x96.png'">
            <span class="shiva-status-dot"></span>
          </div>
          <div class="shiva-header-info">
            <h4>Shiva AI <span>Assistant</span></h4>
            <p>Creator Nihar Official AI</p>
          </div>
        </div>
        <div class="shiva-header-actions">
          <button type="button" class="shiva-action-btn btn-reset" title="Reset Chat">↺</button>
          <button type="button" class="shiva-action-btn btn-close" title="Close Chat">✕</button>
        </div>
      </div>
      <div class="shiva-messages" id="shivaMessages"></div>
      <div class="shiva-footer">
        <form class="shiva-input-form" id="shivaForm" onsubmit="return false;">
          <input type="text" class="shiva-input" id="shivaInput" placeholder="Type your message..." autocomplete="off">
          <button type="submit" class="shiva-send-btn" id="shivaSendBtn" aria-label="Send message">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(chatContainer);

    // Cache elements
    messagesContainer = document.getElementById('shivaMessages');
    chatForm = document.getElementById('shivaForm');
    chatInput = document.getElementById('shivaInput');

    // Event listeners
    chatLauncher.addEventListener('click', toggleChat);
    chatContainer.querySelector('.btn-close').addEventListener('click', closeChat);
    chatContainer.querySelector('.btn-reset').addEventListener('click', resetChat);
    chatForm.addEventListener('submit', handleUserSubmit);

    // Event delegation for all action buttons inside messagesContainer
    messagesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const text = btn.innerText.trim();
      handleOptionClick(action, text);
    });

    // Initial greeting
    showInitialGreeting();
  }

  function toggleChat() {
    chatContainer.classList.toggle('active');
    if (chatContainer.classList.contains('active')) {
      chatInput.focus();
    }
  }

  function closeChat() {
    chatContainer.classList.remove('active');
  }

  function resetChat() {
    messagesContainer.innerHTML = '';
    bookingState.step = 'IDLE';
    bookingState.editingField = null;
    bookingState.data = {
      name: '',
      email: '',
      phone: '',
      service: '',
      project: '',
      details: '',
      budget: '',
      deadline: '',
      additional: '',
      bookingId: ''
    };
    bookingState.isSubmitting = false;
    showInitialGreeting();
  }

  function showInitialGreeting() {
    const welcomeHtml = `
      नमस्ते! 🙏 मैं <strong>Shiva</strong>, Creator Nihar का AI Assistant हूँ।<br><br>
      मैं आपकी क्या मदद कर सकता हूँ? नीचे दिए गए विकल्प चुनें या अपना सवाल पूछें:
      <div class="shiva-options">
        <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="start_booking">
          📋 Service Book करें
        </button>
        <button type="button" class="shiva-opt-btn" data-action="ai_video_info">
          🎥 AI Video Creation (₹1,500)
        </button>
        <button type="button" class="shiva-opt-btn" data-action="web_creation_info">
          💻 Website Creation (₹20,000)
        </button>
        <button type="button" class="shiva-opt-btn" data-action="pricing_info">
          💰 Pricing Details
        </button>
        <button type="button" class="shiva-opt-btn shiva-opt-orange" data-action="contact_info">
          📞 Contact Nihar
        </button>
      </div>
    `;
    addBotMessage(welcomeHtml);
  }

  // Add a message from Shiva
  function addBotMessage(html) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'shiva-msg shiva-msg-bot';
    msgDiv.innerHTML = `
      <div class="shiva-msg-avatar">
        <img src="assets/images/favicon-48x48.png" alt="Shiva" onerror="this.src='../assets/images/favicon-48x48.png'">
      </div>
      <div class="shiva-msg-bubble">${html}</div>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollMessagesToBottom();
  }

  // Add a user message
  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'shiva-msg shiva-msg-user';
    msgDiv.innerHTML = `
      <div class="shiva-msg-bubble">${escapeHtml(text)}</div>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollMessagesToBottom();
  }

  function scrollMessagesToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Handle Option Clicks
  function handleOptionClick(action, text) {
    if (!action) return;

    // Actions that shouldn't echo user message
    if (action !== 'confirm_booking') {
      addUserMessage(text);
    }

    if (action === 'start_booking') {
      startServiceBooking();
    } else if (action === 'ai_video_info') {
      addBotMessage(`
        <strong>AI Video Creation</strong> — ₹1,500/video<br><br>
        • High-impact AI generated visuals<br>
        • Creative concept & script development<br>
        • Social media reels, shorts, & brand ads<br>
        • Fast turnaround<br><br>
        क्या आप इसके लिए बुकिंग करना चाहते हैं?
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="start_booking">📋 Service Book करें</button>
        </div>
      `);
    } else if (action === 'web_creation_info') {
      addBotMessage(`
        <strong>Website Creation</strong> — ₹20,000/website<br><br>
        • Full-stack modern UI/UX design<br>
        • Mobile & desktop fully responsive<br>
        • WhatsApp & lead capture forms<br>
        • Clean code, fast loading & SEO ready<br><br>
        क्या आप website के लिए बुकिंग करना चाहते हैं?
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="start_booking">📋 Service Book करें</button>
        </div>
      `);
    } else if (action === 'pricing_info') {
      addBotMessage(`
        <strong>Creator Nihar Transparent Pricing:</strong><br><br>
        1. <strong>AI Video Creation:</strong> ₹1,500 / video<br>
        2. <strong>Website Creation:</strong> ₹20,000 / website<br><br>
        Zero hidden charges. Complete personal attention from Founder Nihar Amrawat.
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="start_booking">📋 Service Book करें</button>
        </div>
      `);
    } else if (action === 'contact_info') {
      addBotMessage(`
        <strong>Direct Contact with Nihar:</strong><br><br>
        📞 <strong>Phone:</strong> <a href="tel:+917723913729">+91 7723913729</a><br>
        💬 <strong>WhatsApp:</strong> <a href="https://wa.me/917723913729" target="_blank" rel="noopener noreferrer">+91 7723913729</a><br>
        📧 <strong>Email:</strong> <a href="mailto:nhrnhl0507@gmail.com">nhrnhl0507@gmail.com</a><br>
        📍 <strong>Location:</strong> Udaipur, Rajasthan, India
      `);
    } else if (action.startsWith('service_select_')) {
      const selected = action.replace('service_select_', '');
      bookingState.data.service = selected;
      if (bookingState.editingField === 'service') {
        bookingState.editingField = null;
        addBotMessage(`✅ Service बदलकर <strong>${escapeHtml(selected)}</strong> कर दी गई है!`);
        showBookingSummary();
      } else {
        askNextQuestion();
      }
    } else if (action.startsWith('budget_select_')) {
      const selected = action.replace('budget_select_', '');
      bookingState.data.budget = selected;
      if (bookingState.editingField === 'budget') {
        bookingState.editingField = null;
        addBotMessage(`✅ Budget बदलकर <strong>${escapeHtml(selected)}</strong> कर दिया गया है!`);
        showBookingSummary();
      } else {
        askNextQuestion();
      }
    } else if (action.startsWith('deadline_select_')) {
      const selected = action.replace('deadline_select_', '');
      bookingState.data.deadline = selected;
      if (bookingState.editingField === 'deadline') {
        bookingState.editingField = null;
        addBotMessage(`✅ Deadline बदलकर <strong>${escapeHtml(selected)}</strong> कर दी गई है!`);
        showBookingSummary();
      } else {
        askNextQuestion();
      }
    } else if (action === 'no_additional') {
      bookingState.data.additional = 'No additional requirements';
      if (bookingState.editingField === 'additional') {
        bookingState.editingField = null;
        addBotMessage(`✅ Additional requirements update कर दी गई हैं!`);
        showBookingSummary();
      } else {
        askNextQuestion();
      }
    } else if (action === 'confirm_booking') {
      handleConfirmBooking();
    } else if (action === 'edit_booking') {
      handleEditBooking();
    } else if (action.startsWith('edit_field_')) {
      const field = action.replace('edit_field_', '');
      executeEditField(field);
    }
  }

  // Handle Form Text Submits
  function handleUserSubmit() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    addUserMessage(text);

    // If currently editing a single field
    if (bookingState.editingField) {
      processEditAnswer(text);
      return;
    }

    // If currently in step-by-step booking flow
    if (bookingState.step !== 'IDLE' && bookingState.step !== 'BOOKING_SUMMARY') {
      processBookingAnswer(text);
      return;
    }

    // Keyword detection in IDLE state
    const lower = text.toLowerCase();
    if (lower.includes('book') || lower.includes('booking') || lower.includes('service') || lower.includes('order')) {
      startServiceBooking();
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('fee')) {
      handleOptionClick('pricing_info', 'Pricing');
    } else if (lower.includes('video')) {
      handleOptionClick('ai_video_info', 'AI Video Info');
    } else if (lower.includes('website') || lower.includes('web')) {
      handleOptionClick('web_creation_info', 'Website Info');
    } else if (lower.includes('contact') || lower.includes('phone') || lower.includes('email') || lower.includes('number')) {
      handleOptionClick('contact_info', 'Contact Info');
    } else {
      addBotMessage(`
        धन्यवाद आपके संदेश के लिए! मैं आपकी सेवा के लिए उपस्थित हूँ।<br><br>
        क्या आप Creator Nihar की कोई service book करना चाहते हैं?
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="start_booking">📋 Service Book करें</button>
          <button type="button" class="shiva-opt-btn" data-action="pricing_info">💰 Pricing Details</button>
        </div>
      `);
    }
  }

  /* ==========================================================================
     SERVICE BOOKING STEP-BY-STEP FLOW
     ========================================================================== */
  function startServiceBooking() {
    bookingState.step = 'BOOKING_NAME';
    bookingState.editingField = null;
    bookingState.data = {
      name: '',
      email: '',
      phone: '',
      service: '',
      project: '',
      details: '',
      budget: '',
      deadline: '',
      additional: '',
      bookingId: generateBookingId()
    };

    addBotMessage(`
      बहुत बढ़िया! आइए आपकी booking शुरू करते हैं।<br><br>
      <strong>Step 1/9:</strong> कृपया अपना <strong>Full Name</strong> (पूरा नाम) बताएं:
    `);
  }

  function processBookingAnswer(text) {
    switch (bookingState.step) {
      case 'BOOKING_NAME':
        if (text.length < 2) {
          addBotMessage(`⚠️ कृपया एक मान्य नाम (कम से कम 2 अक्षर) लिखें:`);
          return;
        }
        bookingState.data.name = text;
        bookingState.step = 'BOOKING_EMAIL';
        addBotMessage(`
          धन्यवाद, <strong>${escapeHtml(text)}</strong>!<br><br>
          <strong>Step 2/9:</strong> आपका <strong>Email Address</strong> क्या है? (Booking confirmation और details के लिए):
        `);
        break;

      case 'BOOKING_EMAIL':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          addBotMessage(`⚠️ कृपया एक मान्य Email Address दर्ज करें (उदा. yourname@gmail.com):`);
          return;
        }
        bookingState.data.email = text;
        bookingState.step = 'BOOKING_PHONE';
        addBotMessage(`
          <strong>Step 3/9:</strong> आपका <strong>WhatsApp या Phone Number</strong> क्या है?
        `);
        break;

      case 'BOOKING_PHONE':
        const cleanPhone = text.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          addBotMessage(`⚠️ कृपया एक मान्य 10-अंकों का Phone/WhatsApp नंबर दर्ज करें:`);
          return;
        }
        bookingState.data.phone = text;
        bookingState.step = 'BOOKING_SERVICE';
        addBotMessage(`
          <strong>Step 4/9:</strong> आप कौन सी service book करना चाहते हैं?
          <div class="shiva-options">
            <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="service_select_AI Video Creation — ₹1,500/video">
              🎥 AI Video Creation — ₹1,500/video
            </button>
            <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="service_select_Website Creation — ₹20,000/website">
              💻 Website Creation — ₹20,000/website
            </button>
            <button type="button" class="shiva-opt-btn" data-action="service_select_Both (AI Video & Website Creation)">
              ✨ Both Services
            </button>
          </div>
        `);
        break;

      case 'BOOKING_SERVICE':
        bookingState.data.service = text;
        askNextQuestion();
        break;

      case 'BOOKING_PROJECT':
        bookingState.data.project = text;
        bookingState.step = 'BOOKING_DETAILS';
        addBotMessage(`
          <strong>Step 6/9:</strong> अपने <strong>Project की Details</strong> बताएं — क्या बनाना है, आपकी क्या expectations हैं?
        `);
        break;

      case 'BOOKING_DETAILS':
        if (text.length < 5) {
          addBotMessage(`⚠️ कृपया project के बारे में थोड़ा विस्तार से बताएं:`);
          return;
        }
        bookingState.data.details = text;
        bookingState.step = 'BOOKING_BUDGET';
        addBotMessage(`
          <strong>Step 7/9:</strong> आपका <strong>Expected Budget</strong> क्या है?
          <div class="shiva-options">
            <button type="button" class="shiva-opt-btn" data-action="budget_select_₹1,500 (AI Video Standard)">
              ₹1,500 (AI Video)
            </button>
            <button type="button" class="shiva-opt-btn" data-action="budget_select_₹20,000 (Website Standard)">
              ₹20,000 (Website)
            </button>
            <button type="button" class="shiva-opt-btn" data-action="budget_select_Flexible / To be discussed">
              Flexible / To be discussed
            </button>
          </div>
        `);
        break;

      case 'BOOKING_BUDGET':
        bookingState.data.budget = text;
        askNextQuestion();
        break;

      case 'BOOKING_DEADLINE':
        bookingState.data.deadline = text;
        askNextQuestion();
        break;

      case 'BOOKING_ADDITIONAL':
        bookingState.data.additional = text;
        showBookingSummary();
        break;
    }
  }

  function askNextQuestion() {
    if (bookingState.step === 'BOOKING_SERVICE') {
      bookingState.step = 'BOOKING_PROJECT';
      addBotMessage(`
        <strong>Step 5/9:</strong> आपके <strong>Project या Brand का नाम</strong> क्या है?
      `);
    } else if (bookingState.step === 'BOOKING_BUDGET') {
      bookingState.step = 'BOOKING_DEADLINE';
      addBotMessage(`
        <strong>Step 8/9:</strong> Project पूरा होने की कोई <strong>Deadline / Timeline</strong>?
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_Urgent (1-3 Days)">⚡ Urgent (1-3 Days)</button>
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_1 Week">📅 1 Week</button>
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_2-4 Weeks">🗓️ 2-4 Weeks</button>
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_Flexible">🤝 Flexible</button>
        </div>
      `);
    } else if (bookingState.step === 'BOOKING_DEADLINE') {
      bookingState.step = 'BOOKING_ADDITIONAL';
      addBotMessage(`
        <strong>Step 9/9:</strong> कोई <strong>Additional Requirements</strong> या खास निर्देश?
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn" data-action="no_additional">No additional requirements</button>
        </div>
      `);
    }
  }

  // Render the exact required Booking Summary
  function showBookingSummary() {
    bookingState.step = 'BOOKING_SUMMARY';
    bookingState.editingField = null;
    const d = bookingState.data;

    const summaryHtml = `
      <div class="shiva-summary-card">
        <div class="shiva-summary-header">
          📋 आपकी Booking Details
        </div>
        <div class="shiva-summary-row">
          <span class="shiva-summary-label">Name:</span>
          <span class="shiva-summary-val">${escapeHtml(d.name)}</span>
        </div>
        <div class="shiva-summary-row">
          <span class="shiva-summary-label">Email:</span>
          <span class="shiva-summary-val">${escapeHtml(d.email)}</span>
        </div>
        <div class="shiva-summary-row">
          <span class="shiva-summary-label">Phone/WhatsApp:</span>
          <span class="shiva-summary-val">${escapeHtml(d.phone)}</span>
        </div>
        <div class="shiva-summary-row">
          <span class="shiva-summary-label">Service:</span>
          <span class="shiva-summary-val">${escapeHtml(d.service)}</span>
        </div>
        <div class="shiva-summary-row">
          <span class="shiva-summary-label">Project/Brand:</span>
          <span class="shiva-summary-val">${escapeHtml(d.project)}</span>
        </div>
        <div class="shiva-summary-row">
          <span class="shiva-summary-label">Budget:</span>
          <span class="shiva-summary-val">${escapeHtml(d.budget)}</span>
        </div>
        <div class="shiva-summary-row">
          <span class="shiva-summary-label">Deadline:</span>
          <span class="shiva-summary-val">${escapeHtml(d.deadline)}</span>
        </div>
        <div class="shiva-summary-details-block">
          <div class="shiva-summary-details-label">Project Details:</div>
          <div>${escapeHtml(d.details)}</div>
        </div>
        ${d.additional && d.additional !== 'No additional requirements' ? `
        <div class="shiva-summary-details-block">
          <div class="shiva-summary-details-label">Additional Requirements:</div>
          <div>${escapeHtml(d.additional)}</div>
        </div>` : ''}

        <div style="margin-top: 14px; font-weight: 700; color: #0A4E8C;">
          क्या ये details सही हैं?
        </div>

        <div class="shiva-confirm-actions">
          <button type="button" class="shiva-btn-confirm" id="btnConfirmBooking" data-action="confirm_booking">
            ✅ Confirm Booking
          </button>
          <button type="button" class="shiva-btn-edit" data-action="edit_booking">
            ✏️ Edit Details
          </button>
        </div>
      </div>
    `;

    addBotMessage(summaryHtml);
  }

  /* ==========================================================================
     EDIT DETAILS WORKFLOW
     ========================================================================== */
  function handleEditBooking() {
    addBotMessage(`
      आप कौन सी detail बदलना चाहते हैं? नीचे दिए गए विकल्प में से चुनें:
      <div class="shiva-options">
        <button type="button" class="shiva-opt-btn" data-action="edit_field_name">✏️ Name</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_email">✏️ Email</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_phone">✏️ Phone</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_service">✏️ Service</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_project">✏️ Project/Brand</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_details">✏️ Project Details</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_budget">✏️ Budget</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_deadline">✏️ Deadline</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_additional">✏️ Additional</button>
        <button type="button" class="shiva-opt-btn shiva-opt-orange" data-action="edit_field_restart">🔄 Restart Booking</button>
        <button type="button" class="shiva-opt-btn" data-action="edit_field_back">↩️ Back to Summary</button>
      </div>
    `);
  }

  function executeEditField(field) {
    if (field === 'restart') {
      startServiceBooking();
      return;
    }
    if (field === 'back') {
      showBookingSummary();
      return;
    }

    bookingState.editingField = field;

    if (field === 'name') {
      addBotMessage(`कृपया अपना नया <strong>Full Name</strong> बताएं:`);
    } else if (field === 'email') {
      addBotMessage(`कृपया अपना नया <strong>Email Address</strong> बताएं:`);
    } else if (field === 'phone') {
      addBotMessage(`कृपया अपना नया <strong>WhatsApp या Phone Number</strong> बताएं:`);
    } else if (field === 'service') {
      addBotMessage(`
        कृपया अपनी नई <strong>Service</strong> चुनें:
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="service_select_AI Video Creation — ₹1,500/video">🎥 AI Video Creation (₹1,500)</button>
          <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="service_select_Website Creation — ₹20,000/website">💻 Website Creation (₹20,000)</button>
          <button type="button" class="shiva-opt-btn" data-action="service_select_Both (AI Video & Website Creation)">✨ Both Services</button>
        </div>
      `);
    } else if (field === 'project') {
      addBotMessage(`कृपया अपने <strong>Project या Brand का नाम</strong> बताएं:`);
    } else if (field === 'details') {
      addBotMessage(`कृपया अपने <strong>Project Details</strong> दोबारा विस्तार से लिखें:`);
    } else if (field === 'budget') {
      addBotMessage(`
        कृपया अपना नया <strong>Expected Budget</strong> चुनें या लिखें:
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn" data-action="budget_select_₹1,500 (AI Video Standard)">₹1,500 (AI Video)</button>
          <button type="button" class="shiva-opt-btn" data-action="budget_select_₹20,000 (Website Standard)">₹20,000 (Website)</button>
          <button type="button" class="shiva-opt-btn" data-action="budget_select_Flexible / To be discussed">Flexible / To be discussed</button>
        </div>
      `);
    } else if (field === 'deadline') {
      addBotMessage(`
        कृपया अपनी <strong>Timeline या Deadline</strong> चुनें या लिखें:
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_Urgent (1-3 Days)">⚡ Urgent (1-3 Days)</button>
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_1 Week">📅 1 Week</button>
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_2-4 Weeks">🗓️ 2-4 Weeks</button>
          <button type="button" class="shiva-opt-btn" data-action="deadline_select_Flexible">🤝 Flexible</button>
        </div>
      `);
    } else if (field === 'additional') {
      addBotMessage(`
        कृपया अपनी <strong>Additional Requirements</strong> लिखें:
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn" data-action="no_additional">No additional requirements</button>
        </div>
      `);
    }
  }

  function processEditAnswer(text) {
    const field = bookingState.editingField;

    if (field === 'name') {
      if (text.length < 2) {
        addBotMessage(`⚠️ कृपया एक मान्य नाम (कम से कम 2 अक्षर) लिखें:`);
        return;
      }
      bookingState.data.name = text;
    } else if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        addBotMessage(`⚠️ कृपया एक मान्य Email Address दर्ज करें:`);
        return;
      }
      bookingState.data.email = text;
    } else if (field === 'phone') {
      const cleanPhone = text.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        addBotMessage(`⚠️ कृपया एक मान्य 10-अंकों का Phone नंबर दर्ज करें:`);
        return;
      }
      bookingState.data.phone = text;
    } else if (field === 'project') {
      bookingState.data.project = text;
    } else if (field === 'details') {
      if (text.length < 5) {
        addBotMessage(`⚠️ कृपया project के बारे में थोड़ा विस्तार से बताएं:`);
        return;
      }
      bookingState.data.details = text;
    } else if (field === 'budget') {
      bookingState.data.budget = text;
    } else if (field === 'deadline') {
      bookingState.data.deadline = text;
    } else if (field === 'additional') {
      bookingState.data.additional = text;
    }

    bookingState.editingField = null;
    addBotMessage(`✅ आपकी details update कर दी गई हैं!`);
    showBookingSummary();
  }

  /* ==========================================================================
     AUTOMATIC EMAIL NOTIFICATION & CONFIRMATION
     ========================================================================== */
  function submitNativeForm(d, emailSubject, emailBody, timestamp) {
    if (!WEB3FORMS_ACCESS_KEY) return false;
    try {
      let iframe = document.getElementById('shiva_hidden_iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'shiva_hidden_iframe';
        iframe.id = 'shiva_hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      let form = document.getElementById('shiva_native_booking_form');
      if (form) form.remove();

      form = document.createElement('form');
      form.id = 'shiva_native_booking_form';
      form.action = WEB3FORMS_ENDPOINT;
      form.method = 'POST';
      form.target = 'shiva_hidden_iframe';
      form.style.display = 'none';

      const fields = {
        'access_key': WEB3FORMS_ACCESS_KEY,
        'subject': emailSubject,
        'from_name': 'Creator Nihar Shiva AI',
        'Booking ID': d.bookingId,
        'Customer Name': d.name,
        'Customer Email': d.email,
        'Phone / WhatsApp': d.phone,
        'Selected Service': d.service,
        'Project / Brand': d.project || 'Not specified',
        'Budget': d.budget || 'To be discussed',
        'Deadline': d.deadline || 'Flexible',
        'Project Details': d.details,
        'Additional Requirements': d.additional || 'None',
        'Booking Date & Time': timestamp
      };

      for (const [key, val] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = val;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      return true;
    } catch (e) {
      console.warn('Native form submission error:', e);
      return false;
    }
  }

  async function handleConfirmBooking() {
    if (bookingState.isSubmitting) return;

    // Prevent duplicate clicks
    bookingState.isSubmitting = true;
    const confirmBtn = document.getElementById('btnConfirmBooking');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Submitting Booking...
      `;
    }

    const d = bookingState.data;
    if (!d.bookingId) d.bookingId = generateBookingId();
    const timestamp = getTimestamp();

    const emailSubject = `New Creator Nihar Service Booking - ${d.service} [${d.bookingId}]`;
    const emailBody = `NEW CREATOR NIHAR SERVICE BOOKING
--------------------------------------------------
Booking ID: ${d.bookingId}

Customer Name: ${d.name}
Customer Email: ${d.email}
Phone / WhatsApp: ${d.phone}

Selected Service: ${d.service}
Project / Brand: ${d.project || 'Not specified'}
Budget: ${d.budget || 'To be discussed'}
Deadline: ${d.deadline || 'Flexible'}

Project Details:
${d.details}

Additional Requirements:
${d.additional || 'None'}

Booking Date & Time: ${timestamp}
--------------------------------------------------`;

    // Add typing indicator
    showTyping();

    let emailSuccessful = false;

    // 1. First attempt: Serverless / Node.js backend endpoint
    try {
      const backendRes = await fetch(BACKEND_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          bookingId: d.bookingId,
          name: d.name,
          email: d.email,
          phone: d.phone,
          service: d.service,
          project: d.project,
          details: d.details,
          budget: d.budget,
          deadline: d.deadline,
          additional: d.additional,
          timestamp: timestamp
        })
      });

      if (backendRes.ok) {
        const resData = await backendRes.json();
        if (resData.success === true || resData.success === 'true') {
          emailSuccessful = true;
        }
      }
    } catch (backendErr) {
      // Backend not available (static host)
    }

    // 2. Second attempt: Web3Forms API (if access key configured)
    if (!emailSuccessful && WEB3FORMS_ACCESS_KEY && WEB3FORMS_ACCESS_KEY.trim() !== '') {
      try {
        const w3Res = await fetch(WEB3FORMS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: emailSubject,
            from_name: 'Creator Nihar Shiva AI',
            booking_id: d.bookingId,
            customer_name: d.name,
            customer_email: d.email,
            phone_whatsapp: d.phone,
            selected_service: d.service,
            project_brand: d.project || 'Not specified',
            budget: d.budget || 'To be discussed',
            deadline: d.deadline || 'Flexible',
            project_details: d.details,
            additional_requirements: d.additional || 'None',
            booking_timestamp: timestamp,
            message: emailBody
          })
        });

        if (w3Res.ok) {
          const resData = await w3Res.json();
          if (resData.success === true || resData.success === 'true') {
            emailSuccessful = true;
          }
        }
      } catch (w3Err) {
        console.warn('Web3Forms API error:', w3Err);
      }
    }

    removeTyping();
    bookingState.isSubmitting = false;

    // Strict Rule: Only show success if confirmed by backend/email service
    if (emailSuccessful) {
      bookingState.step = 'BOOKING_COMPLETED';
      const successHtml = `
        <div class="shiva-success-box">
          <strong>✅ आपकी service request successfully submit हो गई है!</strong>
          <span class="shiva-booking-id-tag">Booking ID: ${escapeHtml(d.bookingId)}</span><br>
          आपकी project details Nihar को email के माध्यम से भेज दी गई हैं।<br><br>
          Nihar आपकी requirements review करके आपसे contact करेंगे।<br><br>
          धन्यवाद! 🙏<br>
          <strong>Creator Nihar</strong>
          
          <div class="shiva-contact-links">
            <a href="tel:+917723913729" class="shiva-contact-link shiva-contact-phone">
              📞 Call Nihar
            </a>
            <a href="https://wa.me/917723913729" target="_blank" rel="noopener noreferrer" class="shiva-contact-link shiva-contact-wa">
              💬 WhatsApp Nihar
            </a>
          </div>
        </div>
      `;
      addBotMessage(successHtml);
    } else {
      // Failure state: Do NOT falsely claim email was sent
      // Provide direct Gmail 1-Click + Call + WhatsApp + Retry
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${RECIPIENT_EMAIL}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      const waUrl = `https://wa.me/917723913729?text=${encodeURIComponent('Hello Nihar, I submitted a service booking on your website:\n\n' + emailBody)}`;

      const errorHtml = `
        <div class="shiva-error-box">
          ⚠️ आपकी booking अभी submit नहीं हो पाई। कृपया कुछ समय बाद दोबारा कोशिश करें या सीधे Nihar से संपर्क करें।
          <div class="shiva-contact-links">
            <a href="tel:+917723913729" class="shiva-contact-link shiva-contact-phone">
              📞 Call Nihar
            </a>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="shiva-contact-link shiva-contact-wa">
              💬 WhatsApp Nihar
            </a>
            <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer" class="shiva-contact-link" style="background:#EA4335; color:#ffffff; font-weight:600;">
              ✉️ Send via Gmail
            </a>
          </div>
        </div>
        <div class="shiva-options">
          <button type="button" class="shiva-opt-btn shiva-opt-primary" data-action="confirm_booking">
            🔄 Retry Submission
          </button>
        </div>
      `;
      addBotMessage(errorHtml);
    }
  }

  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'shiva-msg shiva-msg-bot shiva-typing-row';
    typingDiv.id = 'shivaTyping';
    typingDiv.innerHTML = `
      <div class="shiva-msg-avatar">
        <img src="assets/images/favicon-48x48.png" alt="Shiva" onerror="this.src='../assets/images/favicon-48x48.png'">
      </div>
      <div class="shiva-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollMessagesToBottom();
  }

  function removeTyping() {
    const typing = document.getElementById('shivaTyping');
    if (typing) typing.remove();
  }

})();
