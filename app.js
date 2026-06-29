function $(id) { return document.getElementById(id); }

const sampleSelect = $("sampleSelect");
const fields = ["H2", "CH4", "C2H2", "C2H4", "C2H6", "CO", "CO2"];
const methodLabels = {
  IEEE: "IEEE / سطح خطر",
  IEC: "IEC 60599",
  ROGERS: "Rogers",
  DORENBERG: "Doernenberg",
  DUVAL: "Duval Approx",
  POTG: "POTG Approx"
};

function toPersianDigits(value) {
  return String(value).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

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

function setFieldValue(id, value) {
  $(id).value = formatNumber(value);
}

function attachPersianNumericBehavior() {
  fields.forEach(key => {
    const input = $(key);
    input.addEventListener("input", () => {
      const numericValue = parseNumericInput(input.value);
      input.dataset.numericValue = String(numericValue);
    });
    input.addEventListener("blur", () => {
      input.value = formatNumber(parseNumericInput(input.value));
    });
    input.addEventListener("focus", () => {
      input.value = normalizeDigits(input.value);
    });
  });
}

function initSamples() {
  $("sampleCountBadge").textContent = formatNumber(thesisSamples.length);
  thesisSamples.forEach(sample => {
    const option = document.createElement("option");
    option.value = sample.id;
    option.textContent = `${formatNumber(sample.id)}. ${sample.name}`;
    sampleSelect.appendChild(option);
  });
}

function loadSample(id) {
  const sample = thesisSamples.find(s => s.id === Number(id));
  if (!sample) return;
  fields.forEach(key => setFieldValue(key, sample.gases[key]));
  analyzeAndRender();
}

function getFormGases() {
  const gases = {};
  fields.forEach(key => gases[key] = parseNumericInput($(key).value));
  return gases;
}

function renderSummary(result) {
  $("summary").innerHTML = `
    <div class="summary-item"><span>تشخیص نهایی</span><strong>${formatMixedLabel(result.finalDiagnosis)}</strong></div>
    <div class="summary-item"><span>سطح اعتماد</span><strong>${result.confidence}</strong></div>
    <div class="summary-item"><span>TDCG</span><strong>${formatNumber(result.tdcg)}</strong></div>
    <div class="summary-item"><span>اقدام پیشنهادی</span><strong>${result.recommendation}</strong></div>
  `;
}

function renderMethods(result) {
  const methodsHtml = Object.entries(result.methods).map(([key, value]) => `
    <div class="method-card"><span>${methodLabels[key]}</span><strong>${formatMixedLabel(value)}</strong></div>
  `).join("");

  const p = result.potgPercentages;
  const r = result.ratios;
  $("methodResults").innerHTML = methodsHtml + `
    <div class="method-card"><span>درصدهای POTG</span><strong>H2:${formatNumber(p.H2, 2)}% / CH4:${formatNumber(p.CH4, 2)}% / C2H2:${formatNumber(p.C2H2, 2)}% / C2H4:${formatNumber(p.C2H4, 2)}%</strong></div>
    <div class="method-card"><span>نسبت‌های کلیدی</span><strong>X1:${formatNumber(r.x1_C2H2_C2H4, 4)} / X2:${formatNumber(r.x2_CH4_H2, 4)} / X3:${formatNumber(r.x3_C2H4_C2H6, 4)}</strong></div>
  `;
}

function analyzeAndRender() {
  const result = analyzeDGA(getFormGases());
  renderSummary(result);
  renderMethods(result);
}

function validateSamples() {
  let correct = 0;
  const rows = thesisSamples.map(sample => {
    const result = analyzeDGA(sample.gases);
    const appPotg = result.methods.POTG;
    const refPotg = sample.ref.POTG;
    const ok = appPotg === refPotg;
    if (ok) correct += 1;
    return `
      <tr>
        <td>${formatNumber(sample.id)}. ${sample.name}</td>
        <td>${formatMixedLabel(refPotg)}</td>
        <td>${formatMixedLabel(appPotg)}</td>
        <td class="${ok ? "ok" : "bad"}">${ok ? "درست" : "نیازمند اصلاح"}</td>
      </tr>
    `;
  }).join("");

  $("validationTable").innerHTML = rows;
  $("validationSummary").textContent = `نتیجه تست: ${formatNumber(correct)} از ${formatNumber(thesisSamples.length)} نمونه با POTG مرجع هم‌خوان است.`;
}

$("loadSampleBtn").addEventListener("click", () => loadSample(sampleSelect.value));
$("analyzeBtn").addEventListener("click", analyzeAndRender);
$("validateBtn").addEventListener("click", validateSamples);

attachPersianNumericBehavior();
initSamples();
loadSample(1);
validateSamples();
