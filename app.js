function $(id) { return document.getElementById(id); }

const fields = ["H2", "CH4", "C2H2", "C2H4", "C2H6", "CO", "CO2"];
const isResultsPage = window.location.pathname.endsWith("/results.html") || window.location.pathname.endsWith("results.html");
const STORAGE_KEY = "oilDgaLastInput";
const methodLabels = {
  IEEE: "IEEE",
  IEC: "IEC 60599",
  ROGERS: "Rogers",
  DORENBERG: "Doernenberg",
  DUVAL: "Duval",
  POTG: "POTG"
};
const methodOrder = ["ROGERS", "IEC", "POTG", "DUVAL", "DORENBERG", "IEEE"];

function normalizeDigits(value) {
  return String(value)
    .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function parseNumericInput(value) {
  const normalized = normalizeDigits(value).replace(/[^\d.]/g, "");
  return Number(normalized || 0);
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "نامشخص";
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

function formatMixedLabel(value) {
  return normalizeDigits(String(value)).replace(/\d+(\.\d+)?/g, match => {
    if (match.includes(".")) {
      const decimals = match.split(".")[1].length;
      return formatNumber(Number(match), decimals);
    }
    return formatNumber(Number(match));
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSeverityBadge(definition) {
  return `<span class="severity-badge severity-${definition.severityLevel}">${escapeHtml(definition.severityLabel)} ${getSeverityMark(definition.severityLevel)}</span>`;
}

function getSeverityMark(level) {
  if (level >= 4) return "🔴";
  if (level === 3) return "🟠";
  if (level === 2) return "🟡";
  return "🟢";
}

function isNeedsReview(rawValue) {
  return ["نیازمند بررسی", "نامشخص", "", null, undefined].includes(rawValue);
}

function createActionChips(text) {
  return String(text)
    .split(/[،.؛]/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(item => `<span class="action-chip">${escapeHtml(item)}</span>`)
    .join("");
}

function renderMethodCard(methodKey, rawValue) {
  const definition = getFaultDefinition(rawValue);
  const reviewClass = isNeedsReview(rawValue) ? " needs-review" : "";
  const displayValue = rawValue || "قابل تشخیص نیست";
  return `
    <article class="method-card severity-${definition.severityLevel}${reviewClass}">
      <span class="method-name">${escapeHtml(methodLabels[methodKey])}</span>
      <strong class="method-code">${escapeHtml(formatMixedLabel(displayValue))}</strong>
      <span class="method-family">${escapeHtml(definition.family)}</span>
    </article>
  `;
}

function getConsensus(result, finalDefinition) {
  const family = finalDefinition.family;
  const matches = Object.values(result.methods).filter(value => {
    const definition = getFaultDefinition(value);
    return definition.family === family && definition.family !== "نامشخص";
  }).length;

  return {
    matches,
    total: Object.keys(result.methods).length,
    family
  };
}

function renderConsensus(consensus) {
  const dots = Array.from({ length: consensus.total }, (_, index) => (
    `<span class="${index < consensus.matches ? "is-active" : ""}"></span>`
  )).join("");

  return `
    <div class="consensus-card">
      <p class="consensus-text">${formatNumber(consensus.matches)} از ${formatNumber(consensus.total)} روش توافق دارند: ${escapeHtml(consensus.family)}</p>
      <div class="dot-progress" aria-hidden="true">${dots}</div>
    </div>
  `;
}

function setFieldValue(id, value) {
  const element = $(id);
  if (element) element.value = formatNumber(value);
}

function attachPersianNumericBehavior() {
  fields.forEach(key => {
    const input = $(key);
    if (!input) return;
    input.addEventListener("input", () => {
      input.dataset.numericValue = String(parseNumericInput(input.value));
    });
    input.addEventListener("blur", () => {
      input.value = formatNumber(parseNumericInput(input.value));
    });
    input.addEventListener("focus", () => {
      input.value = normalizeDigits(input.value);
    });
  });
}

function getFormGases() {
  const gases = {};
  fields.forEach(key => {
    const element = $(key);
    gases[key] = element ? parseNumericInput(element.value) : 0;
  });
  return gases;
}

function persistCurrentInput(gases = getFormGases()) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(gases));
}

function getStoredInput() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderSummary(result) {
  if (!$("summary")) return;
  const definition = getFaultDefinition(result.finalDiagnosis);
  $("summary").innerHTML = `
    <article class="diagnosis-card severity-${definition.severityLevel}">
      <div class="diagnosis-top">
        ${renderSeverityBadge(definition)}
        <span class="confidence">اعتماد: ${escapeHtml(result.confidence)}</span>
      </div>
      <strong class="final-result-title">${escapeHtml(definition.title)}</strong>
      <p class="fault-family">خانواده: ${escapeHtml(definition.family)}</p>
      <p class="result-description">${escapeHtml(definition.description)}</p>
      <div class="tdcg-metric">
        <span>شاخص TDCG</span>
        <strong>${formatNumber(result.tdcg)}</strong>
      </div>
      <div class="warning-box">
        <i class="uil uil-exclamation-triangle"></i>
        <strong>${escapeHtml(result.recommendation)}</strong>
      </div>
    </article>
  `;
}

function renderMethods(result) {
  if (!$("methodResults")) return;
  const finalDefinition = getFaultDefinition(result.finalDiagnosis);
  const consensus = getConsensus(result, finalDefinition);
  const methodsHtml = methodOrder
    .map(key => renderMethodCard(key, result.methods[key]))
    .join("");
  $("methodResults").innerHTML = `
    ${methodsHtml}
    <div class="method-extra">
      ${renderConsensus(consensus)}
      <div class="recommendation-card">
        <h2><i class="uil uil-wrench"></i> اقدام پیشنهادی</h2>
        <div class="action-chips">${createActionChips(result.recommendation)}</div>
      </div>
    </div>
  `;
}

function analyzeAndRender() {
  const result = analyzeDGA(getFormGases());
  renderSummary(result);
  renderMethods(result);
}

function renderStoredAnalysis() {
  const storedInput = getStoredInput();
  if (!storedInput) {
    window.location.href = "index.html";
    return;
  }
  const result = analyzeDGA(storedInput);
  renderSummary(result);
  renderMethods(result);
}

function goToResults() {
  persistCurrentInput();
  window.location.href = "results.html";
}

function initEntryPage() {
  attachPersianNumericBehavior();
  $("analyzeBtn").addEventListener("click", goToResults);
}

function initResultsPage() {
  renderStoredAnalysis();
  const exportButton = document.querySelector(".export-button");
  if (exportButton) {
    exportButton.addEventListener("click", () => {
      if (navigator.share) {
        navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
        return;
      }
      window.print();
    });
  }
}

if (isResultsPage) {
  initResultsPage();
} else {
  initEntryPage();
}
