(function () {
  const CONFIG = window.SUPABASE_CONFIG || {};
  const pageName = getPageName();
  const protectedPages = new Set(["index.html", "results.html", "history.html"]);
  const authPage = "auth.html";
  const state = {
    client: null,
    session: null,
    user: null,
    profile: null,
    initialized: false
  };

  function getPageName() {
    const path = window.location.pathname;
    const last = path.split("/").pop();
    return last || "index.html";
  }

  function normalizeDigits(value) {
    return String(value)
      .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  }

  function normalizePhone(value) {
    const digits = normalizeDigits(value).replace(/\D/g, "");
    if (digits.startsWith("09") && digits.length === 11) return digits;
    if (digits.startsWith("989") && digits.length === 12) return `0${digits.slice(2)}`;
    if (digits.startsWith("9") && digits.length === 10) return `0${digits}`;
    return digits;
  }

  function sanitizePassword(value) {
    const normalized = normalizeDigits(value);
    let replacementIndex = 0;
    return Array.from(normalized).map(char => {
      if (/[A-Za-z0-9]/.test(char)) return char;
      const digit = String((replacementIndex % 8) + 1);
      replacementIndex += 1;
      return digit;
    }).join("").slice(0, 30);
  }

  function isValidPassword(value) {
    return /^[A-Za-z0-9]{8,30}$/.test(value);
  }

  function isConfigured() {
    return Boolean(CONFIG.url && CONFIG.anonKey && window.supabase?.createClient);
  }

  function createClient() {
    if (state.client || !isConfigured()) return state.client;
    state.client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return state.client;
  }

  function phoneToEmail(phone) {
    const normalized = normalizePhone(phone);
    return `${normalized}@mobile.local`;
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(node => {
      node.textContent = value || "";
    });
  }

  function setVisibility(selector, visible) {
    document.querySelectorAll(selector).forEach(node => {
      node.hidden = !visible;
    });
  }

  function ensureToastRoot() {
    let root = document.getElementById("appToastRoot");
    if (root) return root;
    root = document.createElement("div");
    root.id = "appToastRoot";
    root.className = "toast-root";
    document.body.appendChild(root);
    return root;
  }

  function showToast(message, tone = "neutral", options = {}) {
    if (!message) return;
    const root = ensureToastRoot();
    const toast = document.createElement("div");
    const duration = options.duration ?? (tone === "danger" ? 5200 : 3600);
    toast.className = `toast toast-${tone}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-text"></span>
        <button class="toast-close" type="button" aria-label="بستن">
          <i class="uil uil-times"></i>
        </button>
      </div>
    `;
    toast.querySelector(".toast-text").textContent = message;
    root.appendChild(toast);

    let startX = 0;
    let currentX = 0;
    let dragging = false;
    let timerId = window.setTimeout(closeToast, duration);

    function setOffset(value) {
      currentX = Math.max(0, value);
      toast.style.transform = `translateX(${currentX}px)`;
      toast.style.opacity = String(Math.max(0.2, 1 - (currentX / 180)));
    }

    function closeToast() {
      window.clearTimeout(timerId);
      toast.classList.add("is-closing");
      toast.style.transform = "translateX(120%)";
      toast.style.opacity = "0";
      window.setTimeout(() => toast.remove(), 220);
    }

    toast.querySelector(".toast-close")?.addEventListener("click", closeToast);

    toast.addEventListener("pointerdown", event => {
      dragging = true;
      startX = event.clientX;
      currentX = 0;
      toast.style.transition = "none";
      toast.setPointerCapture(event.pointerId);
      window.clearTimeout(timerId);
    });

    toast.addEventListener("pointermove", event => {
      if (!dragging) return;
      setOffset(event.clientX - startX);
    });

    function releaseToast(event) {
      if (!dragging) return;
      dragging = false;
      toast.style.transition = "";
      if (currentX > 90) {
        closeToast();
        return;
      }
      setOffset(0);
      timerId = window.setTimeout(closeToast, 2200);
      if (event?.pointerId !== undefined && toast.hasPointerCapture(event.pointerId)) {
        toast.releasePointerCapture(event.pointerId);
      }
    }

    toast.addEventListener("pointerup", releaseToast);
    toast.addEventListener("pointercancel", releaseToast);

    requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });
  }

  function setFormMessage(targetId, message, tone = "neutral") {
    const element = document.getElementById(targetId);
    if (element) element.hidden = true;
    showToast(message, tone);
  }

  function showGlobalMessage(message, tone = "warning") {
    const element = document.querySelector("[data-global-message]");
    if (element) element.hidden = true;
    showToast(message, tone);
  }

  function isProtectedPage() {
    return protectedPages.has(pageName);
  }

  function getNextUrl() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next || "index.html";
  }

  function redirectToAuth() {
    const current = pageName || "index.html";
    window.location.href = `auth.html?next=${encodeURIComponent(current)}`;
  }

  async function loadProfile() {
    const client = createClient();
    if (!client || !state.user) return null;
    const { data, error } = await client
      .from("profiles")
      .select("id, mobile, first_name, last_name, company_name, created_at")
      .eq("id", state.user.id)
      .maybeSingle();

    if (error) return null;
    state.profile = data || null;
    return state.profile;
  }

  function syncAuthUI() {
    const isAuthed = Boolean(state.user);
    const profile = state.profile || {};
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "کاربر";
    setText("[data-user-name]", fullName);
    setText("[data-user-mobile]", profile.mobile || "");
    setText("[data-company-name]", profile.company_name || "بدون نام شرکت");
    setVisibility("[data-auth-only]", isAuthed);
    setVisibility("[data-guest-only]", !isAuthed);
    document.body.classList.toggle("is-authenticated", isAuthed);
  }

  function mapAuthError(error) {
    const message = String(error?.message || error || "خطای ناشناخته");
    if (message.includes("Invalid login credentials")) return "شماره موبایل یا رمز عبور درست نیست.";
    if (message.includes("User already registered")) return "برای این شماره قبلاً حساب ساخته شده است.";
    if (message.includes("Password should be at least")) return "رمز عبور باید بین ۸ تا ۳۰ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد.";
    if (message.includes("duplicate key value")) return "این شماره موبایل قبلاً ثبت شده است.";
    return message;
  }

  async function upsertProfile(userId, payload) {
    const client = createClient();
    if (!client) return { error: "اتصال به دیتابیس برقرار نیست." };
    const { error } = await client.from("profiles").upsert({
      id: userId,
      mobile: normalizePhone(payload.mobile),
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      company_name: payload.companyName.trim()
    });
    if (error) return { error: mapAuthError(error) };
    await loadProfile();
    syncAuthUI();
    return { error: null };
  }

  async function signInWithPhonePassword(mobile, password) {
    const client = createClient();
    if (!client) return { error: "تنظیمات Supabase هنوز کامل نشده است." };
    const normalizedPhone = normalizePhone(mobile);
    const sanitizedPassword = sanitizePassword(password);
    if (!isValidPassword(sanitizedPassword)) {
      return { error: "رمز عبور باید بین ۸ تا ۳۰ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد." };
    }
    const { data, error } = await client.auth.signInWithPassword({
      email: phoneToEmail(normalizedPhone),
      password: sanitizedPassword
    });
    if (error) return { error: mapAuthError(error) };
    state.session = data.session || null;
    state.user = data.user || null;
    await loadProfile();
    syncAuthUI();
    return { error: null };
  }

  async function signUpWithPhoneProfile(formData) {
    const client = createClient();
    if (!client) return { error: "تنظیمات Supabase هنوز کامل نشده است." };
    const normalizedPhone = normalizePhone(formData.mobile);
    if (normalizedPhone.length !== 11) return { error: "شماره موبایل را کامل وارد کن." };
    const sanitizedPassword = sanitizePassword(formData.password);
    if (!isValidPassword(sanitizedPassword)) {
      return { error: "رمز عبور باید بین ۸ تا ۳۰ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد." };
    }

    const { data, error } = await client.auth.signUp({
      email: phoneToEmail(normalizedPhone),
      password: sanitizedPassword,
      options: {
        data: {
          mobile: normalizedPhone,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          company_name: formData.companyName.trim()
        }
      }
    });

    if (error) return { error: mapAuthError(error) };

    if (!data.user?.id) {
      return { error: "ثبت نام کامل نشد. تنظیمات احراز هویت را بررسی کن." };
    }

    const profileResult = await upsertProfile(data.user.id, {
      mobile: normalizedPhone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      companyName: formData.companyName
    });
    if (profileResult.error) return profileResult;

    if (!data.session) {
      return signInWithPhonePassword(normalizedPhone, sanitizedPassword);
    }

    state.session = data.session;
    state.user = data.user;
    await loadProfile();
    syncAuthUI();
    return { error: null };
  }

  async function signOut() {
    const client = createClient();
    if (!client) return;
    await client.auth.signOut();
    state.session = null;
    state.user = null;
    state.profile = null;
    syncAuthUI();
    redirectToAuth();
  }

  async function saveAnalysis(result) {
    const client = createClient();
    if (!client || !state.user) return { error: "برای ذخیره تست باید وارد حساب شوید." };
    const payload = {
      user_id: state.user.id,
      input: result.input,
      result,
      final_diagnosis: result.finalDiagnosis,
      confidence: result.confidence,
      tdcg: result.tdcg
    };
    const { error } = await client.from("analyses").insert(payload);
    return { error: error ? mapAuthError(error) : null };
  }

  async function listAnalyses(options = {}) {
    const client = createClient();
    if (!client || !state.user) return { data: [], error: "برای مشاهده سوابق باید وارد حساب شوید." };
    const limit = Number(options.limit || 20);
    const offset = Number(options.offset || 0);
    const { data, error } = await client
      .from("analyses")
      .select("id, input, result, final_diagnosis, confidence, tdcg, created_at")
      .range(offset, Math.max(offset, offset + limit - 1))
      .order("created_at", { ascending: false });
    return {
      data: data || [],
      error: error ? mapAuthError(error) : null
    };
  }

  function bindAuthForms() {
    const authTabs = document.querySelectorAll("[data-auth-tab]");
    const tabPanels = document.querySelectorAll("[data-auth-panel]");
    authTabs.forEach(button => {
      button.addEventListener("click", () => {
        const active = button.dataset.authTab;
        authTabs.forEach(item => item.classList.toggle("is-active", item === button));
        tabPanels.forEach(panel => panel.hidden = panel.dataset.authPanel !== active);
      });
    });

    document.getElementById("loginForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const passwordInput = formElement.querySelector('input[name="password"]');
      if (passwordInput) passwordInput.value = sanitizePassword(passwordInput.value);
      const form = new FormData(formElement);
      setFormMessage("loginMessage", "در حال ورود...", "neutral");
      const { error } = await signInWithPhonePassword(form.get("mobile"), form.get("password"));
      if (error) {
        setFormMessage("loginMessage", error, "danger");
        return;
      }
      window.location.href = getNextUrl();
    });

    document.getElementById("registerForm")?.addEventListener("submit", async event => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const passwordInput = formElement.querySelector('input[name="password"]');
      const confirmPasswordInput = formElement.querySelector('input[name="confirmPassword"]');
      if (passwordInput) passwordInput.value = sanitizePassword(passwordInput.value);
      if (confirmPasswordInput) confirmPasswordInput.value = sanitizePassword(confirmPasswordInput.value);
      const form = new FormData(formElement);
      const password = String(form.get("password") || "");
      const confirmPassword = String(form.get("confirmPassword") || "");
      if (!isValidPassword(password)) {
        setFormMessage("registerMessage", "رمز عبور باید بین ۸ تا ۳۰ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد.", "danger");
        return;
      }
      if (password !== confirmPassword) {
        setFormMessage("registerMessage", "تکرار رمز عبور با رمز اصلی یکی نیست.", "danger");
        return;
      }
      setFormMessage("registerMessage", "در حال ثبت نام...", "neutral");
      const { error } = await signUpWithPhoneProfile({
        mobile: form.get("mobile"),
        firstName: String(form.get("firstName") || ""),
        lastName: String(form.get("lastName") || ""),
        companyName: String(form.get("companyName") || ""),
        password
      });
      if (error) {
        setFormMessage("registerMessage", error, "danger");
        return;
      }
      setFormMessage("registerMessage", "حساب شما ساخته شد و الان وارد شدید.", "success");
      window.location.href = getNextUrl();
    });

    document.querySelectorAll("[data-password-input]").forEach(input => {
      input.addEventListener("input", () => {
        const previousLength = input.value.length;
        const cursor = input.selectionStart ?? previousLength;
        const sanitized = sanitizePassword(input.value);
        if (sanitized === input.value) return;
        input.value = sanitized;
        const nextPos = Math.min(cursor - Math.max(0, previousLength - sanitized.length), sanitized.length);
        input.setSelectionRange(nextPos, nextPos);
      });

      input.addEventListener("blur", () => {
        input.value = sanitizePassword(input.value);
      });
    });

    document.querySelectorAll("[data-password-toggle]").forEach(button => {
      button.addEventListener("click", () => {
        const input = button.parentElement?.querySelector("input");
        const icon = button.querySelector("i");
        if (!input || !icon) return;
        const nextType = input.type === "password" ? "text" : "password";
        input.type = nextType;
        const isVisible = nextType === "text";
        button.setAttribute("aria-pressed", String(isVisible));
        button.setAttribute("aria-label", isVisible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور");
        icon.className = `uil ${isVisible ? "uil-eye-slash" : "uil-eye"}`;
      });
    });
  }

  function bindCommonActions() {
    document.querySelectorAll("[data-logout]").forEach(button => {
      button.addEventListener("click", signOut);
    });
  }

  async function boot() {
    bindCommonActions();

    if (!isConfigured()) {
      showGlobalMessage("برای فعال شدن لاگین و ذخیره سوابق، فایل supabase-config.js را با URL و ANON KEY پروژه کامل کن.", "warning");
      if (pageName === authPage) bindAuthForms();
      state.initialized = true;
      syncAuthUI();
      return;
    }

    const client = createClient();
    const { data } = await client.auth.getSession();
    state.session = data.session || null;
    state.user = data.session?.user || null;
    if (state.user) await loadProfile();

    client.auth.onAuthStateChange(async (_event, session) => {
      state.session = session || null;
      state.user = session?.user || null;
      state.profile = null;
      if (state.user) await loadProfile();
      syncAuthUI();
      if (!state.user && isProtectedPage()) redirectToAuth();
    });

    if (pageName === authPage) {
      bindAuthForms();
      if (state.user) {
        window.location.href = getNextUrl();
        return;
      }
    }

    if (isProtectedPage() && !state.user) {
      redirectToAuth();
      return;
    }

    state.initialized = true;
    syncAuthUI();
  }

  window.AppAuth = {
    ready: boot(),
    isConfigured,
    isAuthenticated: () => Boolean(state.user),
    getUser: () => state.user,
    getProfile: () => state.profile,
    showGlobalMessage,
    saveAnalysis,
    listAnalyses
    ,
    showToast
  };
}());
