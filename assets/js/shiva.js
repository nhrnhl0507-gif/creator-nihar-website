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
          <button type="button" class="shiva-voice-btn" id="shivaVoiceHeaderBtn" title="Live Voice Mode">
            <img src="assets/images/favicon-48x48.png" alt="Voice" class="voice-btn-logo" onerror="this.src='../assets/images/favicon-48x48.png'">
            <span>🎙️ Live Voice</span>
          </button>
          <button type="button" class="shiva-action-btn btn-reset" title="Reset Chat">↺</button>
          <button type="button" class="shiva-action-btn btn-close" title="Close Chat">✕</button>
        </div>
      </div>
      <div class="shiva-messages" id="shivaMessages"></div>
      <div class="shiva-footer">
        <form class="shiva-input-form" id="shivaForm" onsubmit="return false;">
          <button type="button" class="shiva-voice-btn" id="shivaVoiceFooterBtn" title="Live Voice Mode" style="padding: 5px 10px; margin-right: 6px;">
            <img src="assets/images/favicon-48x48.png" alt="Voice" class="voice-btn-logo" onerror="this.src='../assets/images/favicon-48x48.png'">
            <span>🎙️</span>
          </button>
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

    const headerVoiceBtn = document.getElementById('shivaVoiceHeaderBtn');
    if (headerVoiceBtn) headerVoiceBtn.addEventListener('click', startLiveVoiceSession);
    const footerVoiceBtn = document.getElementById('shivaVoiceFooterBtn');
    if (footerVoiceBtn) footerVoiceBtn.addEventListener('click', startLiveVoiceSession);

    // Event delegation for all action buttons inside messagesContainer
    messagesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const text = btn.innerText.trim();
      handleOptionClick(action, text);
    });

    // Initialize Live Voice Mode
    initLiveVoiceMode();

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
        <button type="button" class="shiva-opt-btn shiva-opt-orange" data-action="start_voice">
          🎙️ Live Voice Mode
        </button>
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

    if (action === 'start_voice') {
      startLiveVoiceSession();
      return;
    }

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

  /* ==========================================================================
     CREATOR NIHAR VERIFIED KNOWLEDGE BASE & Q&A ENGINE
     ========================================================================== */
  const CREATOR_NIHAR_KB = [
    {
      id: 'founder_nihar',
      phrases: [
        'who is nihar', 'who is nihar amrawat', 'about nihar', 'founder', 'owner',
        'nihar kon hai', 'nihar kaun hai', 'nihar amrawat kon hai', 'nihar amrawat kaun hai',
        'malik kon hai', 'owner kon hai', 'founder kon hai', 'kiski website hai', 'who owns creator nihar',
        'tell me about nihar', 'tell me about the founder', 'who created this',
        'निहार कौन है', 'निहार अमरावत कौन है', 'फाउंडर कौन है', 'मालिक कौन है', 'वेबसाइट किसकी है'
      ],
      keywords: [
        'nihar', 'amrawat', 'founder', 'owner', 'creator', 'bca', 'ceh', 'ethical hacker',
        'kon hai', 'kaun hai', 'malik', 'kiski', 'निहार', 'अमरावत', 'फाउंडर', 'मालिक'
      ],
      answers: {
        en: `
          <strong>Nihar Amrawat</strong> is the Founder &amp; Owner of Creator Nihar.<br><br>
          • <strong>Role:</strong> Professional AI Video Creator &amp; AI Website Developer<br>
          • <strong>Certification:</strong> Certified Ethical Hacker (CEH)<br>
          • <strong>Age:</strong> 19 years old<br>
          • <strong>Education:</strong> BCA — 2nd Year Student<br>
          • <strong>Location:</strong> Udaipur, Rajasthan, India<br>
          • <strong>Vision:</strong> Build Creator Nihar into a globally recognized leading creative technology brand.<br><br>
          Nihar personally oversees every client project with 100% dedication, personal attention, and zero middlemen.
        `,
        hi: `
          <strong>निहार अमरावत</strong> Creator Nihar के संस्थापक और मालिक (Founder &amp; Owner) हैं।<br><br>
          • <strong>भूमिका:</strong> प्रोफेशनल AI Video Creator और AI Website Developer<br>
          • <strong>प्रमाणपत्र:</strong> Certified Ethical Hacker (CEH)<br>
          • <strong>आयु:</strong> 19 वर्ष<br>
          • <strong>शिक्षा:</strong> BCA — द्वितीय वर्ष (2nd Year) के छात्र<br>
          • <strong>स्थान:</strong> उदयपुर, राजस्थान, भारत<br>
          • <strong>विज़न:</strong> Creator Nihar को वैश्विक स्तर पर एक प्रमुख और प्रतिष्ठित क्रिएटिव टेक्नोलॉजी ब्रांड बनाना।<br><br>
          निहार हर प्रोजेक्ट पर व्यक्तिगत रूप से काम करते हैं, जिससे ग्राहकों को शत-प्रतिशत पारदर्शिता और गुणवत्ता मिलती है।
        `,
        hinglish: `
          <strong>Nihar Amrawat</strong> Creator Nihar ke Founder &amp; Owner hain.<br><br>
          • <strong>Profile:</strong> Professional AI Video Creator &amp; AI Website Developer<br>
          • <strong>Credential:</strong> Certified Ethical Hacker (CEH)<br>
          • <strong>Age:</strong> 19 saal<br>
          • <strong>Education:</strong> BCA — 2nd Year Student<br>
          • <strong>Location:</strong> Udaipur, Rajasthan, India<br>
          • <strong>Vision:</strong> Creator Nihar ko globally recognized leading creative technology brand banana.<br><br>
          Nihar har client project ko personally handle karte hain bina kisi bicholiye ke, 100% dedication ke saath.
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '📞 Contact Nihar', action: 'contact_info' },
        { text: '💰 Pricing Details', action: 'pricing_info' }
      ]
    },
    {
      id: 'brand_creator_nihar',
      phrases: [
        'what is creator nihar', 'about creator nihar', 'creator nihar kya hai', 'ye kya hai',
        'kya company hai', 'agency kya karti hai', 'what do you do', 'what does creator nihar do',
        'brand tagline', 'what is the tagline', 'tagline kya hai',
        'क्रिएटर निहार क्या है', 'यह क्या कंपनी है', 'टैगलाइन क्या है'
      ],
      keywords: [
        'creator nihar', 'agency', 'company', 'brand', 'tagline', 'creative minds', 'digital excellence',
        'kya hai', 'kya kaam', 'क्रिएटर निहार', 'कंपनी', 'एजेंसी'
      ],
      answers: {
        en: `
          <strong>Creator Nihar</strong> is a premier creative technology brand.<br><br>
          • <strong>Tagline:</strong> <em>"Creative Minds. Digital Excellence."</em><br>
          • <strong>Founder:</strong> Nihar Amrawat (Udaipur, Rajasthan)<br>
          • <strong>Core Specializations:</strong><br>
            1. High-impact <strong>AI Video Creation</strong> (₹1,500/video)<br>
            2. High-performance <strong>AI Website Development</strong> (₹20,000/website)<br>
          • <strong>Reach:</strong> Services available to clients across India and globally.
        `,
        hi: `
          <strong>Creator Nihar</strong> एक आधुनिक क्रिएटिव टेक्नोलॉजी एजेंसी है।<br><br>
          • <strong>टैगलाइन:</strong> <em>"Creative Minds. Digital Excellence."</em><br>
          • <strong>फाउंडर:</strong> निहार अमरावत (उदयपुर, राजस्थान)<br>
          • <strong>मुख्य सेवाएं:</strong><br>
            1. <strong>AI Video Creation:</strong> ₹1,500 / वीडियो<br>
            2. <strong>AI Website Development:</strong> ₹20,000 / वेबसाइट<br>
          • <strong>सेवा क्षेत्र:</strong> पूरे भारत और अंतरराष्ट्रीय स्तर पर क्लाइंट्स के लिए उपलब्ध।
        `,
        hinglish: `
          <strong>Creator Nihar</strong> ek modern creative technology brand hai.<br><br>
          • <strong>Tagline:</strong> <em>"Creative Minds. Digital Excellence."</em><br>
          • <strong>Founder:</strong> Nihar Amrawat (Udaipur, Rajasthan)<br>
          • <strong>Core Services:</strong><br>
            1. High-impact <strong>AI Video Creation</strong> (₹1,500/video)<br>
            2. Modern <strong>Website Development</strong> (₹20,000/website)<br>
          • <strong>Reach:</strong> Pure India aur worldwide clients ke liye available.
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '🎥 AI Video Info', action: 'ai_video_info' },
        { text: '💻 Website Info', action: 'web_creation_info' }
      ]
    },
    {
      id: 'pricing_details',
      phrases: [
        'pricing', 'price', 'rates', 'cost', 'charges', 'how much', 'fee', 'fees',
        'kitna lagega', 'kitne me banega', 'paisa', 'paise', 'kharch', 'kitna kharcha', 'rate kya hai',
        'video ka price', 'website ka price', 'video kitne ki hai', 'website kitne ki hai',
        'प्राइस', 'रेट', 'खर्च', 'कीमत', 'कितना लगेगा', 'कितने पैसे लगेंगे'
      ],
      keywords: [
        'price', 'pricing', 'rate', 'rates', 'cost', 'costs', 'fee', 'fees', 'charge', 'charges',
        'kitna', 'kitne', 'paisa', 'paise', 'kharch', 'kharcha', 'rupaye', '1500', '20000', 'budget',
        'कीमत', 'रेट', 'खर्च', 'पैसे'
      ],
      answers: {
        en: `
          <strong>Creator Nihar Official Transparent Pricing:</strong><br><br>
          1. <strong>AI Video Creation:</strong> ₹1,500 / video<br>
          2. <strong>Website Creation:</strong> ₹20,000 / website<br>
          3. <strong>Both Services:</strong> Can be booked together as a combined package<br><br>
          <em>Note: Final pricing may vary for highly customized requirements. Zero hidden charges.</em>
        `,
        hi: `
          <strong>Creator Nihar की आधिकारिक और पारदर्शी कीमतें (Pricing):</strong><br><br>
          1. <strong>AI Video Creation:</strong> ₹1,500 / वीडियो<br>
          2. <strong>Website Creation:</strong> ₹20,000 / वेबसाइट<br>
          3. <strong>दोनों सेवाएं (Both):</strong> एक साथ भी बुक की जा सकती हैं<br><br>
          <em>नोट: अत्यधिक कस्टमाइज़्ड आवश्यकताओं के लिए अंतिम कीमत भिन्न हो सकती है। कोई छुपा हुआ शुल्क नहीं।</em>
        `,
        hinglish: `
          <strong>Creator Nihar Official Transparent Pricing:</strong><br><br>
          1. <strong>AI Video Creation:</strong> ₹1,500 / video<br>
          2. <strong>Website Creation:</strong> ₹20,000 / website<br>
          3. <strong>Both Services:</strong> Dono ek saath bhi book kar sakte hain<br><br>
          <em>Note: Highly customized requirements ke liye final pricing vary ho sakti hai. Zero hidden charges.</em>
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '🎥 AI Video (₹1,500)', action: 'ai_video_info' },
        { text: '💻 Website (₹20,000)', action: 'web_creation_info' }
      ]
    },
    {
      id: 'ai_video_service',
      phrases: [
        'ai video', 'video creation', 'video service', 'video editing', 'reels', 'shorts',
        'video kaise banegi', 'video me kya milega', 'video service details', 'promotional video',
        'story video', 'brand video', 'product video', 'social media video',
        'वीडियो', 'रील्स', 'शॉर्ट्स', 'वीडियो सर्विस', 'वीडियो कैसे बनती है'
      ],
      keywords: [
        'video', 'videos', 'ai video', 'reels', 'shorts', 'promo', 'storyboard', 'script', 'visuals',
        'वीडियो', 'रील्स', 'शॉर्ट्स'
      ],
      answers: {
        en: `
          <strong>AI Video Creation — ₹1,500/video</strong><br><br>
          • <strong>What is included:</strong><br>
            - AI-generated video creation with high-impact visuals<br>
            - Creative concept &amp; script development<br>
            - Story-based videos &amp; brand storytelling<br>
            - Product &amp; brand promotional videos<br>
            - Social media videos (Instagram Reels &amp; YouTube Shorts)<br>
            - Custom video requirements tailored to your brand<br>
            - Fast turnaround time<br><br>
          Price: <strong>₹1,500 per video</strong>.
        `,
        hi: `
          <strong>AI Video Creation — ₹1,500/वीडियो</strong><br><br>
          • <strong>सर्विस में क्या शामिल है:</strong><br>
            - AI-जनरेटेड वीडियो और हाई-इम्पैक्ट विज़ुअल्स<br>
            - क्रिएटिव कॉन्सेप्ट और स्क्रिप्ट राइटिंग<br>
            - स्टोरी-बेस्ड वीडियो और ब्रांड स्टोरीटेलिंग<br>
            - प्रोडक्ट और ब्रांड प्रमोशनल वीडियो<br>
            - सोशल मीडिया वीडियो (Instagram Reels और YouTube Shorts)<br>
            - आपके ब्रांड के अनुसार कस्टम वीडियो आवश्यकताएं<br>
            - तेज़ डिलीवरी (Fast turnaround)<br><br>
          कीमत: <strong>₹1,500 प्रति वीडियो</strong>।
        `,
        hinglish: `
          <strong>AI Video Creation — ₹1,500/video</strong><br><br>
          • <strong>Service me kya shamil hai:</strong><br>
            - AI-generated visuals aur creative video creation<br>
            - Creative concepts aur script development<br>
            - Story-based videos aur brand storytelling<br>
            - Product aur brand promotional videos<br>
            - Instagram Reels &amp; YouTube Shorts<br>
            - Custom brand requirements ke anusaar video<br>
            - Fast turnaround delivery<br><br>
          Price: <strong>₹1,500 per video</strong>.
        `
      },
      buttons: [
        { text: '📋 AI Video Book करें (₹1,500)', action: 'start_booking', primary: true },
        { text: '💰 Pricing Details', action: 'pricing_info' },
        { text: '📞 Contact Nihar', action: 'contact_info' }
      ]
    },
    {
      id: 'website_creation_service',
      phrases: [
        'website', 'website creation', 'website development', 'web design', 'landing page',
        'portfolio website', 'business website', 'website kaise banegi', 'website me kya milega',
        'web service details', 'website features', 'responsive website',
        'वेबसाइट', 'वेब डेवलपमेंट', 'वेब डिज़ाइन', 'वेबसाइट कैसे बनेगी', 'वेबसाइट में क्या मिलेगा'
      ],
      keywords: [
        'website', 'web', 'landing page', 'portfolio', 'business website', 'responsive', 'ui/ux',
        'seo', 'forms', 'whatsapp', 'वेबसाइट', 'वेब'
      ],
      answers: {
        en: `
          <strong>Website Creation — ₹20,000/website</strong><br><br>
          • <strong>Verified Features:</strong><br>
            - Modern UI/UX custom design<br>
            - 100% responsive across mobile, tablet &amp; desktop<br>
            - Professional landing pages &amp; business websites<br>
            - Portfolio websites for creators &amp; professionals<br>
            - Contact &amp; lead capture forms<br>
            - WhatsApp integration &amp; custom branding<br>
            - Clean code, fast loading speed &amp; SEO-ready<br><br>
          Price: <strong>₹20,000 per website</strong>.
        `,
        hi: `
          <strong>Website Creation — ₹20,000/वेबसाइट</strong><br><br>
          • <strong>मुख्य विशेषताएं:</strong><br>
            - मॉडर्न UI/UX कस्टम डिज़ाइन<br>
            - मोबाइल, टैबलेट और डेस्कटॉप पर 100% रेस्पॉन्सिव<br>
            - प्रोफेशनल लैंडिंग पेज और बिज़नेस वेबसाइट्स<br>
            - क्रिएटर्स और प्रोफेशनल्स के लिए पोर्टफोलियो वेबसाइट्स<br>
            - कांटेक्ट और लीड कैप्चर फॉर्म्स<br>
            - व्हाट्सएप इंटीग्रेशन और कस्टम ब्रांडिंग<br>
            - क्लीन कोड, तेज़ लोडिंग स्पीड और SEO-रेडी<br><br>
          कीमत: <strong>₹20,000 प्रति वेबसाइट</strong>।
        `,
        hinglish: `
          <strong>Website Creation — ₹20,000/website</strong><br><br>
          • <strong>Key Features:</strong><br>
            - Modern UI/UX custom design<br>
            - Mobile, tablet aur desktop pe 100% responsive<br>
            - Professional landing pages &amp; business websites<br>
            - Portfolio websites for creators &amp; professionals<br>
            - Contact &amp; lead capture forms<br>
            - WhatsApp integration &amp; custom branding<br>
            - Clean code, fast loading speed &amp; SEO-ready<br><br>
          Price: <strong>₹20,000 per website</strong>.
        `
      },
      buttons: [
        { text: '📋 Website Book करें (₹20,000)', action: 'start_booking', primary: true },
        { text: '💰 Pricing Details', action: 'pricing_info' },
        { text: '📞 Contact Nihar', action: 'contact_info' }
      ]
    },
    {
      id: 'process_workflow',
      phrases: [
        'process', 'workflow', 'steps', 'how do you work', 'kaise kaam karte ho',
        'what is the process', 'how it works', 'working process', 'procedure',
        'kaise shuru kare', 'kaise banega', 'step by step',
        'काम कैसे होता है', 'प्रक्रिया क्या है', 'तरीका क्या है', 'स्टेप्स'
      ],
      keywords: [
        'process', 'workflow', 'step', 'steps', 'brief', 'strategy', 'draft', 'review', 'refinement', 'delivery',
        'kaise', 'tarika', 'प्रक्रिया', 'तरीका', 'स्टेप्स'
      ],
      answers: {
        en: `
          <strong>Creator Nihar Verified 4-Step Process:</strong><br><br>
          1. <strong>Consultation &amp; Brief:</strong> We understand your vision, goals, and specific project requirements.<br>
          2. <strong>AI Strategy &amp; Draft:</strong> We create the concept, script/storyboard for videos, or website architecture &amp; UI design.<br>
          3. <strong>Review &amp; Refinement:</strong> We share the draft, incorporate your feedback, and refine the details.<br>
          4. <strong>Final Delivery &amp; Launch:</strong> We deliver high-definition video assets or deploy your live website.
        `,
        hi: `
          <strong>Creator Nihar की 4-चरणीय कार्य प्रक्रिया (4-Step Process):</strong><br><br>
          1. <strong>Consultation &amp; Brief:</strong> हम आपके विज़न, लक्ष्यों और प्रोजेक्ट की प्राथमिकताओं को समझते हैं।<br>
          2. <strong>AI Strategy &amp; Draft:</strong> वीडियो का कॉन्सेप्ट/स्क्रिप्ट या वेबसाइट का आर्किटेक्चर और ड्राफ्ट डिज़ाइन तैयार किया जाता है।<br>
          3. <strong>Review &amp; Refinement:</strong> आपके फीडबैक के आधार पर आवश्यक सुधार और फाइन-ट्यूनिंग की जाती है।<br>
          4. <strong>Final Delivery &amp; Launch:</strong> फाइनल HD वीडियो की डिलीवरी या लाइव वेबसाइट का सफल डिप्लॉयमेंट किया जाता है।
        `,
        hinglish: `
          <strong>Creator Nihar 4-Step Working Process:</strong><br><br>
          1. <strong>Consultation &amp; Brief:</strong> Aapke vision, goals aur project requirements ko samajhna.<br>
          2. <strong>AI Strategy &amp; Draft:</strong> Video concept/script ya website UI architecture tayyar karna.<br>
          3. <strong>Review &amp; Refinement:</strong> Aapke feedback ke hisaab se refine aur polish karna.<br>
          4. <strong>Final Delivery &amp; Launch:</strong> Final HD video delivery ya live website launch karna.
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '📞 Contact Nihar', action: 'contact_info' }
      ]
    },
    {
      id: 'consultation',
      phrases: [
        'consultation', 'free consultation', 'zoom', 'meeting', 'free meeting',
        'free consultation kya hai', 'zoom meeting kaise hogi', 'zoom link',
        'meeting kaise book kare', 'free call', 'discuss project',
        'फ्री कंसल्टेशन', 'ज़ूम मीटिंग', 'मीटिंग कैसे होगी', 'कंसल्टेशन'
      ],
      keywords: [
        'consultation', 'free consultation', 'zoom', 'meeting', 'call', 'discuss',
        'फ्री', 'कंसल्टेशन', 'मीटिंग', 'ज़ूम'
      ],
      answers: {
        en: `
          <strong>Free 1-on-1 Zoom Consultation:</strong><br><br>
          • <strong>What it is:</strong> A 100% Free consultation to discuss your project ideas, AI video requirements, website goals, and pricing.<br>
          • <strong>How to request:</strong> Visit the <a href="free-consultation.html">Free Consultation Page</a> and submit your brief.<br><br>
          <em>Important: The meeting is personally confirmed by Nihar Amrawat after reviewing your request. We do not generate automatic Zoom links.</em>
        `,
        hi: `
          <strong>फ्री 1-on-1 Zoom Consultation:</strong><br><br>
          • <strong>यह क्या है:</strong> आपके प्रोजेक्ट आइडिया, AI वीडियो या वेबसाइट की आवश्यकताओं पर चर्चा करने के लिए 100% फ्री कंसल्टेशन।<br>
          • <strong>कैसे बुक करें:</strong> <a href="free-consultation.html">Free Consultation पेज</a> पर जाकर अपना फॉर्म भरें।<br><br>
          <em>महत्वपूर्ण नोट: मीटिंग को निहार अमरावत स्वयं आपकी रिक्वेस्ट देखकर कन्फर्म करते हैं। कोई ऑटोमैटिक ज़ूम लिंक जारी नहीं होता है।</em>
        `,
        hinglish: `
          <strong>Free 1-on-1 Zoom Consultation:</strong><br><br>
          • <strong>Details:</strong> 100% Free 1-on-1 session jisme hum aapke project ideas, AI video requirements, aur website pricing discuss karte hain.<br>
          • <strong>Kaise book kare:</strong> <a href="free-consultation.html">Free Consultation page</a> par jaakar form submit karein.<br><br>
          <em>Note: Nihar Amrawat personally review karke meeting confirm karte hain. Koi automatic Zoom link generate nahi hota.</em>
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '📞 Contact Nihar', action: 'contact_info' }
      ]
    },
    {
      id: 'contact_details',
      phrases: [
        'contact', 'how to contact', 'phone', 'call', 'whatsapp', 'email', 'mobile',
        'contact number', 'phone number', 'whatsapp number', 'email id',
        'kaise contact kare', 'baat kaise kare', 'sampark', 'sampark kaise kare', 'number kya hai',
        'संपर्क', 'फ़ोन नंबर', 'व्हाट्सएप नंबर', 'ईमेल', 'कॉल कैसे करें'
      ],
      keywords: [
        'contact', 'phone', 'call', 'whatsapp', 'email', 'number', 'mobile',
        'sampark', 'baat', 'संपर्क', 'फ़ोन', 'व्हाट्सएप', 'ईमेल', 'नंबर'
      ],
      answers: {
        en: `
          <strong>Creator Nihar Official Contact Details:</strong><br><br>
          • 📞 <strong>Phone:</strong> <a href="tel:+917723913729">+91 7723913729</a><br>
          • 💬 <strong>WhatsApp:</strong> <a href="https://wa.me/917723913729" target="_blank" rel="noopener noreferrer">+91 7723913729</a><br>
          • 📧 <strong>Email:</strong> <a href="mailto:nhrnhl0507@gmail.com">nhrnhl0507@gmail.com</a><br>
          • 🌐 <strong>Website:</strong> <a href="https://creatornihar.co.in/">creatornihar.co.in</a><br>
          • 📍 <strong>Location:</strong> Udaipur, Rajasthan, India
        `,
        hi: `
          <strong>Creator Nihar सीधा संपर्क विवरण (Contact Details):</strong><br><br>
          • 📞 <strong>फ़ोन:</strong> <a href="tel:+917723913729">+91 7723913729</a><br>
          • 💬 <strong>व्हाट्सएप:</strong> <a href="https://wa.me/917723913729" target="_blank" rel="noopener noreferrer">+91 7723913729</a><br>
          • 📧 <strong>ईमेल:</strong> <a href="mailto:nhrnhl0507@gmail.com">nhrnhl0507@gmail.com</a><br>
          • 🌐 <strong>वेबसाइट:</strong> <a href="https://creatornihar.co.in/">creatornihar.co.in</a><br>
          • 📍 <strong>स्थान:</strong> उदयपुर, राजस्थान, भारत
        `,
        hinglish: `
          <strong>Creator Nihar Direct Contact Details:</strong><br><br>
          • 📞 <strong>Phone:</strong> <a href="tel:+917723913729">+91 7723913729</a><br>
          • 💬 <strong>WhatsApp:</strong> <a href="https://wa.me/917723913729" target="_blank" rel="noopener noreferrer">+91 7723913729</a><br>
          • 📧 <strong>Email:</strong> <a href="mailto:nhrnhl0507@gmail.com">nhrnhl0507@gmail.com</a><br>
          • 🌐 <strong>Website:</strong> <a href="https://creatornihar.co.in/">creatornihar.co.in</a><br>
          • 📍 <strong>Location:</strong> Udaipur, Rajasthan, India
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '💰 Pricing Details', action: 'pricing_info' }
      ]
    },
    {
      id: 'location_reach',
      phrases: [
        'location', 'where are you located', 'where is creator nihar', 'city', 'office', 'address',
        'kaha ho', 'kaha rehte ho', 'kaha se ho', 'kaha par hai', 'udaipur', 'rajasthan',
        'dusre shahar me kaam karte ho', 'global', 'international',
        'कहाँ हो', 'कहाँ से हो', 'लोकेशन', 'पता', 'उदयपुर', 'राजस्थान'
      ],
      keywords: [
        'location', 'where', 'city', 'office', 'address', 'udaipur', 'rajasthan', 'india', 'global',
        'kaha', 'kahan', 'rehte', 'कहाँ', 'लोकेशन', 'उदयपुर', 'राजस्थान'
      ],
      answers: {
        en: `
          <strong>Location &amp; Service Availability:</strong><br><br>
          • <strong>Location:</strong> Creator Nihar is based in <strong>Udaipur, Rajasthan, India</strong>.<br>
          • <strong>Service Coverage:</strong> Available to clients across <strong>all of India and globally</strong> via remote online collaboration.<br><br>
          No matter where you are located, we deliver AI videos and modern websites seamlessly.
        `,
        hi: `
          <strong>स्थान और सेवा क्षेत्र (Location &amp; Reach):</strong><br><br>
          • <strong>स्थान:</strong> Creator Nihar <strong>उदयपुर, राजस्थान, भारत</strong> में स्थित है।<br>
          • <strong>सेवा क्षेत्र:</strong> हमारी सेवाएं <strong>पूरे भारत और वैश्विक स्तर पर (Globally)</strong> उपलब्ध हैं।<br><br>
          आप चाहे भारत के किसी भी शहर में हों या विदेश में, हम ऑनलाइन माध्यम से पूरी गुणवत्ता के साथ AI वीडियो और वेबसाइट्स तैयार करते हैं।
        `,
        hinglish: `
          <strong>Location &amp; Service Availability:</strong><br><br>
          • <strong>Location:</strong> Creator Nihar <strong>Udaipur, Rajasthan, India</strong> me based hai.<br>
          • <strong>Service Reach:</strong> Pure <strong>India aur Globally</strong> clients ke liye services available hain.<br><br>
          Aap chahe kisi bhi city ya country me ho, hum seamlessly online collaborate karke AI videos aur websites deliver karte hain.
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '📞 Contact Nihar', action: 'contact_info' }
      ]
    },
    {
      id: 'both_services',
      phrases: [
        'both services', 'dono service', 'combo', 'package', 'both video and website',
        'dono karwana hai', 'dono chahiye', 'video aur website dono',
        'दोनों सेवाएं', 'कॉम्बो पैकेज'
      ],
      keywords: [
        'both', 'dono', 'combo', 'package', 'together', 'दोनों'
      ],
      answers: {
        en: `
          <strong>Combined Digital Package (Both Services):</strong><br><br>
          You can book both <strong>AI Video Creation</strong> (₹1,500/video) and <strong>Website Creation</strong> (₹20,000/website) together.<br><br>
          This provides a comprehensive digital footprint for your brand: high-impact AI video marketing for social media + a high-performance modern website.
        `,
        hi: `
          <strong>कंबाइंड पैकेज (दोनों सेवाएं):</strong><br><br>
          आप <strong>AI Video Creation</strong> (₹1,500/वीडियो) और <strong>Website Creation</strong> (₹20,000/वेबसाइट) दोनों सेवाएं एक साथ बुक कर सकते हैं।<br><br>
          यह आपके ब्रांड को संपूर्ण डिजिटल उपस्थिति देता है: सोशल मीडिया के लिए प्रभावशाली AI वीडियो मार्केटिंग + एक उच्च-प्रदर्शन वाली आधुनिक वेबसाइट।
        `,
        hinglish: `
          <strong>Combined Package (Both Services):</strong><br><br>
          Aap <strong>AI Video Creation</strong> (₹1,500/video) aur <strong>Website Creation</strong> (₹20,000/website) dono ek saath book kar sakte hain.<br><br>
          Isse aapke brand ko complete digital solution milta hai: social media ke liye powerful AI videos + high-performance modern website.
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '💰 Pricing Details', action: 'pricing_info' }
      ]
    },
    {
      id: 'greetings',
      phrases: [
        'hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening', 'good afternoon',
        'kaise ho', 'how are you', 'kya haal hai', 'sup',
        'नमस्ते', 'हेलो', 'नमस्कार', 'हाय', 'कैसे हो'
      ],
      keywords: [
        'hi', 'hello', 'hey', 'namaste', 'namaskar', 'नमस्ते', 'हेलो', 'नमस्कार'
      ],
      answers: {
        en: `
          Hello! 🙏 I am <strong>Shiva</strong>, the official AI Assistant of Creator Nihar.<br><br>
          How can I assist you today? You can ask me anything about Creator Nihar, our founder Nihar Amrawat, services (AI Video ₹1,500 / Website ₹20,000), pricing, workflow, or book a service directly below:
        `,
        hi: `
          नमस्ते! 🙏 मैं <strong>Shiva</strong>, Creator Nihar का आधिकारिक AI Assistant हूँ।<br><br>
          मैं आपकी क्या मदद कर सकता हूँ? आप मुझसे Creator Nihar, हमारे फाउंडर निहार अमरावत, हमारी सेवाओं (AI Video ₹1,500 / Website ₹20,000), कीमतों, कार्य प्रक्रिया के बारे में कुछ भी पूछ सकते हैं या सीधे नीचे से सर्विस बुक कर सकते हैं:
        `,
        hinglish: `
          Namaste! 🙏 Main <strong>Shiva</strong>, Creator Nihar ka official AI Assistant hoon.<br><br>
          Main aapki kya madad kar sakta hoon? Aap mujhse Creator Nihar, Founder Nihar Amrawat, services (AI Video ₹1,500 / Website ₹20,000), pricing, ya process ke baare mein kuch bhi pooch sakte hain:
        `
      },
      buttons: [
        { text: '📋 Service Book करें', action: 'start_booking', primary: true },
        { text: '🎥 AI Video (₹1,500)', action: 'ai_video_info' },
        { text: '💻 Website (₹20,000)', action: 'web_creation_info' },
        { text: '💰 Pricing Details', action: 'pricing_info' },
        { text: '📞 Contact Nihar', action: 'contact_info' }
      ]
    }
  ];

  /* ==========================================================================
     CONVERSATIONAL CONTEXT & INTELLIGENCE ENGINE 🧠
     ========================================================================== */
  const conversationContext = {
    lastEntity: null,       // 'nihar' | 'brand' | 'website' | 'website_service' | 'video_service'
    lastTopic: null,
    lastQuestion: '',
    lastLanguage: 'hinglish'
  };

  const INTERRUPTION_PHRASES = [
    'रुक जाओ', 'रुको', 'बस', 'चुप हो जाओ', 'चुप रहो', 'चुप', 'बस करो', 'सुनो',
    'ruk jao', 'ruko', 'bas', 'chup', 'chup ho jao', 'bas karo', 'suno', 'sunno',
    'stop', 'wait', 'pause', 'hold on', 'quiet', 'shut up'
  ];

  function detectLanguage(text) {
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }
    const lower = text.toLowerCase();
    const hinglishMarkers = [
      'kya', 'hai', 'kaise', 'kitna', 'kitne', 'kaha', 'kahan', 'kon', 'kaun', 'batao',
      'btao', 'karo', 'hoga', 'karna', 'chahiye', 'mera', 'meri', 'mujhe', 'aap', 'tum',
      'paisa', 'paise', 'kharcha', 'rupaye', 'bhi', 'se', 'ho', 'h', 'banwani', 'banani'
    ];
    const words = lower.replace(/[?,.!;:'"()]/g, ' ').split(/\s+/);
    for (const w of words) {
      if (hinglishMarkers.includes(w)) {
        return 'hinglish';
      }
    }
    return 'en';
  }

  function isExplicitBookingIntent(text) {
    const lower = text.toLowerCase();

    // Informational inquiries must NEVER trigger booking
    const informationalPhrases = [
      'kya karti hai', 'kya karta hai', 'kaisi hai', 'kaisa hai',
      'kya hai', 'what is', 'what does', 'how does', 'tell me about',
      'kitne ki', 'kitna kharcha', 'kitne ka', 'price kya', 'cost kya',
      'kaise ho', 'kya kar rahe'
    ];
    if (informationalPhrases.some(p => lower.includes(p)) &&
        !lower.includes('banwani') && !lower.includes('banani') && !lower.includes('book karni')) {
      return false;
    }

    const bookingPatterns = [
      'mujhe website banwani', 'website banwani hai', 'website banani hai', 'website banwana hai', 'website banaye',
      'mujhe video banwani', 'video banwani hai', 'video banani hai', 'video banwana hai', 'ai video banwana',
      'service book karni', 'service book karna', 'booking karni hai', 'booking karna hai', 'service leni hai',
      'website order karni', 'video order karni', 'kaam karwana hai', 'project shuru karna',
      'i want to book', 'i want to order', 'i want a website', 'i want a video', 'i want to hire',
      'book a service', 'book website', 'book video', 'book now'
    ];
    return bookingPatterns.some(pat => lower.includes(pat));
  }

  function processConversationalQuery(rawText) {
    const text = rawText.trim();
    const lower = text.toLowerCase();
    const lang = detectLanguage(text);
    conversationContext.lastLanguage = lang;
    conversationContext.lastQuestion = text;

    const cleaned = lower.replace(/[?,.!;:'"()]/g, ' ').trim();
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);

    // 1. Explicit Service Booking Intent -> Launch Booking Flow
    if (isExplicitBookingIntent(text)) {
      let confirmSpeech = '';
      if (lang === 'en') {
        confirmSpeech = "Great! Let's start your service booking.";
      } else {
        confirmSpeech = "बहुत बढ़िया! आइए आपकी बुकिंग शुरू करते हैं।";
      }
      return {
        type: 'BOOKING',
        spokenText: confirmSpeech,
        displayText: confirmSpeech,
        lang: lang
      };
    }

    // 2. Interruption Keywords (Standalone)
    if (INTERRUPTION_PHRASES.some(phrase => cleaned === phrase || (cleaned.startsWith(phrase) && words.length <= 3))) {
      return {
        type: 'INTERRUPT',
        spokenText: '',
        displayText: '⏸️ रुका हुआ (Listening...)',
        lang: lang
      };
    }

    // 3. Normal Human Casual Conversation (Small Talk)
    // 3A. Greeting
    const greetingWords = ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'नमस्ते', 'हेलो', 'नमस्कार', 'हाय'];
    const isOnlyGreeting = words.length <= 3 && words.some(w => greetingWords.includes(w));
    if (isOnlyGreeting && !words.includes('kaise') && !words.includes('how')) {
      let speech = '';
      if (lang === 'hi') {
        speech = "नमस्ते! 🙏 मैं Shiva हूँ, Creator Nihar का AI Assistant। मैं आपकी क्या मदद कर सकता हूँ?";
      } else if (lang === 'en') {
        speech = "Hello! 🙏 I am Shiva, Creator Nihar's AI Assistant. How can I assist you today?";
      } else {
        speech = "Namaste! 🙏 Main Shiva hoon, Creator Nihar ka AI Assistant. Main aapki kya madad kar sakta hoon?";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '💰 Pricing Details', action: 'pricing_info' }
        ],
        lang: lang
      };
    }

    // 3B. Wellbeing: "Kaise ho?", "How are you?"
    if (cleaned.includes('kaise ho') || cleaned.includes('how are you') || cleaned.includes('kya haal hai') || cleaned.includes('aap kaise hain') || cleaned.includes('कैसे हो')) {
      let speech = '';
      if (lang === 'hi') {
        speech = "मैं बिल्कुल तैयार हूँ आपकी मदद करने के लिए! 😊 आप क्या पूछना चाहेंगे?";
      } else if (lang === 'en') {
        speech = "I am doing great and ready to help you! 😊 What would you like to know?";
      } else {
        speech = "Main bilkul ready hoon aapki help karne ke liye! 😊 Aap kya poochna chahenge?";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '💰 Pricing Details', action: 'pricing_info' }
        ],
        lang: lang
      };
    }

    // 3C. Gratitude: "Thank you", "Dhanyawad", "Shukriya"
    if (cleaned.includes('thank you') || cleaned.includes('thanks') || cleaned.includes('dhanyawad') || cleaned.includes('shukriya') || cleaned.includes('धन्यवाद') || cleaned.includes('शुक्रिया')) {
      let speech = '';
      if (lang === 'hi') {
        speech = "आपका स्वागत है! 😊 अगर आपको कोई और जानकारी चाहिए तो अवश्य बताएं।";
      } else if (lang === 'en') {
        speech = "You're welcome! 😊 Let me know if you need any further information.";
      } else {
        speech = "You're welcome! 😊 Agar aapko aur koi jaankari chahiye toh zaroor bataiye.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true }
        ],
        lang: lang
      };
    }

    // 3D. Compliment: "Bahut achha", "Very good", "Badhiya", "Awesome", "Great"
    if (cleaned.includes('bahut achha') || cleaned.includes('bahut badiya') || cleaned.includes('very good') || cleaned.includes('shandar') || cleaned.includes('बहुत अच्छा') || cleaned.includes('बढ़िया')) {
      let speech = '';
      if (lang === 'hi') {
        speech = "धन्यवाद! 😊 मैं आपकी और क्या मदद कर सकता हूँ?";
      } else if (lang === 'en') {
        speech = "Thank you! 😊 How else can I assist you?";
      } else {
        speech = "Shukriya! 😊 Main aapki aur kya help kar sakta hoon?";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true }
        ],
        lang: lang
      };
    }

    // 3E. Prompt to speak: "Ek baat batao", "Can I ask something", "Sunno"
    if (cleaned.includes('ek baat batao') || cleaned.includes('ek sawal') || cleaned.includes('can i ask') || cleaned.includes('एक बात बताओ')) {
      let speech = '';
      if (lang === 'hi') {
        speech = "बिल्कुल, पूछिए। मैं सुन रहा हूँ।";
      } else if (lang === 'en') {
        speech = "Sure, please ask. I am listening.";
      } else {
        speech = "Bilkul, poochhiye. Main sun raha hoon.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: null,
        lang: lang
      };
    }

    // 3F. Activity: "Kya kar rahe ho?", "What are you doing?"
    if (cleaned.includes('kya kar rahe') || cleaned.includes('what are you doing') || cleaned.includes('क्या कर रहे हो')) {
      let speech = '';
      if (lang === 'hi') {
        speech = "मैं आपसे बात कर रहा हूँ और Creator Nihar के बारे में जानकारी देने या आपकी मदद करने के लिए तैयार हूँ।";
      } else if (lang === 'en') {
        speech = "I am speaking with you and ready to assist you or provide information about Creator Nihar.";
      } else {
        speech = "Main aapse baat kar raha hoon aur Creator Nihar ke baare mein information dene ya aapki help karne ke liye ready hoon.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true }
        ],
        lang: lang
      };
    }

    // 4. Context Follow-up Questions
    // 4A. "Nihar ki company ka naam kya hai?" / "Uski company ka naam kya hai?"
    if (cleaned.includes('company ka naam') || cleaned.includes('uski company') || cleaned.includes('nihar ki company') || 
        ((conversationContext.lastEntity === 'nihar') && (cleaned.includes('company') || cleaned.includes('brand')))) {
      conversationContext.lastEntity = 'brand';
      let speech = '';
      if (lang === 'hi') {
        speech = "उनकी company/brand का नाम Creator Nihar है।";
      } else if (lang === 'en') {
        speech = "His company and brand name is Creator Nihar.";
      } else {
        speech = "Unki company/brand ka naam Creator Nihar hai.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '💰 Pricing Details', action: 'pricing_info' }
        ],
        lang: lang
      };
    }

    // 4B. "Isme website bhi banti hai?" / "Isme kya banta hai?" (following brand context)
    if ((conversationContext.lastEntity === 'brand' || cleaned.includes('isme website')) && 
        (cleaned.includes('website bhi banti') || cleaned.includes('website banti hai') || cleaned.includes('isme website'))) {
      conversationContext.lastEntity = 'website_service';
      let speech = '';
      if (lang === 'hi') {
        speech = "जी हाँ, Creator Nihar पर professional website creation service available है। Website creation की listed price ₹20,000 है।";
      } else if (lang === 'en') {
        speech = "Yes, professional website creation service is available at Creator Nihar. The listed price for website creation is ₹20,000.";
      } else {
        speech = "Ji haan, Creator Nihar par professional website creation service available hai. Website creation ki listed price ₹20,000 hai.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '💻 Website Details', action: 'web_creation_info' }
        ],
        lang: lang
      };
    }

    // 5. Entity A: Nihar Amrawat (Founder / Owner)
    const niharPatterns = [
      'nihar amrawat kaun hai', 'nihar kaun hai', 'who is nihar amrawat', 'who is nihar', 'about nihar',
      'nihar kon hai', 'nihar amrawat kon hai', 'founder kaun hai', 'founder kon hai', 'owner kaun hai',
      'owner kon hai', 'malik kaun hai', 'who is the founder', 'who is the owner', 'who owns creator nihar',
      'निहार अमरावत कौन है', 'निहार कौन है', 'फाउंडर कौन है', 'मालिक कौन है'
    ];
    if (niharPatterns.some(p => cleaned.includes(p)) || 
        ((cleaned.includes('nihar') || cleaned.includes('founder') || cleaned.includes('owner')) && 
         (cleaned.includes('kaun') || cleaned.includes('kon') || cleaned.includes('who') || cleaned.includes('kiski') || cleaned.includes('about')) &&
         !cleaned.includes('company') && !cleaned.includes('brand') && !cleaned.includes('website'))) {
      conversationContext.lastEntity = 'nihar';
      let speech = '';
      if (lang === 'hi') {
        speech = "निहार अमरावत Creator Nihar के Founder & Owner हैं। वह प्रोफेशनल AI Video Creator और AI Website Developer हैं, Certified Ethical Hacker हैं, और BCA second year के स्टूडेंट हैं। वह उदयपुर, राजस्थान, भारत से हैं।";
      } else if (lang === 'en') {
        speech = "Nihar Amrawat is the Founder & Owner of Creator Nihar. He is a professional AI Video Creator and AI Website Developer, a Certified Ethical Hacker, and a 2nd-year BCA student from Udaipur, Rajasthan, India.";
      } else {
        speech = "Nihar Amrawat Creator Nihar ke Founder & Owner hain. Woh professional AI Video Creator aur AI Website Developer hain, Certified Ethical Hacker hain, aur BCA second year ke student hain. Woh Udaipur, Rajasthan, India se hain.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📞 Contact Nihar', action: 'contact_info' },
          { text: '📋 Service Book करें', action: 'start_booking', primary: true }
        ],
        lang: lang
      };
    }

    // 6. Entity B: Creator Nihar (Brand / Business / Platform)
    const brandPatterns = [
      'creator nihar kya hai', 'what is creator nihar', 'creator nihar ke baare mein batao',
      'tell me about creator nihar', 'about creator nihar', 'creator nihar brand',
      'क्रिएटर निहार क्या है', 'क्रिएटर निहार के बारे में बताओ'
    ];
    if (brandPatterns.some(p => cleaned.includes(p)) || 
        (cleaned.includes('creator nihar') && (cleaned.includes('kya hai') || cleaned.includes('what is')) && !cleaned.includes('website'))) {
      conversationContext.lastEntity = 'brand';
      let speech = '';
      if (lang === 'hi') {
        speech = "Creator Nihar एक AI-focused creative technology brand है जो AI Video Creation और AI Website Development services provide करता है। इसका tagline है 'Creative Minds. Digital Excellence.'";
      } else if (lang === 'en') {
        speech = "Creator Nihar is an AI-focused creative technology brand providing AI Video Creation and AI Website Development services. Its tagline is 'Creative Minds. Digital Excellence.'";
      } else {
        speech = "Creator Nihar ek AI-focused creative technology brand hai jo AI Video Creation aur AI Website Development services provide karta hai. Iska tagline hai 'Creative Minds. Digital Excellence.'";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '💰 Pricing Details', action: 'pricing_info' }
        ],
        lang: lang
      };
    }

    // 7. Entity C: Creator Nihar Website (The Website itself)
    // 7A. Functionality: "Ye website kya karti hai?"
    if (cleaned.includes('ye website kya karti') || cleaned.includes('website kya karti') || cleaned.includes('what does this website do') || 
        cleaned.includes('is website par kya hota') || cleaned.includes('वेबसाइट क्या करती है') || cleaned.includes('यह वेबसाइट क्या करती है')) {
      conversationContext.lastEntity = 'website';
      let speech = '';
      if (lang === 'hi') {
        speech = "Creator Nihar एक digital creative technology platform है जहाँ AI Video Creation और AI Website Development services available हैं। यहाँ आप AI-powered videos और professional websites बनवा सकते हैं।";
      } else if (lang === 'en') {
        speech = "Creator Nihar is a digital creative technology platform where AI Video Creation and AI Website Development services are available. Here you can get AI-powered videos and professional websites built.";
      } else {
        speech = "Creator Nihar ek digital creative technology platform hai jahan AI Video Creation aur AI Website Development services available hain. Yahan aap AI-powered videos aur professional websites banwa sakte hain.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '🎥 AI Video (₹1,500)', action: 'ai_video_info' },
          { text: '💻 Website (₹20,000)', action: 'web_creation_info' }
        ],
        lang: lang
      };
    }

    // 7B. Nature / Description: "Creator Nihar website kaisi website hai?"
    if (cleaned.includes('kaisi website hai') || cleaned.includes('website kaisi hai') || cleaned.includes('what kind of website') || 
        cleaned.includes('कैसी वेबसाइट है') || cleaned.includes('वेबसाइट कैसी है')) {
      conversationContext.lastEntity = 'website';
      let speech = '';
      if (lang === 'hi') {
        speech = "Creator Nihar एक modern AI-focused creative technology website है। यहाँ आपको AI Video Creation और AI Website Development services मिलती हैं, pricing information, service booking, free consultation और Creator Nihar के बारे में information मिलती है।";
      } else if (lang === 'en') {
        speech = "Creator Nihar is a modern AI-focused creative technology website. Here you will find AI Video Creation and AI Website Development services, pricing information, service booking, free consultation, and information about Creator Nihar.";
      } else {
        speech = "Creator Nihar ek modern AI-focused creative technology website hai. Yahan aapko AI Video Creation aur AI Website Development services milti hain, pricing information, service booking, free consultation aur Creator Nihar ke baare mein information milti hai.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '💰 Pricing Details', action: 'pricing_info' }
        ],
        lang: lang
      };
    }

    // 8. Specific Service Pricing Inquiries (Without starting booking)
    // 8A. Website Pricing: "Website kitne ki hai?"
    if (cleaned.includes('website kitne ki') || cleaned.includes('website kitne mein') || cleaned.includes('website price') || 
        cleaned.includes('website cost') || cleaned.includes('website creation price') || cleaned.includes('वेबसाइट कितने की है') || cleaned.includes('वेबसाइट प्राइस')) {
      conversationContext.lastEntity = 'website_service';
      let speech = '';
      if (lang === 'hi') {
        speech = "Creator Nihar पर website creation service ₹20,000 से available है। Highly customized requirements के according final pricing vary कर सकती है।";
      } else if (lang === 'en') {
        speech = "Website creation service at Creator Nihar is available starting from ₹20,000. Final pricing may vary according to highly customized requirements.";
      } else {
        speech = "Creator Nihar par website creation service ₹20,000 se available hai. Highly customized requirements ke according final pricing vary kar sakti hai.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '💻 Website Details', action: 'web_creation_info' }
        ],
        lang: lang
      };
    }

    // 8B. Video Pricing: "AI video kitne ka hai?" / "Video kitne ka banega?"
    if (cleaned.includes('video kitne ka') || cleaned.includes('video kitne mein') || cleaned.includes('ai video kitne') || 
        cleaned.includes('video price') || cleaned.includes('video cost') || cleaned.includes('वीडियो कितने का बनेगा') || cleaned.includes('AI वीडियो कितने का है')) {
      conversationContext.lastEntity = 'video_service';
      let speech = '';
      if (lang === 'hi') {
        speech = "AI Video Creation service ₹1,500 per video है।";
      } else if (lang === 'en') {
        speech = "AI Video Creation service is ₹1,500 per video.";
      } else {
        speech = "AI Video Creation service ₹1,500 per video hai.";
      }
      return {
        type: 'ANSWER',
        spokenText: speech,
        displayText: speech,
        buttons: [
          { text: '📋 Service Book करें', action: 'start_booking', primary: true },
          { text: '🎥 AI Video Details', action: 'ai_video_info' }
        ],
        lang: lang
      };
    }

    // 8C. Out-of-scope factual queries filter (e.g. stock price, apple, weather, general world facts)
    const outOfScopeMarkers = [
      'stock', 'stocks', 'share market', 'apple', 'tesla', 'bitcoin', 'crypto',
      'weather', 'cricket', 'football', 'actor', 'actress', 'bollywood', 'hollywood',
      'prime minister', 'president', 'petrol', 'diesel', 'gold', 'silver', 'iphone',
      'recipe', 'flight', 'train', 'hotel', 'elon musk', 'bill gates', 'mark zuckerberg'
    ];
    if (outOfScopeMarkers.some(m => words.includes(m) || cleaned.includes(m))) {
      const fallbackSpeech = "I do not have verified information regarding this in my official knowledge base. You can directly contact Nihar.";
      return {
        type: 'FALLBACK',
        spokenText: fallbackSpeech,
        displayText: fallbackSpeech,
        buttons: [
          { text: '📞 Contact Nihar', action: 'contact_info' },
          { text: '📋 Service Book करें', action: 'start_booking', primary: true }
        ],
        lang: lang
      };
    }

    // 9. Match with CREATOR_NIHAR_KB for other topics (Workflow, Consultation, Contact, etc.)
    const queryWords = cleaned.split(/\s+/).filter(w => w.length > 1);
    let bestTopic = null;
    let highestScore = 0;

    for (const topic of CREATOR_NIHAR_KB) {
      let score = 0;
      for (const phrase of topic.phrases) {
        if (cleaned.includes(phrase)) score += 12;
      }
      for (const kw of topic.keywords) {
        if (cleaned.includes(kw)) score += 3;
      }
      for (const qw of queryWords) {
        if (topic.keywords.some(kw => kw === qw)) score += 1;
      }
      if (score > highestScore) {
        highestScore = score;
        bestTopic = topic;
      }
    }

    if (bestTopic && highestScore >= 3) {
      conversationContext.lastTopic = bestTopic.id;
      const rawHtml = bestTopic.answers[lang] || bestTopic.answers.en;
      const spokenClean = cleanTextForSpeech(rawHtml);
      return {
        type: 'ANSWER',
        spokenText: spokenClean,
        displayText: rawHtml,
        buttons: bestTopic.buttons || null,
        lang: lang
      };
    }

    // 10. Strict Truthful Fallback for unknown information
    const fallbackSpeech = "I do not have verified information regarding this in my official knowledge base. You can directly contact Nihar.";

    return {
      type: 'FALLBACK',
      spokenText: fallbackSpeech,
      displayText: fallbackSpeech,
      buttons: [
        { text: '📞 Contact Nihar', action: 'contact_info' },
        { text: '📋 Service Book करें', action: 'start_booking', primary: true }
      ],
      lang: lang
    };
  }

  function answerUserQuery(text) {
    const res = processConversationalQuery(text);

    if (res.type === 'BOOKING') {
      startServiceBooking();
      return;
    }

    let buttonsHtml = '';
    if (res.buttons && res.buttons.length > 0) {
      buttonsHtml = '<div class="shiva-options">';
      for (const btn of res.buttons) {
        const btnClass = btn.primary ? 'shiva-opt-btn shiva-opt-primary' : 'shiva-opt-btn';
        buttonsHtml += `<button type="button" class="${btnClass}" data-action="${btn.action}">${btn.text}</button>`;
      }
      buttonsHtml += '</div>';
    }

    if (res.type === 'FALLBACK') {
      const fallbackHtml = `
        ${escapeHtml(res.displayText)}
        <div class="shiva-contact-links">
          <a href="tel:+917723913729" class="shiva-contact-link shiva-contact-phone">
            📞 Call Nihar
          </a>
          <a href="https://wa.me/917723913729" target="_blank" rel="noopener noreferrer" class="shiva-contact-link shiva-contact-wa">
            💬 WhatsApp Nihar
          </a>
        </div>
        ${buttonsHtml}
      `;
      addBotMessage(fallbackHtml);
    } else {
      addBotMessage(`${res.displayText}${buttonsHtml}`);
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

    // Process via Creator Nihar Knowledge Engine
    answerUserQuery(text);
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
            name: d.name,
            email: d.email,
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
            'Booking Date & Time': timestamp,
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

  /* ==========================================================================
     CREATOR NIHAR LIVE VOICE MODE CONTROLLER 🎙️
     ========================================================================== */
  let voiceOverlay = null;
  let voiceBadge = null;
  let voiceSubUser = null;
  let voiceSubBot = null;
  let voiceOrb = null;
  let voiceMuteBtn = null;
  let voiceStopBtn = null;
  let voiceExitBtn = null;
  let voiceCloseBtn = null;

  let recognition = null;
  let isListening = false;
  let isSpeaking = false;
  let isVoiceMuted = false;
  let voiceSessionActive = false;
  let availableVoices = [];

  function initLiveVoiceMode() {
    if (document.getElementById('shivaVoiceOverlay')) return;

    voiceOverlay = document.createElement('div');
    voiceOverlay.className = 'shiva-voice-overlay';
    voiceOverlay.id = 'shivaVoiceOverlay';
    voiceOverlay.style.display = 'none';
    voiceOverlay.innerHTML = `
      <div class="shiva-voice-header">
        <div class="shiva-voice-brand">
          <img src="assets/images/favicon-96x96.png" alt="Creator Nihar" class="shiva-voice-logo" onerror="this.src='../assets/images/favicon-96x96.png'">
          <div class="shiva-voice-title">
            <h3>Shiva Live Voice</h3>
            <p>Creator Nihar Official AI</p>
          </div>
        </div>
        <button type="button" class="shiva-voice-close-btn" id="shivaVoiceCloseBtn" title="Close Voice Mode">✕</button>
      </div>

      <div class="shiva-voice-body">
        <div class="shiva-voice-orb-wrapper">
          <div class="shiva-voice-ring ring-1"></div>
          <div class="shiva-voice-ring ring-2"></div>
          <div class="shiva-voice-ring ring-3"></div>
          <div class="shiva-voice-orb" id="shivaVoiceOrb">
            <img src="assets/images/favicon-96x96.png" alt="Shiva Voice Orb" onerror="this.src='../assets/images/favicon-96x96.png'">
          </div>
        </div>

        <div class="shiva-voice-state-badge" id="shivaVoiceBadge">🎙️ Initializing...</div>

        <div class="shiva-voice-subtitles" id="shivaVoiceSubtitles">
          <div class="shiva-voice-sub-user voice-caption-user" id="shivaVoiceSubUser"></div>
          <div class="shiva-voice-sub-bot voice-caption-bot" id="shivaVoiceSubBot"></div>
        </div>

        <div class="shiva-voice-controls">
          <button type="button" class="shiva-voice-ctrl-btn" id="shivaVoiceMuteBtn" title="Mute / Unmute Microphone">
            <span class="ctrl-icon">🎤</span>
            <span class="ctrl-label">Mute</span>
          </button>
          <button type="button" class="shiva-voice-ctrl-btn btn-stop ctrl-stop" id="shivaVoiceStopBtn" title="Interrupt / Stop Speaking">
            <span class="ctrl-icon">⏹️</span>
            <span class="ctrl-label">Stop</span>
          </button>
          <button type="button" class="shiva-voice-ctrl-btn ctrl-close" id="shivaVoiceExitBtn" title="Exit Voice Mode">
            <span class="ctrl-icon">✕</span>
            <span class="ctrl-label">Exit</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(voiceOverlay);

    // Cache elements
    voiceBadge = document.getElementById('shivaVoiceBadge');
    voiceSubUser = document.getElementById('shivaVoiceSubUser');
    voiceSubBot = document.getElementById('shivaVoiceSubBot');
    voiceOrb = document.getElementById('shivaVoiceOrb');
    voiceMuteBtn = document.getElementById('shivaVoiceMuteBtn');
    voiceStopBtn = document.getElementById('shivaVoiceStopBtn');
    voiceExitBtn = document.getElementById('shivaVoiceExitBtn');
    voiceCloseBtn = document.getElementById('shivaVoiceCloseBtn');

    // Event listeners
    if (voiceCloseBtn) voiceCloseBtn.addEventListener('click', closeLiveVoiceSession);
    if (voiceExitBtn) voiceExitBtn.addEventListener('click', closeLiveVoiceSession);
    if (voiceMuteBtn) voiceMuteBtn.addEventListener('click', toggleVoiceMute);
    if (voiceStopBtn) voiceStopBtn.addEventListener('click', interruptVoiceSpeaking);
    if (voiceOrb) {
      voiceOrb.addEventListener('click', () => {
        if (isSpeaking) {
          interruptVoiceSpeaking();
        }
      });
    }

    // Cache speech synthesis voices
    if ('speechSynthesis' in window) {
      availableVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        availableVoices = window.speechSynthesis.getVoices();
      };
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isListening = true;
          setVoiceState('listening');
        };

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentTranscript = (finalTranscript || interimTranscript).trim().toLowerCase();
          if (!currentTranscript) return;

          // 1. Real-time interruption check when Shiva is speaking
          // PRIORITY: USER SPEECH > SHIVA SPEECH
          if (isSpeaking) {
            const cleanSpeakingText = (currentSpeakingText || '').toLowerCase().replace(/[?,.!;:'"()]/g, ' ');
            const isEcho = cleanSpeakingText.includes(currentTranscript) && currentTranscript.length > 3;
            const isInterruptionWord = INTERRUPTION_PHRASES.some(phrase => currentTranscript.includes(phrase));

            if (isInterruptionWord || !isEcho) {
              // Immediately stop Shiva's speech playback
              window.speechSynthesis.cancel();
              isSpeaking = false;
              currentSpeakingText = '';

              // If it's an interruption keyword (e.g. "रुक जाओ", "रुको", "stop", "wait")
              if (isInterruptionWord && currentTranscript.split(/\s+/).length <= 3) {
                setVoiceState('listening');
                if (voiceSubUser) voiceSubUser.textContent = `“${currentTranscript}”`;
                if (voiceSubBot) voiceSubBot.textContent = '⏸️ रुका हुआ (Listening...)';
                return;
              }

              // If user asked a new question directly while Shiva was speaking
              if (finalTranscript) {
                if (voiceSubUser) voiceSubUser.textContent = `“${finalTranscript}”`;
                setVoiceState('processing');
                handleVoiceUserInput(finalTranscript.trim());
                return;
              } else {
                setVoiceState('listening');
                if (voiceSubUser) voiceSubUser.textContent = `“${interimTranscript}”`;
                return;
              }
            } else {
              // Echo of Shiva's own speech - ignore
              return;
            }
          }

          // 2. Normal speech capture when Shiva is not speaking
          if (interimTranscript) {
            if (voiceSubUser) voiceSubUser.textContent = `“${interimTranscript}”`;
          }

          if (finalTranscript) {
            if (voiceSubUser) voiceSubUser.textContent = `“${finalTranscript}”`;
            setVoiceState('processing');
            handleVoiceUserInput(finalTranscript.trim());
          }
        };

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'no-speech') {
            if (voiceSessionActive && !isSpeaking && !isVoiceMuted) {
              setTimeout(() => {
                if (voiceSessionActive && !isSpeaking && !isVoiceMuted) {
                  startListening();
                }
              }, 600);
            }
          } else if (event.error === 'not-allowed') {
            setVoiceState('idle');
            if (voiceBadge) voiceBadge.textContent = '⚠️ Mic access denied';
            if (voiceSubBot) voiceSubBot.textContent = 'Microphone permission was denied. Please allow microphone access in your browser settings to use Live Voice.';
          }
        };

        recognition.onend = () => {
          isListening = false;
          if (voiceSessionActive && !isSpeaking && !isVoiceMuted && voiceOverlay && (voiceOverlay.dataset.state === 'listening')) {
            startListening();
          }
        };
      } catch (e) {
        console.warn('SpeechRecognition init error:', e);
      }
    }
  }

  function startLiveVoiceSession() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSpeech = 'speechSynthesis' in window;
    if (!SpeechRecognition || !hasSpeech) {
      alert('Live Voice Mode is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    initLiveVoiceMode();

    if (chatContainer) {
      chatContainer.classList.remove('active');
    }

    if (voiceOverlay) {
      voiceOverlay.style.display = 'flex';
      setTimeout(() => {
        if (voiceOverlay) voiceOverlay.classList.add('active');
      }, 10);
      voiceSessionActive = true;
      isVoiceMuted = false;
      updateMuteButton();

      // Welcome flow: First speak the welcome message aloud, then automatically activate mic
      const welcomeSpeech = "आपका बहुत-बहुत स्वागत है Creator Nihar वेबसाइट में। मैं Shiva, Creator Nihar का AI Assistant हूँ। मैं आपकी क्या मदद कर सकता हूँ?";
      const welcomeDisplay = "🙏 आपका बहुत-बहुत स्वागत है Creator Nihar वेबसाइट में।\nमैं Shiva, Creator Nihar का AI Assistant हूँ।\nमैं आपकी क्या मदद कर सकता हूँ?";

      if (voiceSubUser) voiceSubUser.textContent = '';
      if (voiceSubBot) voiceSubBot.textContent = welcomeDisplay;

      speakText(welcomeSpeech, 'hi', () => {
        // Automatic mic activation after welcome finishes
        if (voiceSessionActive && !isVoiceMuted) {
          startListening();
        }
      });
    }
  }

  function closeLiveVoiceSession() {
    voiceSessionActive = false;
    isListening = false;
    isSpeaking = false;
    currentSpeakingText = '';
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognition) {
      try {
        recognition.abort();
      } catch (e) {}
    }
    if (voiceOverlay) {
      voiceOverlay.classList.remove('active');
      setTimeout(() => {
        if (voiceOverlay && !voiceSessionActive) {
          voiceOverlay.style.display = 'none';
        }
      }, 400);
      setVoiceState('idle');
    }
  }

  function startListening() {
    if (!voiceSessionActive || isVoiceMuted || isSpeaking) return;
    if (!recognition) return;
    try {
      setVoiceState('listening');
      recognition.start();
    } catch (e) {
      // If already started or aborting
      console.warn('Recognition start exception:', e);
    }
  }

  function setVoiceState(state) {
    if (!voiceOverlay) return;
    voiceOverlay.classList.remove(
      'state-listening', 'shiva-state-listening',
      'state-processing', 'shiva-state-processing',
      'state-speaking', 'shiva-state-speaking'
    );
    voiceOverlay.dataset.state = state;

    if (state === 'listening') {
      voiceOverlay.classList.add('state-listening', 'shiva-state-listening');
      if (voiceBadge) voiceBadge.textContent = '🎙️ Listening...';
    } else if (state === 'processing') {
      voiceOverlay.classList.add('state-processing', 'shiva-state-processing');
      if (voiceBadge) voiceBadge.textContent = '🧠 Processing...';
    } else if (state === 'speaking') {
      voiceOverlay.classList.add('state-speaking', 'shiva-state-speaking');
      if (voiceBadge) voiceBadge.textContent = '🔊 Shiva Speaking...';
    } else if (state === 'muted') {
      if (voiceBadge) voiceBadge.textContent = '🔇 Microphone Muted';
    } else {
      if (voiceBadge) voiceBadge.textContent = '🎙️ Ready';
    }
  }

  function cleanTextForSpeech(html) {
    if (!html) return '';
    let text = html.replace(/<[^>]*>/g, ' ');
    text = text.replace(/₹\s*1[,.]?500/g, '1,500 rupees');
    text = text.replace(/₹\s*20[,.]?000/g, '20,000 rupees');
    text = text.replace(/₹/g, ' rupees ');
    text = text.replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '');
    text = text.replace(/•/g, ', ');
    text = text.replace(/&amp;/g, 'and');
    text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  let currentSpeakingText = '';

  function speakText(text, lang, onEndCallback) {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    currentSpeakingText = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = (lang === 'en') ? 'en-IN' : 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let selectedVoice = null;
    if (lang === 'hi' || lang === 'hinglish') {
      selectedVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi')) ||
                      voices.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india')) ||
                      voices.find(v => v.lang === 'en-IN');
    } else {
      selectedVoice = voices.find(v => v.lang === 'en-IN') ||
                      voices.find(v => v.lang.startsWith('en')) ||
                      voices.find(v => v.default);
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    isSpeaking = true;
    setVoiceState('speaking');

    utterance.onend = () => {
      isSpeaking = false;
      currentSpeakingText = '';
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      isSpeaking = false;
      currentSpeakingText = '';
      if (onEndCallback) {
        onEndCallback();
      }
    };

    window.speechSynthesis.speak(utterance);

    // Keep recognition active during speech to capture real-time interruptions!
    if (recognition && !isListening && voiceSessionActive && !isVoiceMuted) {
      try {
        recognition.start();
      } catch (e) {}
    }
  }

  function handleVoiceUserInput(userText) {
    if (!userText) {
      if (voiceSessionActive && !isVoiceMuted) startListening();
      return;
    }

    const res = processConversationalQuery(userText);

    // 1. Check for booking trigger
    if (res.type === 'BOOKING') {
      if (voiceSubBot) voiceSubBot.textContent = res.spokenText;
      speakText(res.spokenText, res.lang, () => {
        closeLiveVoiceSession();
        if (chatContainer) chatContainer.classList.add('active');
        startServiceBooking();
      });
      return;
    }

    // 2. Interruption
    if (res.type === 'INTERRUPT') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isSpeaking = false;
      currentSpeakingText = '';
      setVoiceState('listening');
      if (voiceSubBot) voiceSubBot.textContent = '⏸️ रुका हुआ (Listening...)';
      return;
    }

    // 3. Normal Answer or Fallback
    if (voiceSubBot) voiceSubBot.textContent = res.spokenText;
    speakText(res.spokenText, res.lang, () => {
      // Natural back-and-forth: auto-resume listening for next question
      if (voiceSessionActive && !isVoiceMuted) {
        startListening();
      }
    });
  }

  function interruptVoiceSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    currentSpeakingText = '';
    if (voiceSessionActive && !isVoiceMuted) {
      startListening();
    }
  }

  function toggleVoiceMute() {
    isVoiceMuted = !isVoiceMuted;
    updateMuteButton();
    if (isVoiceMuted) {
      if (recognition && isListening) {
        try { recognition.stop(); } catch (e) {}
      }
      isListening = false;
      setVoiceState('muted');
    } else {
      if (!isSpeaking) {
        startListening();
      }
    }
  }

  function updateMuteButton() {
    if (!voiceMuteBtn) return;
    const icon = voiceMuteBtn.querySelector('.ctrl-icon');
    const label = voiceMuteBtn.querySelector('.ctrl-label');
    if (isVoiceMuted) {
      voiceMuteBtn.classList.add('muted');
      if (icon) icon.textContent = '🔇';
      if (label) label.textContent = 'Unmute';
    } else {
      voiceMuteBtn.classList.remove('muted');
      if (icon) icon.textContent = '🎤';
      if (label) label.textContent = 'Mute';
    }
  }

  // Expose API for external integration and testing
  window.ShivaAI = {
    processQuery: processConversationalQuery,
    getContext: () => ({ ...conversationContext }),
    resetContext: () => {
      conversationContext.lastEntity = null;
      conversationContext.lastTopic = null;
      conversationContext.lastQuestion = '';
      conversationContext.lastLanguage = 'hinglish';
    },
    startLiveVoice: startLiveVoiceSession,
    closeLiveVoice: closeLiveVoiceSession,
    interruptVoice: interruptVoiceSpeaking
  };

})();
