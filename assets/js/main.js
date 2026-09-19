/**
 * CREATOR NIHAR - JAVASCRIPT CONTROLLER
 * Handles interactive particle canvas, mobile navigation, sticky header,
 * service selection, interactive booking modal, WhatsApp lead generator,
 * and smooth scroll-reveal animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initNavigation();
  initBookingModal();
  initContactForms();
  initScrollReveal();
});

/* ==========================================================================
   1. INTERACTIVE HERO CANVAS (Lightweight AI Network Particles)
   ========================================================================== */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: null, y: null, radius: 140 };

  function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Particle count based on screen size
  const particleCount = Math.min(Math.floor((width * height) / 16000), 65);

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.6 + 1.2;
      this.speedX = (Math.random() - 0.5) * 0.7;
      this.speedY = (Math.random() - 0.5) * 0.7;
      // 80% Blue, 20% Orange
      this.isOrange = Math.random() < 0.22;
      this.color = this.isOrange ? '#F5701E' : '#0A4E8C';
      this.alpha = Math.random() * 0.4 + 0.3;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Bounce off borders
      if (this.x < 0 || this.x > width) this.speedX *= -1;
      if (this.y < 0 || this.y > height) this.speedY *= -1;

      // Mouse interactivity
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 2.2;
          this.y -= (dy / dist) * force * 2.2;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }
  }

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Track mouse
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Connecting lines
  function drawLines() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          // Highlight connections if one particle is orange
          if (particles[i].isOrange || particles[j].isOrange) {
            ctx.strokeStyle = `rgba(245, 112, 30, ${alpha * 1.3})`;
          } else {
            ctx.strokeStyle = `rgba(10, 78, 140, ${alpha})`;
          }
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  // Render loop
  let animationId;
  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    drawLines();
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(animate);
  }

  // Pause when off screen to optimize performance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!animationId) animate();
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });
  });

  observer.observe(canvas);
  animate();
}

/* ==========================================================================
   2. NAVIGATION & STICKY HEADER
   ========================================================================== */
function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    highlightNavOnScroll();
  });

  // Mobile menu toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('open');
      document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when clicking link
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Active link highlighter
  function highlightNavOnScroll() {
    const scrollPos = window.scrollY + 120;
    const sections = document.querySelectorAll('section[id]');

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }
}

/* ==========================================================================
   3. BOOKING MODAL CONTROLLER
   ========================================================================== */
function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close-btn');
  const openButtons = document.querySelectorAll('[data-open-modal]');

  function openModal(servicePreference) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // If service preference specified, toggle pill in modal form
    if (servicePreference) {
      const modalForm = modal.querySelector('#modalBookingForm');
      if (modalForm) {
        const pill = modalForm.querySelector(`.service-pill-btn[data-service="${servicePreference}"]`);
        if (pill) {
          modalForm.querySelectorAll('.service-pill-btn').forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          const hiddenInput = modalForm.querySelector('input[name="selected_service"]');
          if (hiddenInput) hiddenInput.value = servicePreference;
        }
      }
    }
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || 'AI Video Creation';
      openModal(service);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  window.openBookingModal = openModal;
  window.closeBookingModal = closeModal;
}

/* ==========================================================================
   4. CONTACT & BOOKING FORMS (WhatsApp & Email Integrations)
   ========================================================================== */
function initContactForms() {
  const forms = [
    document.getElementById('contactBookingForm'),
    document.getElementById('modalBookingForm')
  ].filter(Boolean);

  forms.forEach((form) => {
    // Service pill buttons selection
    const pills = form.querySelectorAll('.service-pill-btn');
    const hiddenServiceInput = form.querySelector('input[name="selected_service"]');

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        if (hiddenServiceInput) {
          hiddenServiceInput.value = pill.getAttribute('data-service');
        }
      });
    });

    // Handle WhatsApp Submission
    const waBtn = form.querySelector('.btn-submit-whatsapp');
    if (waBtn) {
      waBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dispatchWhatsApp(form);
      });
    }

    // Handle Email Submission
    const mailBtn = form.querySelector('.btn-submit-email');
    if (mailBtn) {
      mailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dispatchEmail(form);
      });
    }
  });

  // Global triggers for quick booking
  document.querySelectorAll('.btn-book-video').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      selectServiceAndScroll('AI Video Creation (₹1,500)');
    });
  });

  document.querySelectorAll('.btn-book-web').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      selectServiceAndScroll('Website Creation (₹20,000)');
    });
  });
}

function selectServiceAndScroll(serviceName) {
  const contactSec = document.getElementById('contact');
  const form = document.getElementById('contactBookingForm');

  if (form) {
    const pills = form.querySelectorAll('.service-pill-btn');
    pills.forEach((p) => {
      if (p.getAttribute('data-service').includes(serviceName.split(' ')[0])) {
        p.click();
      }
    });
  }

  if (contactSec) {
    contactSec.scrollIntoView({ behavior: 'smooth' });
  }
}

function getFormData(form) {
  const name = form.querySelector('[name="client_name"]')?.value.trim() || '';
  const email = form.querySelector('[name="client_email"]')?.value.trim() || '';
  const phone = form.querySelector('[name="client_phone"]')?.value.trim() || '';
  const message = form.querySelector('[name="client_message"]')?.value.trim() || '';
  
  const activePill = form.querySelector('.service-pill-btn.active');
  const service = activePill ? activePill.getAttribute('data-service') : 'AI Video Creation';

  return { name, email, phone, message, service };
}

function dispatchWhatsApp(form) {
  const data = getFormData(form);

  if (!data.name) {
    showToast('Please enter your name.');
    form.querySelector('[name="client_name"]')?.focus();
    return;
  }

  const waNumber = '917723913729';
  let messageText = `*New Service Booking Request - Creator Nihar*\n\n`;
  messageText += `⭐ *Requested Service:* ${data.service}\n`;
  messageText += `👤 *Client Name:* ${data.name}\n`;
  if (data.email) messageText += `📧 *Email:* ${data.email}\n`;
  if (data.phone) messageText += `📱 *Phone / WhatsApp:* ${data.phone}\n`;
  if (data.message) messageText += `\n📝 *Project Details:*\n${data.message}\n`;
  messageText += `\n---\nSent via Creator Nihar Official Website`;

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`;
  
  showToast('Connecting directly to WhatsApp...');
  setTimeout(() => {
    window.open(waUrl, '_blank');
    if (window.closeBookingModal) window.closeBookingModal();
  }, 350);
}

function dispatchEmail(form) {
  const data = getFormData(form);

  if (!data.name) {
    showToast('Please enter your name.');
    form.querySelector('[name="client_name"]')?.focus();
    return;
  }

  const recipient = 'nhrnhl0507@gmail.com';
  const subject = `Service Booking Request: ${data.service} - ${data.name}`;
  let body = `Hello Creator Nihar,\n\n`;
  body += `I would like to book the following service:\n`;
  body += `Service: ${data.service}\n`;
  body += `Name: ${data.name}\n`;
  body += `Email: ${data.email}\n`;
  body += `Phone: ${data.phone}\n\n`;
  body += `Project Overview:\n${data.message || 'I would like to discuss the project requirements with you.'}\n\n`;
  body += `Best regards,\n${data.name}`;

  const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  showToast('Launching email client...');
  setTimeout(() => {
    window.location.href = mailtoUrl;
    if (window.closeBookingModal) window.closeBookingModal();
  }, 350);
}

/* ==========================================================================
   5. TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message) {
  let toast = document.querySelector('.toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5701E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ==========================================================================
   6. SCROLL REVEAL (IntersectionObserver)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}
