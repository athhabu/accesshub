// State Management and API Service
const State = {
  user: null,
  token: localStorage.getItem('accesshub_token') || null,
  listeners: [],

  subscribe(listener) {
    this.listeners.push(listener);
  },

  notify() {
    this.listeners.forEach(fn => fn(this.user));
  },

  setUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem('accesshub_user', JSON.stringify(user));
      this.startLabWatcher();
    } else {
      localStorage.removeItem('accesshub_user');
      localStorage.removeItem('accesshub_token');
      this.stopLabWatcher();
    }
    this.notify();
  },

  async init() {
    // Try restoring from token
    if (this.token) {
      try {
        const res = await this.apiFetch('/api/auth/me');
        if (res.user) {
          this.setUser(res.user);
          return res.user;
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        this.setUser(null);
      }
    }
    return null;
  },

  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed.');
    }

    this.token = data.token;
    localStorage.setItem('accesshub_token', data.token);
    this.setUser(data.user);
    return data.user;
  },

  async logout() {
    this.stopLabWatcher();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error:', e);
    }
    this.token = null;
    this.setUser(null);
    window.location.hash = '#/login';
  },

  async apiFetch(endpoint, options = {}) {
    const headers = options.headers || {};
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    // Check for auto-detected exploit completion headers
    const solvedHeader = res.headers.get('x-lab-solved');
    if (solvedHeader) {
      const numId = Number(solvedHeader);
      if (!this._verifiedCheckIds.has(numId)) {
        const vulnHeader = res.headers.get('x-lab-vulnerability');
        const titleHeader = res.headers.get('x-lab-title');
        const vulnName = vulnHeader ? decodeURIComponent(vulnHeader) : 'Vulnerability Solved';
        const title = titleHeader ? decodeURIComponent(titleHeader) : `Check ${solvedHeader}`;
        this.showLabSolvedBanner(numId, title, vulnName);
      }
    }

    if (res.status === 401) {
      this.setUser(null);
      window.location.hash = '#/login';
      throw new Error('Unauthorized');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  },

  showToast(message, icon = 'check_circle') {
    const toast = document.getElementById('global-toast');
    const toastText = document.getElementById('global-toast-text');
    const toastIcon = document.getElementById('global-toast-icon');

    if (!toast || !toastText) return;

    toastText.textContent = message;
    if (toastIcon) toastIcon.textContent = icon;

    toast.classList.remove('translate-y-16', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-16', 'opacity-0');
    }, 2800);
  },

  // PortSwigger / JuiceShop Style Vulnerability Solved Notification
  _labBannerTimer: null,
  _verifiedCheckIds: new Set(),
  _labWatcherInterval: null,

  showLabSolvedBanner(checkId, title, vulnerability) {
    const banner = document.getElementById('lab-solved-banner');
    const checkNumEl = document.getElementById('lab-solved-check-num');
    const vulnNameEl = document.getElementById('lab-solved-vuln-name');
    const titleEl = document.getElementById('lab-solved-check-title');

    if (!banner || !vulnNameEl || !titleEl) return;

    this._verifiedCheckIds.add(Number(checkId));

    if (checkNumEl) checkNumEl.textContent = `Check ${String(checkId).padStart(2, '0')}`;
    vulnNameEl.textContent = vulnerability || 'Broken Access Control';
    titleEl.textContent = title || `Check ${checkId}`;

    banner.classList.remove('-translate-y-36', 'opacity-0', 'pointer-events-none');
    banner.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

    this._playCelebrationChime();

    // Trigger update on lab-progress view if active
    window.dispatchEvent(new CustomEvent('lab-check-solved', {
      detail: { checkId: Number(checkId), title, vulnerability }
    }));

    if (this._labBannerTimer) clearTimeout(this._labBannerTimer);
    this._labBannerTimer = setTimeout(() => {
      this.hideLabSolvedBanner();
    }, 6500);
  },

  hideLabSolvedBanner() {
    const banner = document.getElementById('lab-solved-banner');
    if (!banner) return;
    banner.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    banner.classList.add('-translate-y-36', 'opacity-0', 'pointer-events-none');
    if (this._labBannerTimer) clearTimeout(this._labBannerTimer);
  },

  _playCelebrationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.11);
        osc.stop(ctx.currentTime + idx * 0.11 + 0.4);
      });
    } catch (e) {
      // Audio context might require interaction on some browsers
    }
  },

  // Background polling to catch external exploits (e.g. from Burp Suite, curl, Python)
  startLabWatcher() {
    if (this._labWatcherInterval) return;

    const checkAssessment = async () => {
      if (!this.token) return;
      try {
        const res = await fetch('/api/security-assessment', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const checks = data.checks || {};

        // If this is first poll, populate verified set without firing notification
        if (this._verifiedCheckIds.size === 0) {
          for (const [idStr, check] of Object.entries(checks)) {
            if (check.status === 'verified') {
              this._verifiedCheckIds.add(Number(idStr));
            }
          }
          return;
        }

        // Check for any newly verified checks
        for (const [idStr, check] of Object.entries(checks)) {
          const numId = Number(idStr);
          if (check.status === 'verified' && !this._verifiedCheckIds.has(numId)) {
            this._verifiedCheckIds.add(numId);
            this.showLabSolvedBanner(numId, check.title, check.vulnerabilityName);
          }
        }
      } catch (err) {
        // Silent catch for background poll
      }
    };

    // Initial check right away
    checkAssessment();

    // Check every 4 seconds
    this._labWatcherInterval = setInterval(checkAssessment, 4000);
  },

  stopLabWatcher() {
    if (this._labWatcherInterval) {
      clearInterval(this._labWatcherInterval);
      this._labWatcherInterval = null;
    }
    this._verifiedCheckIds.clear();
  }
};

window.State = State;
