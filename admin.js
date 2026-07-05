(function () {
  const state = {
    loading: false,
    rows: [],
    freeLimit: null,
    savingLimit: false,
    updatingUserId: null
  };

  function formatCount(value) {
    return Number(value || 0).toLocaleString("fa-IR");
  }

  function toPersianDigits(value) {
    return String(value ?? "").replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
  }

  function normalizeDigits(value) {
    return String(value)
      .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  }

  function formatDate(value) {
    if (!value) return "نامشخص";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "نامشخص";
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "نامشخص";
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseLimitInput(value) {
    const normalized = normalizeDigits(value).replace(/[^\d-]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }

  function setSummary(rows) {
    const totals = rows.reduce((acc, row) => {
      acc.users += 1;
      acc.analyses += Number(row.analysis_count || 0);
      acc.projects += Number(row.project_count || 0);
      return acc;
    }, { users: 0, analyses: 0, projects: 0 });

    const totalUsers = document.querySelector("[data-admin-total-users]");
    const totalAnalyses = document.querySelector("[data-admin-total-analyses]");
    const totalProjects = document.querySelector("[data-admin-total-projects]");
    if (totalUsers) totalUsers.textContent = formatCount(totals.users);
    if (totalAnalyses) totalAnalyses.textContent = formatCount(totals.analyses);
    if (totalProjects) totalProjects.textContent = formatCount(totals.projects);
  }

  function renderRows(rows) {
    const tbody = document.getElementById("adminTableBody");
    if (!tbody) return;
    tbody.innerHTML = rows.map(row => {
      const isUpdating = state.updatingUserId === row.user_id;
      const isPro = Boolean(row.is_pro);
      const buttonLabel = isPro ? "لغو Pro" : "اعطای Pro";
      const badgeLabel = isPro ? "Pro" : "رایگان";
      const badgeClass = isPro ? "is-pro" : "is-free";
      return `
        <tr>
          <td>
            <div class="admin-user-cell">
              <strong>${escapeHtml([row.first_name, row.last_name].filter(Boolean).join(" ") || "بدون نام")}</strong>
              <span>شناسه کاربر: ${escapeHtml(row.user_id || "-")}</span>
            </div>
          </td>
          <td>${escapeHtml(toPersianDigits(row.mobile || "-"))}</td>
          <td>${escapeHtml(row.company_name || "-")}</td>
          <td>${escapeHtml(formatDate(row.created_at))}</td>
          <td><span class="admin-status-badge ${badgeClass}">${escapeHtml(badgeLabel)}</span></td>
          <td>${escapeHtml(formatCount(row.analysis_count))}</td>
          <td>${escapeHtml(formatCount(row.project_count))}</td>
          <td>
            <button
              class="button-link admin-action-button"
              type="button"
              data-user-pro-toggle="${escapeHtml(row.user_id || "")}"
              data-next-pro="${String(!isPro)}"
              ${isUpdating ? "disabled" : ""}>
              ${escapeHtml(isUpdating ? "در حال ثبت..." : buttonLabel)}
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function syncStates() {
    const loading = document.getElementById("adminLoadingState");
    const empty = document.getElementById("adminEmptyState");
    const table = document.getElementById("adminTableSection");
    const refreshButton = document.getElementById("adminRefreshButton");
    const limitInput = document.getElementById("freeLimitInput");
    const limitSubmit = document.getElementById("freeLimitSubmit");
    if (loading) loading.hidden = !state.loading;
    if (empty) empty.hidden = state.loading || state.rows.length > 0;
    if (table) table.hidden = state.loading || state.rows.length === 0;
    if (refreshButton) refreshButton.disabled = state.loading;
    if (limitInput && state.freeLimit !== null && !state.savingLimit && document.activeElement !== limitInput) {
      limitInput.value = toPersianDigits(state.freeLimit);
    }
    if (limitSubmit) {
      limitSubmit.disabled = state.savingLimit;
      limitSubmit.textContent = state.savingLimit ? "در حال ذخیره..." : "ذخیره تنظیمات";
    }
  }

  async function loadUsageSettings() {
    const { data, error } = await window.AppAuth.getAdminUsageSettings();
    if (error) {
      window.AppAuth.showToast(error, "danger");
      return;
    }
    state.freeLimit = Number(data?.free_limit || 0);
    syncStates();
  }

  async function loadAdminData() {
    if (!window.AppAuth?.isAdmin?.()) return;
    state.loading = true;
    syncStates();

    const [{ data, error }, _settingsResult] = await Promise.all([
      window.AppAuth.getAdminUserActivity(),
      loadUsageSettings()
    ]);
    if (error) {
      state.loading = false;
      state.rows = [];
      syncStates();
      window.AppAuth.showToast(error, "danger");
      return;
    }

    state.rows = Array.isArray(data) ? data : [];
    state.loading = false;
    setSummary(state.rows);
    renderRows(state.rows);
    syncStates();

    const lastUpdated = document.getElementById("adminLastUpdatedText");
    if (lastUpdated) {
      lastUpdated.textContent = `آخرین بروزرسانی: ${formatDateTime(new Date().toISOString())}`;
    }
  }

  async function handleLimitSubmit(event) {
    event.preventDefault();
    const input = document.getElementById("freeLimitInput");
    const nextLimit = parseLimitInput(input?.value || "");
    if (nextLimit === null || nextLimit < 0) {
      window.AppAuth.showToast("محدودیت نسخه رایگان باید یک عدد صفر یا بزرگ‌تر باشد.", "warning");
      return;
    }

    state.savingLimit = true;
    syncStates();
    const { data, error } = await window.AppAuth.updateFreeAnalysisLimit(nextLimit);
    state.savingLimit = false;

    if (error) {
      syncStates();
      window.AppAuth.showToast(error, "danger");
      return;
    }

    state.freeLimit = Number(data?.free_limit || nextLimit);
    syncStates();
    window.AppAuth.showToast("سقف نسخه رایگان با موفقیت بروزرسانی شد.", "success");
  }

  async function handleUserProToggle(event) {
    const trigger = event.target.closest("[data-user-pro-toggle]");
    if (!trigger) return;
    const userId = String(trigger.dataset.userProToggle || "");
    const nextPro = String(trigger.dataset.nextPro || "") === "true";
    if (!userId) return;

    state.updatingUserId = userId;
    renderRows(state.rows);
    syncStates();

    const { error } = await window.AppAuth.setUserProStatus(userId, nextPro);
    state.updatingUserId = null;
    if (error) {
      renderRows(state.rows);
      syncStates();
      window.AppAuth.showToast(error, "danger");
      return;
    }

    state.rows = state.rows.map(row => (
      row.user_id === userId
        ? { ...row, is_pro: nextPro }
        : row
    ));
    renderRows(state.rows);
    syncStates();
    window.AppAuth.showToast(nextPro ? "دسترسی Pro برای کاربر فعال شد." : "دسترسی Pro از کاربر برداشته شد.", "success");
  }

  function bindLogoutModal() {
    const trigger = document.querySelector("[data-logout]");
    const modal = document.getElementById("logoutModal");
    const backdrop = document.getElementById("logoutBackdrop");
    const cancel = document.getElementById("logoutCancel");
    const confirm = document.getElementById("logoutConfirm");
    if (!trigger || !modal || !backdrop || !cancel || !confirm) return;

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }

    function openModal() {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
    }

    trigger.addEventListener("click", openModal);
    backdrop.addEventListener("click", closeModal);
    cancel.addEventListener("click", closeModal);
    confirm.addEventListener("click", async () => {
      closeModal();
      await window.AppAuth.signOut();
    });
  }

  function bindRefresh() {
    const button = document.getElementById("adminRefreshButton");
    if (!button) return;
    button.addEventListener("click", () => {
      loadAdminData();
    });
  }

  function bindSettingsForm() {
    document.getElementById("freeLimitForm")?.addEventListener("submit", handleLimitSubmit);
  }

  function bindUserActions() {
    document.getElementById("adminTableBody")?.addEventListener("click", handleUserProToggle);
  }

  async function boot() {
    await window.AppAuth?.ready;
    if (!window.AppAuth?.isAdmin?.()) return;
    bindLogoutModal();
    bindRefresh();
    bindSettingsForm();
    bindUserActions();
    loadAdminData();
  }

  boot();
}());
