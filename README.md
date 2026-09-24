# Creator Nihar

> **Tagline:** Creative Minds. Digital Excellence.

Creator Nihar is a professional digital creative platform focused on AI video creation and modern website development. We bridge cutting-edge artificial intelligence with premium web engineering to deliver high-converting digital assets for businesses, personal brands, and creators.

---

## About Creator Nihar

Founded by **Nihar Amrawat**, an 19-year-old BCA student and Certified Ethical Hacker based in Udaipur, Rajasthan. Creator Nihar represents a dedication to technical integrity, modern visual storytelling, and bespoke digital craft. Every client works directly with Nihar to achieve tailored results with zero middle management or delayed communication.

---

## Services

### 1. AI Video Creation
- **Price:** ₹1,500 per video
- **What is included:**
  - AI-generated concept development and scriptwriting
  - High-definition visual generation and prompt engineering
  - Dynamic AI voiceovers and sound design
  - Custom aspect ratios (16:9 widescreen, 9:16 vertical reels/shorts)
  - Commercial usage rights and prompt revisions

### 2. Website Creation
- **Price:** ₹20,000 per website
- **What is included:**
  - Bespoke, modern, responsive UI/UX design
  - Clean, semantic HTML5, modern CSS3, and JavaScript architecture
  - High-converting landing page layouts and interactive elements
  - Integrated contact and inquiry forms with email/WhatsApp routing
  - Fast page loading, SEO optimization, and mobile-first responsiveness

---

## Free Consultation

A dedicated **Free Consultation** system (`/free-consultation` or `free-consultation.html`) allows prospective clients to request a 1-on-1 virtual Zoom session.

- **Platform:** Zoom (Online)
- **Cost:** 100% Free
- **Status Policy:** *Pending Personal Confirmation*
- **Workflow:**
  1. Client submits their project brief, preferred date, and preferred time.
  2. The brief is routed directly to the owner (`nhrnhl0507@gmail.com` and WhatsApp).
  3. No automated instant confirmation or generic links are dispatched.
  4. Nihar personally reviews the request and coordinates the confirmed date, time, and Zoom meeting link.

---

## Technology Stack

- **Frontend:** Semantic HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid)
- **Interactivity:** Vanilla JavaScript (ES6+), HTML5 Canvas API (Interactive Neural Mesh)
- **Forms & Email:** Web3Forms API (Cloudflare-backed), Direct 1-Click Gmail Composer, WhatsApp Protocol API
- **Fonts:** Outfit, Plus Jakarta Sans (Google Fonts)
- **Design System:**
  - Primary Deep Blue: `#0A4E8C`
  - Vibrant Orange: `#F5701E`
  - Crisp Surfaces: `#FFFFFF`, `#F8FAFD`
  - Muted Slate: `#475569`

---

## Project Structure

```
creator-nihar/
├── index.html                  # Main homepage (Hero, Services, Pricing, Owner, Workflow, Contact)
├── free-consultation.html      # Standalone Free Consultation page
├── free-consultation/
│   └── index.html              # Clean directory route for /free-consultation
├── assets/
│   ├── css/
│   │   └── style.css           # Complete responsive stylesheet & design system
│   ├── js/
│   │   ├── main.js             # Hero neural canvas, navigation & modal controller
│   │   └── consultation.js     # Consultation form validation, Gmail & WhatsApp dispatches
│   └── images/
│       ├── logo.jpg            # Official Creator Nihar brand logo
│       └── nihar.jpg           # Founder photograph (Nihar Amrawat)
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules for clean repository
└── README.md                   # Project documentation
```

---

## Local Development

No complex build tools or dependencies are required. You can run this project with any static file server:

### Option 1: Live Server (VS Code)
1. Open the project folder in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Python HTTP Server
```bash
# Python 3
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

### Option 3: Direct File
Double-click `index.html` or `free-consultation.html` to view directly in your web browser.

---

## Environment Variables

See `.env.example` for reference. If using automated background form delivery:

```env
WEB3FORMS_ACCESS_KEY=your_web3forms_access_key_here
EMAIL_TO=nhrnhl0507@gmail.com
EMAIL_FROM=your_email_here
EMAIL_API_KEY=your_api_key_here
WHATSAPP_NUMBER=917723913729
```

---

## Deployment

This website is statically optimized and can be deployed instantly to:

- **GitHub Pages:** Enable Pages in repository settings pointing to the `main` branch root.
- **Vercel:** Run `vercel` or connect your GitHub repository.
- **Netlify:** Drag and drop the folder or connect via Git.

---

## Supabase Authentication, Database, Storage & Owner-Only Admin

Creator Nihar features a secure, production-grade authentication and administrative ecosystem powered by Supabase:

### 1. Database Schema & RLS Setup (1-Click)
1. Open your Supabase project dashboard at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** -> **New Query**.
3. Copy the entire contents of [`supabase-schema.sql`](supabase-schema.sql) and click **Run**.
4. This automatically provisions:
   - `profiles` table with automatic `role = 'user'` default and secure auto-elevation to `admin` for `nhrnhl0507@gmail.com`.
   - `login_activity` audit table tracking user logins, timestamps, and client device information.
   - `videos` table with RLS restricting access so only authenticated members can stream published lessons, and only the admin can create, edit, delete, or toggle drafts.
   - `bookings` table capturing client project requests from Shiva AI and consultation forms.
   - Supabase Storage buckets: `videos` (authenticated stream) and `thumbnails` (public read, admin write).

### 2. Frontend Configuration
In `assets/js/supabase-config.js`, update:
```javascript
const DEFAULT_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```
*(Only the public `anon` key is used in client code. The `service-role` key is NEVER exposed in the frontend).*

### 3. Owner Account & Admin Panel (`/admin`)
- The Admin Suite (`/admin` and `admin.html`) is restricted exclusively to Nihar Amrawat (`nhrnhl0507@gmail.com`).
- Normal users attempting to access `/admin` receive a strict `403 Forbidden` access denied screen backed by Supabase RLS policies.
- The Admin Panel provides real database metrics:
  - Real registered user counts and accounts table with status management.
  - Real login activity log with device and timestamp audits.
  - Video management: Direct video & thumbnail upload to Supabase Storage, title/description editing, draft/published toggle, and deletion.
  - Client bookings review from Shiva AI and website consultation.

### 4. AI Video Learning Hub (`/learning.html`)
- A dedicated learning studio where authenticated students stream step-by-step masterclasses in photorealistic AI generation and modern digital development.
- Non-authenticated visitors see a locked preview with an instant "Sign In to Access" prompt.
- Backend RLS on Supabase ensures video URLs and lessons are protected against unauthenticated scrapers.

---

## Contact

- **Founder:** Nihar Amrawat
- **Email:** [nhrnhl0507@gmail.com](mailto:nhrnhl0507@gmail.com)
- **WhatsApp:** [+91 7723913729](https://wa.me/917723913729)
- **Location:** Udaipur, Rajasthan, India

