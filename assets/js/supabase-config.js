/**
 * CREATOR NIHAR - SUPABASE CLIENT & AUTH CONTROLLER
 * Handles Supabase Auth, Row Level Security, Storage, Admin verification,
 * and reactive UI navbar state.
 *
 * NOTE: Only the public 'anon' key is used here. Service-role key is NEVER exposed.
 */

(function () {
  'use strict';

  // --- SUPABASE PROJECT CREDENTIALS ---
  // Obtain from: Supabase Dashboard -> Project Settings -> API
  const DEFAULT_SUPABASE_URL = 'https://wzzmtkltpnglqtvehcjf.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_HNo_Tkdn8_W7ZYZ65WtuWg_dDme2_GA';

  // Sanitize localStorage overrides to ignore placeholders or empty values
  let storedUrl = null;
  let storedKey = null;
  try {
    storedUrl = localStorage.getItem('cn_supabase_url');
    if (storedUrl && (storedUrl.includes('YOUR_PROJECT_ID') || !storedUrl.trim())) {
      localStorage.removeItem('cn_supabase_url');
      storedUrl = null;
    }
    storedKey = localStorage.getItem('cn_supabase_anon_key');
    if (storedKey && (storedKey.includes('YOUR_SUPABASE_ANON_KEY') || !storedKey.trim())) {
      localStorage.removeItem('cn_supabase_anon_key');
      storedKey = null;
    }
  } catch (e) {
    // localStorage might be blocked or restricted in certain browser modes
  }

  // Allow runtime override via window or sanitized localStorage
  const SUPABASE_URL = (window.__CN_SUPABASE_URL && !window.__CN_SUPABASE_URL.includes('YOUR_PROJECT_ID'))
    ? window.__CN_SUPABASE_URL
    : (storedUrl || DEFAULT_SUPABASE_URL);

  const SUPABASE_ANON_KEY = (window.__CN_SUPABASE_ANON_KEY && !window.__CN_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY'))
    ? window.__CN_SUPABASE_ANON_KEY
    : (storedKey || DEFAULT_SUPABASE_ANON_KEY);

  let supabaseClient = null;

  function isConfigured() {
    return (
      Boolean(SUPABASE_URL) &&
      !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
      Boolean(SUPABASE_ANON_KEY) &&
      !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
    );
  }

  // Initialize Supabase Client if library is loaded and configuration is valid
  if (isConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (e) {
      console.warn('Creator Nihar Supabase client initialization warning:', e.message);
    }
  }

  // Helper: Device / Browser Info for Login Activity
  function getDeviceInfo() {
    const ua = navigator.userAgent || '';
    let browser = 'Browser';
    if (ua.indexOf('Edg/') > -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('Chrome/') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari/') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox/') > -1) browser = 'Firefox';

    let os = 'Unknown OS';
    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Macintosh') > -1 || ua.indexOf('Mac OS') > -1) os = 'macOS';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';

    const isMobile = /Mobi|Android/i.test(ua);
    return `${browser} on ${os} (${isMobile ? 'Mobile' : 'Desktop'})`;
  }

  // In-memory mutex tracking active in-flight login activity inserts
  const inFlightLogins = new Set();

  // --- AUTH METHODS ---
  const CNAuth = {
    client: supabaseClient,

    isConfigured: isConfigured,

    getCredentials: () => ({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY }),

    setCredentials: (url, anonKey) => {
      if (url) localStorage.setItem('cn_supabase_url', url.trim());
      if (anonKey) localStorage.setItem('cn_supabase_anon_key', anonKey.trim());
      window.location.reload();
    },

    clearCredentials: () => {
      localStorage.removeItem('cn_supabase_url');
      localStorage.removeItem('cn_supabase_anon_key');
      window.location.reload();
    },

    // Get current session
    getSession: async () => {
      if (!supabaseClient) return null;
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data.session;
      } catch (err) {
        console.error('getSession error:', err);
        return null;
      }
    },

    // Get current user
    getUser: async () => {
      if (!supabaseClient) return null;
      try {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) return null;
        return data.user;
      } catch (err) {
        return null;
      }
    },

    // Get profile record from public.profiles
    getProfile: async (userId) => {
      if (!supabaseClient) return null;
      try {
        const uid = userId || (await CNAuth.getUser())?.id;
        if (!uid) return null;

        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();

        if (error) {
          console.warn('getProfile error:', error.message);
          return null;
        }
        return data;
      } catch (err) {
        console.warn('getProfile catch:', err);
        return null;
      }
    },

    // Check if current user is Admin
    isAdmin: async () => {
      const user = await CNAuth.getUser();
      if (!user) return false;
      // Primary check: email match
      if (user.email && user.email.toLowerCase() === 'nhrnhl0507@gmail.com') {
        return true;
      }
      // Secondary check: profile role
      const profile = await CNAuth.getProfile(user.id);
      return profile && profile.role === 'admin';
    },

    // Log in with email & password
    signIn: async (email, password) => {
      if (!isConfigured() || !supabaseClient) {
        throw new Error('Supabase client is not configured yet. Please verify project credentials.');
      }

      // Explicit login action: clear any previous session markers for this browser
      try {
        const prevUser = await CNAuth.getUser();
        if (prevUser && prevUser.id) {
          localStorage.removeItem(`cn_last_logged_token_${prevUser.id}`);
          localStorage.removeItem(`cn_last_login_time_${prevUser.id}`);
          sessionStorage.removeItem(`cn_last_login_${prevUser.id}`);
        }
      } catch (e) { /* ignore */ }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      if (error) throw error;

      // Log login activity with the freshly established session
      if (data.user) {
        await CNAuth.logLoginActivity(data.user.id, data.user.email, data.session);
      }
      return data;
    },

    // Sign up new user
    signUp: async (name, email, password, phone = '') => {
      if (!isConfigured() || !supabaseClient) {
        throw new Error('Supabase client is not configured yet. Please verify project credentials.');
      }
      const trimmedEmail = email.trim();
      const { data, error } = await supabaseClient.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim()
          }
        }
      });
      if (error) throw error;

      // If session established immediately (email confirmation disabled in Supabase)
      if (data.user && data.session) {
        await CNAuth.logLoginActivity(data.user.id, data.user.email, data.session);
      }
      return data;
    },

    // Sign out
    signOut: async () => {
      if (!supabaseClient) return;
      try {
        const user = await CNAuth.getUser();
        if (user && user.id) {
          localStorage.removeItem(`cn_last_logged_token_${user.id}`);
          localStorage.removeItem(`cn_last_login_time_${user.id}`);
          sessionStorage.removeItem(`cn_last_login_${user.id}`);
        }
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.error('signOut error:', err);
      }
      window.location.href = 'index.html';
    },

    // Forgot password (request recovery email)
    resetPasswordForEmail: async (email) => {
      if (!isConfigured() || !supabaseClient) {
        throw new Error('Supabase client is not configured yet. Please verify project credentials.');
      }
      // Get base URL for reset redirect
      const redirectUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '') + '/reset-password.html';
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl
      });
      if (error) throw error;
      return data;
    },

    // Update password (when inside recovery session)
    updatePassword: async (newPassword) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return data;
    },

    // Record login activity in public.login_activity and update last_login
    logLoginActivity: async (userId, email, currentSession = null) => {
      if (!supabaseClient || !userId) return;

      // 1. In-memory mutex: prevent concurrent asynchronous executions
      if (inFlightLogins.has(userId)) {
        return;
      }

      try {
        // Resolve session if not provided
        if (!currentSession && supabaseClient.auth) {
          try {
            const { data } = await supabaseClient.auth.getSession();
            currentSession = data ? data.session : null;
          } catch (sessErr) { /* ignore */ }
        }

        const tokenSignature = (currentSession && currentSession.access_token)
          ? currentSession.access_token.slice(-40)
          : null;

        const tokenKey = `cn_last_logged_token_${userId}`;
        const timeKey = `cn_last_login_time_${userId}`;

        // 2. Token-based deduplication: if this exact session token was already logged, skip
        if (tokenSignature) {
          const lastLoggedToken = localStorage.getItem(tokenKey);
          if (lastLoggedToken === tokenSignature) {
            return;
          }
        }

        // 3. Time-based debounce (30 seconds): prevent rapid repeat inserts across all tabs
        const lastLogTime = parseInt(localStorage.getItem(timeKey) || '0', 10);
        const now = Date.now();
        if (now - lastLogTime < 30000) {
          return;
        }

        // Acquire in-flight mutex lock & write-ahead marker
        inFlightLogins.add(userId);
        if (tokenSignature) {
          localStorage.setItem(tokenKey, tokenSignature);
        }
        localStorage.setItem(timeKey, now.toString());

        const deviceInfo = getDeviceInfo();
        const { error: insertError } = await supabaseClient
          .from('login_activity')
          .insert([
            {
              user_id: userId,
              email: email,
              device_info: deviceInfo
            }
          ]);

        if (insertError) {
          console.error('logLoginActivity insert error:', insertError);
          // Rollback markers so a retry can occur
          localStorage.removeItem(tokenKey);
          localStorage.removeItem(timeKey);
          return;
        }

        await supabaseClient
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      } catch (e) {
        console.warn('logLoginActivity error:', e);
      } finally {
        inFlightLogins.delete(userId);
      }
    },

    // Dynamic Navbar Updater
    initNavbar: async () => {
      const authContainers = document.querySelectorAll('.nav-auth-actions');
      if (!authContainers.length) return;

      // Render loading placeholder or detect auth
      const user = await CNAuth.getUser();

      if (!user) {
        // Logged Out State: Login | Sign Up
        authContainers.forEach(container => {
          container.innerHTML = `
            <a href="login.html" class="btn btn-auth-login">
              <span>Log In</span>
            </a>
            <a href="signup.html" class="btn btn-auth-signup">
              <span>Sign Up</span>
            </a>
          `;
        });
        return;
      }

      // Logged In State: Determine if Admin or User
      const admin = await CNAuth.isAdmin();
      const profile = await CNAuth.getProfile(user.id);
      const displayName = (profile && profile.name) ? profile.name.split(' ')[0] : 'Member';

      authContainers.forEach(container => {
        if (admin) {
          // Admin State: Admin Panel | Logout
          container.innerHTML = `
            <a href="admin.html" class="btn btn-auth-admin" title="Access Creator Nihar Owner Suite">
              <span class="admin-badge-dot"></span>
              <span>Admin Panel</span>
            </a>
            <button type="button" class="btn btn-auth-logout" id="globalLogoutBtn" title="Sign out of Admin">
              <span>Logout</span>
            </button>
          `;
        } else {
          // Normal User: Profile | Dashboard | Logout
          container.innerHTML = `
            <a href="learning.html" class="btn btn-auth-link" title="AI Video Learning">
              <span>AI Learning</span>
            </a>
            <a href="dashboard.html" class="btn btn-auth-user" title="My Account">
              <span>👤 ${escapeHtml(displayName)}</span>
            </a>
            <button type="button" class="btn btn-auth-logout" id="globalLogoutBtn" title="Log out">
              <span>Logout</span>
            </button>
          `;
        }
      });

      // Bind all logout buttons
      document.querySelectorAll('#globalLogoutBtn, .btn-auth-logout').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          if (confirm('Are you sure you want to log out?')) {
            await CNAuth.signOut();
          }
        });
      });
    }
  };

  // --- VIDEOS API (AI VIDEO LEARNING) ---
  const CNVideos = {
    // Fetch published videos (accessible by authenticated users via RLS)
    getPublishedVideos: async (category = null) => {
      if (!supabaseClient) return [];
      try {
        let query = supabaseClient
          .from('videos')
          .select('*')
          .eq('is_published', true)
          .order('lesson_number', { ascending: true })
          .order('created_at', { ascending: false });

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('getPublishedVideos error:', err.message);
        return [];
      }
    },

    // Fetch all videos (Admin only via RLS)
    getAllVideos: async () => {
      if (!supabaseClient) return [];
      try {
        const { data, error } = await supabaseClient
          .from('videos')
          .select('*')
          .order('lesson_number', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('getAllVideos error:', err);
        return [];
      }
    },

    // Insert new video (Admin only)
    createVideo: async (videoData) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabaseClient
        .from('videos')
        .insert([videoData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Update video (Admin only)
    updateVideo: async (id, videoData) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabaseClient
        .from('videos')
        .update(videoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Delete video (Admin only)
    deleteVideo: async (id) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const { error } = await supabaseClient
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    // Toggle video publish status (Admin only)
    togglePublish: async (id, currentStatus) => {
      return CNVideos.updateVideo(id, { is_published: !currentStatus });
    },

    // Upload video file to Supabase Storage ('videos' bucket)
    uploadVideoFile: async (file, onProgress) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const fileExt = file.name.split('.').pop();
      const fileName = `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Create signed URL (valid for 1 year) or retrieve storage path
      const { data: signedData, error: signedError } = await supabaseClient.storage
        .from('videos')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 365 days

      if (signedError) {
        // Fallback to public URL if bucket is public
        const { data: publicData } = supabaseClient.storage.from('videos').getPublicUrl(filePath);
        return publicData.publicUrl;
      }
      return signedData.signedUrl;
    },

    // Upload thumbnail file to Supabase Storage ('thumbnails' bucket)
    uploadThumbnailFile: async (file) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const fileExt = file.name.split('.').pop();
      const fileName = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from('thumbnails')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicData } = supabaseClient.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    }
  };

  // --- BOOKINGS API ---
  const CNBookings = {
    // Record booking in Supabase
    createBooking: async (bookingData) => {
      if (!supabaseClient) {
        console.warn('CNBookings.createBooking: Supabase client not initialized.');
        return null;
      }
      try {
        // Plain insert without forcing .select() returning representation,
        // so that INSERT works reliably for all clients (authenticated users, clients, and guests)
        // without requiring SELECT permissions on the newly inserted row.
        const { error } = await supabaseClient
          .from('bookings')
          .insert([bookingData]);

        if (error) {
          console.error('CNBookings.createBooking database error:', error);
          throw error;
        }

        return { success: true, booking_id: bookingData.booking_id };
      } catch (err) {
        console.error('CNBookings.createBooking catch error:', err);
        throw err;
      }
    },

    // Fetch all bookings (Admin only)
    getAllBookings: async () => {
      if (!supabaseClient) return [];
      try {
        const { data, error } = await supabaseClient
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('getAllBookings error:', err);
        return [];
      }
    },

    // Update booking status (Admin only)
    updateStatus: async (id, status) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabaseClient
        .from('bookings')
        .update({ status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  // --- ADMIN ANALYTICS & USER MANAGEMENT API ---
  const CNAdmin = {
    getDashboardStats: async () => {
      if (!supabaseClient) return { users: 0, logins: 0, videos: 0, bookings: 0 };
      try {
        const results = await Promise.allSettled([
          supabaseClient.from('profiles').select('id', { count: 'exact', head: true }),
          supabaseClient.from('login_activity').select('id', { count: 'exact', head: true }),
          supabaseClient.from('videos').select('id', { count: 'exact', head: true }),
          supabaseClient.from('bookings').select('id', { count: 'exact', head: true })
        ]);

        return {
          users: (results[0].status === 'fulfilled' && typeof results[0].value?.count === 'number') ? results[0].value.count : 0,
          logins: (results[1].status === 'fulfilled' && typeof results[1].value?.count === 'number') ? results[1].value.count : 0,
          videos: (results[2].status === 'fulfilled' && typeof results[2].value?.count === 'number') ? results[2].value.count : 0,
          bookings: (results[3].status === 'fulfilled' && typeof results[3].value?.count === 'number') ? results[3].value.count : 0
        };
      } catch (err) {
        console.error('getDashboardStats error:', err);
        return { users: 0, logins: 0, videos: 0, bookings: 0 };
      }
    },

    getAllUsers: async () => {
      if (!supabaseClient) return [];
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('getAllUsers error:', err);
        return [];
      }
    },

    getLoginActivity: async (limit = null) => {
      if (!supabaseClient) return [];
      try {
        let query = supabaseClient
          .from('login_activity')
          .select('*')
          .order('created_at', { ascending: false });

        if (limit && Number.isInteger(limit) && limit > 0) {
          query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('getLoginActivity error:', err);
        return [];
      }
    },

    updateUserStatus: async (userId, newStatus) => {
      if (!supabaseClient) throw new Error('Supabase client not initialized.');
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Auto-run navbar initialization on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    CNAuth.initNavbar();

    // Listen to Supabase auth state changes for real-time reactivity
    if (supabaseClient) {
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        CNAuth.initNavbar();
        if (event === 'SIGNED_IN' && session && session.user) {
          await CNAuth.logLoginActivity(session.user.id, session.user.email, session);
        }
      });
    }
  });

  // Expose APIs on window
  window.CNAuth = CNAuth;
  window.CNVideos = CNVideos;
  window.CNBookings = CNBookings;
  window.CNAdmin = CNAdmin;
  window.supabaseClient = supabaseClient;
})();
