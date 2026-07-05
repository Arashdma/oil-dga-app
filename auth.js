(function () {
  const CONFIG = window.SUPABASE_CONFIG || {};
  const ADMIN_MOBILES = new Set(["09366183493", "09126125786"]);
  const pageName = getPageName();
  const routePath = getRoutePath();
  const protectedPages = new Set(["index.html", "results.html", "history.html", "projects.html", "profile.html"]);
  const authPage = "auth.html";
  const state = {
    client: null,
    session: null,
    user: null,
    profile: null,
    usage: null,
    initialized: false
  };

  function getPageName() {
    const path = window.location.pathname;
    const last = path.split("/").pop();
    return last || "index.html";
  }

  function getRoutePath() {
    return window.location.pathname.replace(/\/+$/, "") || "/";
  }

  function isAdminPath() {
    return routePath.endsWith("/admin") || routePath.endsWith("/admin/index.html");
  }

  function getAppRelativePath(target) {
    return isAdminPath() ? `../${target}` : target;
  }

  function getCurrentAppPath() {
    if (isAdminPath()) return "admin/";
    return pageName || "index.html";
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(getAppRelativePath("sw.js")).catch(() => {});
    });
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
    const duration = Math.min(options.duration ?? 3000, 3000);
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
      timerId = window.setTimeout(closeToast, duration);
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
    return protectedPages.has(pageName) || isAdminPath();
  }

  function getNextUrl() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next || "index.html";
  }

  function redirectToAuth() {
    const current = getCurrentAppPath();
    window.location.href = `${getAppRelativePath(authPage)}?next=${encodeURIComponent(current)}`;
  }

  function goToAppPath(target) {
    window.location.href = getAppRelativePath(target);
  }

  async function loadProfile() {
    const client = createClient();
    if (!client || !state.user) return null;
    const { data, error } = await client
      .from("profiles")
      .select("id, mobile, first_name, last_name, company_name, analysis_count, is_pro, created_at")
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
    const isAdmin = isAdminProfile(profile);
    setText("[data-user-name]", fullName);
    setText("[data-user-mobile]", profile.mobile || "");
    setText("[data-company-name]", profile.company_name || "بدون نام شرکت");
    setVisibility("[data-auth-only]", isAuthed);
    setVisibility("[data-guest-only]", !isAuthed);
    setVisibility("[data-admin-only]", isAuthed && isAdmin);
    document.body.classList.toggle("is-authenticated", isAuthed);
  }

  function isAdminProfile(profile = state.profile) {
    return ADMIN_MOBILES.has(normalizePhone(profile?.mobile || ""));
  }

  async function getAnalysisUsageStatus() {
    const client = createClient();
    if (!client || !state.user) {
      return { data: null, error: "برای ادامه، ابتدا وارد حساب کاربری شوید." };
    }
    const { data, error } = await client.rpc("get_analysis_usage_status");
    const usage = Array.isArray(data) ? data[0] : data;
    if (!error && usage) {
      state.usage = usage;
      if (state.profile) {
        state.profile.analysis_count = Number(usage.analysis_count || 0);
        state.profile.is_pro = Boolean(usage.is_pro);
      }
    }
    if (!error && !usage) {
      return { data: null, error: "پروفایل کاربری شما تکمیل نشده است." };
    }
    return {
      data: usage || null,
      error: error ? mapAuthError(error) : null
    };
  }

  function mapAuthError(error) {
    const message = String(error?.message || error || "خطای ناشناخته");
    if (message.includes("ADMIN_ONLY")) return "این عملیات فقط برای مدیر سامانه مجاز است.";
    if (message.includes("INVALID_FREE_LIMIT")) return "مقدار محدودیت نسخه رایگان معتبر نیست.";
    if (message.includes("USER_NOT_FOUND")) return "کاربر مورد نظر پیدا نشد.";
    if (message.includes("PROJECT_NOT_FOUND")) return "ترانسفورماتور مورد نظر پیدا نشد یا دیگر در دسترس نیست.";
    if (message.includes("AUTH_REQUIRED")) return "برای ادامه، ابتدا وارد حساب کاربری شوید.";
    if (message.includes("PROFILE_NOT_FOUND")) return "پروفایل کاربری شما تکمیل نشده است.";
    if (message.includes("FREE_LIMIT_REACHED")) return "سقف نسخه رایگان شما تکمیل شده است.";
    if (message.includes("Invalid login credentials")) return "شماره تلفن همراه یا رمز عبور واردشده صحیح نیست.";
    if (message.includes("User already registered")) return "برای این شماره تلفن همراه، حساب کاربری قبلاً ایجاد شده است.";
    if (message.includes("Password should be at least")) return "رمز عبور باید بین ۸ تا ۳۰ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد.";
    if (message.includes("duplicate key value")) return "این شماره تلفن همراه قبلاً ثبت شده است.";
    return message;
  }

  function parseOptionalNumber(value) {
    const raw = normalizeDigits(String(value ?? "")).trim();
    if (!raw) return null;
    const normalized = raw.replace(/,/g, "").replace(/[^\d.-]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseOptionalInteger(value) {
    const parsed = parseOptionalNumber(value);
    if (parsed === null) return null;
    return Math.trunc(parsed);
  }

  function normalizeProjectPayload(payload) {
    const companyName = String(payload.companyName || "").trim();
    const stationName = String(payload.stationName || "").trim();
    const transformerNumber = String(payload.transformerNumber || "").trim();
    const transformerSerialNumber = String(payload.transformerSerialNumber || "").trim();
    const manufacturer = String(payload.manufacturer || "").trim();
    const extraNotes = String(payload.extraNotes || "").trim();

    if (!companyName) return { error: "نام شرکت را وارد نمایید." };
    if (!stationName) return { error: "نام ایستگاه برق را وارد نمایید." };
    if (!transformerNumber) return { error: "شماره ترانسفورماتور را وارد نمایید." };

    const manufacturedYear = parseOptionalInteger(payload.manufacturedYear);
    if (String(payload.manufacturedYear || "").trim() && manufacturedYear === null) {
      return { error: "سال ساخت را به‌صورت عددی وارد نمایید." };
    }

    return {
      error: null,
      data: {
        company_name: companyName,
        station_name: stationName,
        transformer_number: transformerNumber,
        transformer_serial_number: transformerSerialNumber || null,
        voltage_kv: parseOptionalNumber(payload.voltageKv),
        capacity_mva: parseOptionalNumber(payload.capacityMva),
        manufacturer: manufacturer || null,
        manufactured_year: manufacturedYear,
        extra_attributes: extraNotes ? { notes: extraNotes } : {}
      }
    };
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
    const firstName = String(formData.firstName || "").trim();
    if (!firstName) return { error: "نام را وارد نمایید." };
    const lastName = String(formData.lastName || "").trim();
    if (!lastName) return { error: "نام خانوادگی را وارد نمایید." };
    const normalizedPhone = normalizePhone(formData.mobile);
    if (normalizedPhone.length !== 11) return { error: "شماره تلفن همراه را به‌صورت کامل وارد نمایید." };
    const sanitizedPassword = sanitizePassword(formData.password);
    if (!sanitizedPassword) return { error: "رمز عبور را وارد نمایید." };
    if (!isValidPassword(sanitizedPassword)) {
      return { error: "رمز عبور باید بین ۸ تا ۳۰ کاراکتر و فقط شامل حروف و اعداد انگلیسی باشد." };
    }

    const { data, error } = await client.auth.signUp({
      email: phoneToEmail(normalizedPhone),
      password: sanitizedPassword,
      options: {
        data: {
          mobile: normalizedPhone,
          first_name: firstName,
          last_name: lastName,
          company_name: formData.companyName.trim()
        }
      }
    });

    if (error) return { error: mapAuthError(error) };

    if (!data.user?.id) {
      return { error: "فرآیند ثبت‌نام تکمیل نشد. تنظیمات احراز هویت را بررسی نمایید." };
    }

    const profileResult = await upsertProfile(data.user.id, {
      mobile: normalizedPhone,
      firstName,
      lastName,
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
    state.usage = null;
    syncAuthUI();
    redirectToAuth();
  }

  async function getAdminUserActivity() {
    const client = createClient();
    if (!client || !state.user) return { data: [], error: "برای مشاهده پنل ادمین، ابتدا وارد حساب کاربری شوید." };
    const { data, error } = await client.rpc("get_admin_user_activity");
    return {
      data: Array.isArray(data) ? data : [],
      error: error ? mapAuthError(error) : null
    };
  }

  async function getAdminUsageSettings() {
    const client = createClient();
    if (!client || !state.user) return { data: null, error: "برای مشاهده تنظیمات، ابتدا وارد حساب کاربری شوید." };
    const { data, error } = await client.rpc("get_admin_usage_settings");
    const settings = Array.isArray(data) ? data[0] : data;
    return {
      data: settings || null,
      error: error ? mapAuthError(error) : null
    };
  }

  async function updateFreeAnalysisLimit(limit) {
    const client = createClient();
    if (!client || !state.user) return { data: null, error: "برای ویرایش محدودیت، ابتدا وارد حساب کاربری شوید." };
    const parsedLimit = parseOptionalInteger(limit);
    if (parsedLimit === null || parsedLimit < 0) {
      return { data: null, error: "محدودیت نسخه رایگان باید یک عدد صفر یا بزرگ‌تر باشد." };
    }
    const { data, error } = await client.rpc("admin_set_free_analysis_limit", {
      p_limit: parsedLimit
    });
    const settings = Array.isArray(data) ? data[0] : data;
    return {
      data: settings || null,
      error: error ? mapAuthError(error) : null
    };
  }

  async function setUserProStatus(userId, isPro) {
    const client = createClient();
    if (!client || !state.user) return { data: null, error: "برای تغییر وضعیت Pro، ابتدا وارد حساب کاربری شوید." };
    const { data, error } = await client.rpc("admin_set_user_pro_status", {
      p_user_id: userId,
      p_is_pro: Boolean(isPro)
    });
    const result = Array.isArray(data) ? data[0] : data;
    return {
      data: result || null,
      error: error ? mapAuthError(error) : null
    };
  }

  async function saveAnalysis(result) {
    const client = createClient();
    if (!client || !state.user) return { error: "برای ذخیره‌سازی تحلیل، ابتدا وارد حساب کاربری شوید." };
    const projectId = Number(result?.projectId || 0);
    if (!projectId) return { error: "ترانسفورماتور مربوط به این تحلیل مشخص نشده است." };
    const payload = {
      project_id: projectId,
      input: result.input,
      result,
      final_diagnosis: result.finalDiagnosis,
      confidence: result.confidence,
      tdcg: result.tdcg,
      sampled_at: result.sampledAt || null,
      notes: result.sampleNotes || null
    };
    const { data, error } = await client.rpc("save_analysis_with_limit", {
      p_project_id: payload.project_id,
      p_input: payload.input,
      p_result: payload.result,
      p_final_diagnosis: payload.final_diagnosis,
      p_confidence: payload.confidence,
      p_tdcg: payload.tdcg,
      p_sampled_at: payload.sampled_at,
      p_notes: payload.notes
    });
    const response = Array.isArray(data) ? data[0] : data;
    if (error) return { error: mapAuthError(error), data: response || null };

    if (response) {
      state.usage = response;
      if (state.profile) {
        state.profile.analysis_count = Number(response.analysis_count || 0);
        state.profile.is_pro = Boolean(response.is_pro);
      }
    }

    if (!response?.saved && response?.error_code === "FREE_LIMIT_REACHED") {
      return {
        error: null,
        data: response,
        limitReached: true
      };
    }

    if (response && response.saved === false) {
      return {
        error: mapAuthError(response.error_code || "SAVE_FAILED"),
        data: response,
        limitReached: false
      };
    }

    return {
      error: null,
      data: response || null,
      limitReached: response?.error_code === "FREE_LIMIT_REACHED"
    };
  }

  async function listAnalyses(options = {}) {
    const client = createClient();
    if (!client || !state.user) return { data: [], error: "برای مشاهده سوابق، ابتدا وارد حساب کاربری شوید." };
    const limit = Number(options.limit || 20);
    const offset = Number(options.offset || 0);
    let query = client
      .from("analyses")
      .select("id, project_id, input, result, final_diagnosis, confidence, tdcg, sampled_at, created_at, projects!inner(id, archived_at, deleted_at)")
      .is("hidden_from_user_at", null)
      .is("projects.archived_at", null)
      .is("projects.deleted_at", null)
      .range(offset, Math.max(offset, offset + limit - 1));
    if (options.projectId) {
      query = query.eq("project_id", Number(options.projectId));
    }
    const { data, error } = await query.order("sampled_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    return {
      data: data || [],
      error: error ? mapAuthError(error) : null
    };
  }

  async function hideAnalysis(analysisId) {
    const client = createClient();
    if (!client || !state.user) return { error: "برای حذف سابقه، ابتدا وارد حساب کاربری شوید." };
    const { error } = await client
      .from("analyses")
      .update({ hidden_from_user_at: new Date().toISOString() })
      .eq("id", analysisId)
      .eq("user_id", state.user.id)
      .is("hidden_from_user_at", null);

    return { error: error ? mapAuthError(error) : null };
  }

  async function listProjects() {
    const client = createClient();
    if (!client || !state.user) return { data: [], error: "برای مشاهده ترانسفورماتورها، ابتدا وارد حساب کاربری شوید." };
    const { data, error } = await client
      .from("projects")
      .select("id, company_name, station_name, transformer_number, transformer_serial_number, voltage_kv, capacity_mva, manufacturer, manufactured_year, extra_attributes, created_at, updated_at")
      .is("archived_at", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return {
      data: data || [],
      error: error ? mapAuthError(error) : null
    };
  }

  async function getProject(projectId) {
    const client = createClient();
    if (!client || !state.user) return { data: null, error: "برای مشاهده جزئیات ترانسفورماتور، ابتدا وارد حساب کاربری شوید." };
    const { data, error } = await client
      .from("projects")
      .select("id, company_name, station_name, transformer_number, transformer_serial_number, voltage_kv, capacity_mva, manufacturer, manufactured_year, extra_attributes, created_at, updated_at")
      .eq("id", Number(projectId))
      .is("archived_at", null)
      .is("deleted_at", null)
      .maybeSingle();
    return {
      data: data || null,
      error: error ? mapAuthError(error) : null
    };
  }

  async function createProject(payload) {
    const client = createClient();
    if (!client || !state.user) return { error: "برای ثبت ترانسفورماتور، ابتدا وارد حساب کاربری شوید." };
    const normalized = normalizeProjectPayload(payload);
    if (normalized.error) return { error: normalized.error };
    const { data, error } = await client
      .from("projects")
      .insert({
        ...normalized.data,
        updated_at: new Date().toISOString()
      })
      .select("id, company_name, station_name, transformer_number, transformer_serial_number, voltage_kv, capacity_mva, manufacturer, manufactured_year, extra_attributes, created_at, updated_at")
      .single();
    return {
      data: data || null,
      error: error ? mapAuthError(error) : null
    };
  }

  async function updateProject(projectId, payload) {
    const client = createClient();
    if (!client || !state.user) return { error: "برای ویرایش ترانسفورماتور، ابتدا وارد حساب کاربری شوید." };
    const normalized = normalizeProjectPayload(payload);
    if (normalized.error) return { error: normalized.error };
    const { data, error } = await client
      .from("projects")
      .update({
        ...normalized.data,
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId)
      .eq("user_id", state.user.id)
      .is("archived_at", null)
      .is("deleted_at", null)
      .select("id, company_name, station_name, transformer_number, transformer_serial_number, voltage_kv, capacity_mva, manufacturer, manufactured_year, extra_attributes, created_at, updated_at")
      .single();
    return {
      data: data || null,
      error: error ? mapAuthError(error) : null
    };
  }

  async function deleteProject(projectId) {
    const client = createClient();
    if (!client || !state.user) return { error: "برای حذف ترانسفورماتور، ابتدا وارد حساب کاربری شوید." };
    const timestamp = new Date().toISOString();
    const { data, error } = await client
      .from("projects")
      .update({
        deleted_at: timestamp,
        updated_at: timestamp
      })
      .eq("id", Number(projectId))
      .eq("user_id", state.user.id)
      .is("archived_at", null)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    return {
      data: data || null,
      error: error ? mapAuthError(error) : (!data ? "ترانسفورماتور مورد نظر پیدا نشد یا قبلاً حذف شده است." : null)
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
      setFormMessage("loginMessage", "در حال ورود به سامانه...", "neutral");
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
        setFormMessage("registerMessage", "رمز عبور و تکرار آن یکسان نیست.", "danger");
        return;
      }
      setFormMessage("registerMessage", "در حال ثبت‌نام...", "neutral");
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
      setFormMessage("registerMessage", "حساب کاربری با موفقیت ایجاد شد و ورود انجام شد.", "success");
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

  async function boot() {
    if (!isConfigured()) {
      showGlobalMessage("برای فعال‌سازی ورود و ذخیره سوابق، فایل supabase-config.js را با URL و ANON KEY پروژه تکمیل نمایید.", "warning");
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
      state.usage = null;
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

    if (isAdminPath() && !isAdminProfile()) {
      showGlobalMessage("دسترسی به پنل مدیریت فقط برای حساب کاربری مجاز امکان‌پذیر است.", "danger");
      goToAppPath("index.html");
    }
  }

  window.AppAuth = {
    ready: boot(),
    isConfigured,
    isAuthenticated: () => Boolean(state.user),
    getUser: () => state.user,
    getProfile: () => state.profile,
    getUsage: () => state.usage,
    isAdmin: () => isAdminProfile(),
    showGlobalMessage,
    getAnalysisUsageStatus,
    saveAnalysis,
    listAnalyses,
    hideAnalysis,
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getAdminUserActivity,
    getAdminUsageSettings,
    updateFreeAnalysisLimit,
    setUserProStatus,
    signOut,
    showToast
  };

  registerServiceWorker();
}());
