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
    } else {
      localStorage.removeItem('accesshub_user');
      localStorage.removeItem('accesshub_token');
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
  }
};

window.State = State;
