// Login View Component matching 1._login_accesshub/screen.png
const LoginView = {
  render() {
    return `
      <div class="min-h-screen w-full bg-surface flex items-center justify-center p-space-md relative overflow-hidden">
        <!-- Subtle Ambient Backdrop Glow Elements -->
        <div class="absolute -top-16 -left-12 w-64 h-64 rounded-full bg-primary-container/10 blur-3xl pointer-events-none -z-10"></div>
        <div class="absolute -bottom-16 -right-12 w-72 h-72 rounded-full bg-surface-container-high/60 blur-3xl pointer-events-none -z-10"></div>

        <main class="w-full max-w-lg z-10">
          <div class="flex flex-col w-full">
            <!-- Main Authentication Panel -->
            <div class="w-full bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-10 transition-all duration-300 border border-outline-variant/30">
              <!-- Brand & Security Header -->
              <div class="flex flex-col items-center text-center mb-8">
                <!-- Brand Glyph / Monogram -->
                <div class="relative flex items-center justify-center w-14 h-14 rounded-xl bg-primary shadow-md mb-4 group cursor-pointer">
                  <svg class="w-8 h-8 text-on-primary transform transition-transform group-hover:scale-105 duration-200" fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 3L4 9V15C4 22.38 9.12 29.22 16 31C22.88 29.22 28 22.38 28 15V9L16 3Z" fill="currentColor" fill-opacity="0.2"></path>
                    <path d="M16 6.5L7 11V15.5C7 21.03 10.84 26.16 16 27.5C21.16 26.16 25 21.03 25 15.5V11L16 6.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path>
                    <path d="M12 16.5L14.8 19.5L20 13.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"></path>
                  </svg>
                  <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-secondary"></span>
                  </span>
                </div>

                <!-- Identity Hierarchy -->
                <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Zero-Trust SSO Gateway
                </div>
                <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                  AccessHub Enterprise
                </h1>
                <p class="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-sm">
                  Sign in to access your corporate workspace, directories, and unified compliance portal.
                </p>
              </div>

              <!-- Error Alert Banner -->
              <div id="login-error-alert" class="hidden mb-4 p-3.5 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-start gap-2.5 border border-error/20">
                <span class="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">error</span>
                <span id="login-error-message" class="flex-1 font-medium">Invalid email or password. Access denied.</span>
              </div>

              <!-- Success Alert Banner -->
              <div id="login-success-alert" class="hidden mb-4 p-3.5 rounded-lg bg-secondary-container/30 text-on-secondary-container font-body-sm text-body-sm flex items-center gap-2.5 border border-secondary/20">
                <span class="material-symbols-outlined text-[20px] text-secondary shrink-0">check_circle</span>
                <span id="login-success-message" class="flex-1 font-medium">Identity verified. Redirecting to workspace...</span>
              </div>

              <!-- Authentication Form -->
              <form class="space-y-4" id="loginForm" onsubmit="LoginView.handleSubmit(event)">
                <!-- Work Email Field -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="font-label-lg text-label-lg text-on-surface" for="workEmail">
                      Work Email Address
                    </label>
                    <span class="font-label-sm text-label-sm text-outline font-normal">Corporate ID</span>
                  </div>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                      mail
                    </span>
                    <input 
                      class="w-full h-11 pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm placeholder:text-outline border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-150" 
                      id="workEmail" 
                      name="email" 
                      placeholder="alex.mercer@accesshub.internal" 
                      required 
                      type="email" 
                      value="employee1@accesshub.local"
                    />
                  </div>
                </div>

                <!-- Password Field -->
                <div class="space-y-1.5 pt-1">
                  <div class="flex items-center justify-between">
                    <label class="font-label-lg text-label-lg text-on-surface" for="loginPassword">
                      Account Password
                    </label>
                    <a class="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant transition-colors" href="javascript:void(0)" onclick="State.showToast('Contact internal IT Self-Service Password Reset (SSPR) at ext. 4100', 'info')">
                      Forgot password?
                    </a>
                  </div>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3.5 text-on-surface-variant pointer-events-none text-[20px]">
                      lock
                    </span>
                    <input 
                      class="w-full h-11 pl-11 pr-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm placeholder:text-outline border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-150" 
                      id="loginPassword" 
                      name="password" 
                      placeholder="••••••••••••" 
                      required 
                      type="password" 
                      value="Employee123!"
                    />
                    <button 
                      aria-label="Toggle password visibility" 
                      class="absolute right-3.5 flex items-center justify-center text-on-surface-variant hover:text-on-surface focus:outline-none transition-colors" 
                      id="togglePasswordBtn" 
                      onclick="LoginView.togglePasswordVisibility()" 
                      type="button"
                    >
                      <span class="material-symbols-outlined text-[20px]" id="pwdIcon">visibility</span>
                    </button>
                  </div>
                </div>

                <!-- Controls: Remember Device -->
                <div class="flex items-center justify-between pt-1 pb-1">
                  <label class="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input checked class="w-4 h-4 rounded text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer accent-primary" id="rememberDevice" type="checkbox"/>
                    <span class="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      Trust this managed device for 30 days
                    </span>
                  </label>
                  <div class="hidden sm:flex items-center gap-1 text-on-surface-variant" title="Encrypted session token with IP binding">
                    <span class="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                    <span class="font-label-sm text-label-sm text-secondary">Secured</span>
                  </div>
                </div>

                <!-- Primary Action -->
                <div class="pt-2">
                  <button 
                    class="relative w-full h-11 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg shadow-md hover:bg-on-primary-fixed-variant active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 transition-all duration-150 flex items-center justify-center gap-2 overflow-hidden" 
                    id="submitBtn" 
                    type="submit"
                  >
                    <span class="flex items-center gap-2" id="btnLabel">
                      Sign In to Workspace
                      <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </span>
                    <div class="hidden items-center gap-2" id="btnSpinner">
                      <svg class="animate-spin h-5 w-5 text-on-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                      </svg>
                      <span>Verifying Identity...</span>
                    </div>
                  </button>
                </div>
              </form>

              <!-- SSO Divider -->
              <div class="relative my-7 flex items-center justify-center">
                <div class="w-full bg-surface-container-high h-[1px]"></div>
                <span class="absolute bg-surface-container-lowest px-3 font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Or federate with corporate ID
                </span>
              </div>

              <!-- SSO Providers Container -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Okta SSO -->
                <button 
                  class="h-11 px-4 bg-surface-container-lowest hover:bg-surface-container-low active:bg-surface-container text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm border border-outline-variant/40 flex items-center justify-center gap-2.5 transition-all duration-150 group" 
                  onclick="LoginView.quickFill('employee1@accesshub.local', 'Employee123!')" 
                  type="button"
                  title="Quick fill Employee 1 credentials"
                >
                  <svg class="w-5 h-5 flex-shrink-0 text-on-surface group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5"></circle>
                    <circle cx="12" cy="12" fill="currentColor" r="4"></circle>
                  </svg>
                  <span class="truncate">Okta Verify</span>
                </button>

                <!-- Google Workspace SSO -->
                <button 
                  class="h-11 px-4 bg-surface-container-lowest hover:bg-surface-container-low active:bg-surface-container text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm border border-outline-variant/40 flex items-center justify-center gap-2.5 transition-all duration-150 group" 
                  onclick="LoginView.quickFill('admin@accesshub.local', 'Admin123!')" 
                  type="button"
                  title="Quick fill Administrator credentials"
                >
                  <svg class="w-4 h-4 flex-shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4"></path>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853"></path>
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05"></path>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"></path>
                  </svg>
                  <span class="truncate">Google Cloud</span>
                </button>
              </div>

              <!-- Test Accounts Helper Pills for Educational Lab -->
              <div class="mt-5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
                <span class="font-bold text-on-surface block mb-1.5">Lab Test Accounts (Click to Fill):</span>
                <div class="flex flex-wrap gap-1.5">
                  <button type="button" class="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-medium" onclick="LoginView.quickFill('employee1@accesshub.local', 'Employee123!')">
                    Emp 1 (Alex Mercer)
                  </button>
                  <button type="button" class="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-medium" onclick="LoginView.quickFill('employee2@accesshub.local', 'Employee123!')">
                    Emp 2 (Sarah Jenkins)
                  </button>
                  <button type="button" class="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-medium" onclick="LoginView.quickFill('admin@accesshub.local', 'Admin123!')">
                    Admin (James Thornton)
                  </button>
                </div>
              </div>
            </div>

            <!-- Security, Compliance & Versioning Footer -->
            <div class="mt-8 flex flex-col items-center text-center space-y-3">
              <!-- Compliance Micro-Badges -->
              <div class="flex flex-wrap items-center justify-center gap-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  <span class="material-symbols-outlined text-[14px]">lock</span>
                  TLS 1.3 Strict
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  <span class="material-symbols-outlined text-[14px]">shield</span>
                  SOC2 Type II
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  <span class="material-symbols-outlined text-[14px]">domain</span>
                  FIPS 140-3
                </span>
              </div>

              <!-- System Notice & Legal Links -->
              <div class="text-on-surface-variant font-body-sm text-body-sm space-y-1">
                <p>AccessHub Enterprise v2.4.9 • Authorized corporate personnel only.</p>
                <p class="text-outline">
                  Unauthorized access attempts are monitored, logged, and investigated under corporate policy 402-A.
                </p>
                <div class="flex items-center justify-center gap-3 pt-1 font-label-sm text-label-sm">
                  <a class="text-on-surface-variant hover:text-primary transition-colors" href="javascript:void(0)">Privacy Policy</a>
                  <span>•</span>
                  <a class="text-on-surface-variant hover:text-primary transition-colors" href="javascript:void(0)">Terms of Governance</a>
                  <span>•</span>
                  <a class="text-on-surface-variant hover:text-primary transition-colors" href="javascript:void(0)">IT Service Desk</a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  },

  togglePasswordVisibility() {
    const pwdInput = document.getElementById('loginPassword');
    const pwdIcon = document.getElementById('pwdIcon');
    if (!pwdInput || !pwdIcon) return;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      pwdIcon.textContent = 'visibility_off';
    } else {
      pwdInput.type = 'password';
      pwdIcon.textContent = 'visibility';
    }
  },

  quickFill(email, password) {
    const emailInput = document.getElementById('workEmail');
    const pwdInput = document.getElementById('loginPassword');
    if (emailInput) emailInput.value = email;
    if (pwdInput) pwdInput.value = password;
    this.hideAlerts();
  },

  hideAlerts() {
    const errorAlert = document.getElementById('login-error-alert');
    const successAlert = document.getElementById('login-success-alert');
    if (errorAlert) errorAlert.classList.add('hidden');
    if (successAlert) successAlert.classList.add('hidden');
  },

  async handleSubmit(event) {
    event.preventDefault();
    this.hideAlerts();

    const email = document.getElementById('workEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btnLabel = document.getElementById('btnLabel');
    const btnSpinner = document.getElementById('btnSpinner');
    const errorAlert = document.getElementById('login-error-alert');
    const errorMsg = document.getElementById('login-error-message');
    const successAlert = document.getElementById('login-success-alert');
    const successMsg = document.getElementById('login-success-message');

    btnLabel.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
    btnSpinner.classList.add('flex');

    try {
      const user = await State.login(email, password);
      successMsg.textContent = `Identity verified for ${user.name}. Launching workspace...`;
      successAlert.classList.remove('hidden');

      setTimeout(() => {
        window.location.hash = '#/dashboard';
      }, 500);
    } catch (err) {
      btnLabel.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
      btnSpinner.classList.remove('flex');

      errorMsg.textContent = err.message || 'Invalid email or password. Access denied.';
      errorAlert.classList.remove('hidden');
    }
  }
};

window.LoginView = LoginView;
