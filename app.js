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
let currentAnalysisResult = null;
let infoSheetState = null;

const methodInfoLibrary = {
  IEEE: {
    methodTitle: "این روش وضعیت کلی روغن را با مجموع گازهای قابل احتراق یا TDCG بررسی می کند.",
    methodDescription: "در پایان نامه آمده که IEEE C57.104 وقتی سابقه قبلی از تجهیز یا نمونه گیری در دسترس نیست هم برای برآورد سریع وضعیت مفید است و می تواند به صورت مستمر روند رشد گازها را پایش کند.",
    codeDetails: {
      "Level 1": "اگر TDCG کمتر از سطح یک باشد ترانسفورماتور از نظر شاخص کلی در وضعیت عادی قرار می گیرد؛ البته اگر یکی از گازها به تنهایی از حد خودش عبور کند باید باز هم بررسی انجام شود.",
      "Level 2": "این سطح نشان می دهد مقدار گازهای قابل احتراق از حالت عادی بیشتر شده و احتمال وجود یک یا چند عیب مطرح است؛ در نتیجه پایش و بازرسی دقیق تر لازم می شود.",
      "Level 3": "سطح سه نشان دهنده تجزیه قابل توجه روغن است و پایان نامه تاکید می کند در این وضعیت بررسی باید سریع تر و دقیق تر انجام شود چون احتمال وجود عیب فعال بالاست.",
      "Level 4": "در پایان نامه سطح چهار به عنوان وضعیت بسیار شدید تجزیه روغن معرفی شده و ادامه بهره برداری می تواند به خرابی ترانسفورماتور منجر شود."
    }
  },
  IEC: {
    methodTitle: "IEC 60599 با سه نسبت گازی، نوع خطای داخلی را به شش دسته اصلی تقسیم می کند.",
    methodDescription: "بر اساس پایان نامه، این استاندارد خطاهای PD، D1، D2، T1، T2 و T3 را با نسبت های C2H2/C2H4 ، CH4/H2 و C2H4/C2H6 ارزیابی می کند و ترکیبی از نسبت گازها، غلظت و روند رشد را مبنا قرار می دهد.",
    codeDetails: {
      PD: "در IEC، کد PD به تخلیه جزئی اشاره دارد؛ حالتی که معمولاً هیدروژن بیشتر دیده می شود و خطا هنوز در سطح قوس شدید قرار نگرفته است.",
      D1: "کد D1 در این استاندارد به تخلیه با انرژی کم یا جرقه های محدود اشاره دارد؛ وضعیتی جدی تر از PD که نیاز به پیگیری نزدیک تر دارد.",
      D2: "کد D2 در IEC یعنی تخلیه با انرژی زیاد. پایان نامه این حالت را معادل تخلیه یا قوس شدید می داند؛ جایی که معمولاً استیلن نقش مهمی در تشخیص پیدا می کند.",
      T1: "کد T1 نشان دهنده خطای حرارتی با دمای کمتر از 300 درجه سانتی گراد است؛ در این ناحیه هنوز خطا در محدوده دمایی پایین تر قرار دارد.",
      T2: "کد T2 به خطای حرارتی در بازه 300 تا 700 درجه سانتی گراد اشاره دارد و معمولاً با رشد اتیلن نسبت به حالات دمایی پایین تر همراه می شود.",
      T3: "کد T3 به خطای حرارتی شدید با دمای بالاتر از 700 درجه سانتی گراد اشاره دارد؛ پایان نامه آن را یکی از وضعیت های پرریسک حرارتی می داند."
    }
  },
  ROGERS: {
    methodTitle: "روش Rogers با تفسیر نسبت گازهای کلیدی تلاش می کند نوع عیب را از روی الگوی تخریب روغن مشخص کند.",
    methodDescription: "در پایان نامه آمده این روش، مانند دورنبرگ، یک روش تجربی است و تفسیر آن به تجربه کارشناس هم وابسته است؛ با این حال برای تفکیک خطاهای حرارتی و الکتریکی کاربرد زیادی دارد.",
    codeDetails: {
      PD: "در Rogers، PD نشانه تخلیه جزئی و شروع یک تنش الکتریکی موضعی است که هنوز به قوس شدید نرسیده است.",
      D1: "نتیجه D1 در این روش به جرقه یا تخلیه الکتریکی کم انرژی اشاره دارد و معمولاً باید با سوابق تجهیز و سایر روش ها هم سنجیده شود.",
      D2: "نتیجه D2 در Rogers به تخلیه الکتریکی با انرژی زیاد اشاره دارد؛ همان حالتی که پایان نامه آن را نزدیک به آرک داخلی و وضعیت پرخطر توصیف می کند.",
      T1: "T1 در این روش به خطای حرارتی با دمای پایین برمی گردد؛ معمولاً وقتی گرمایش اولیه یا موضعی در روغن رخ داده باشد.",
      T2: "T2 به خطای حرارتی با شدت متوسط اشاره دارد؛ حالتی که از دمای پایین عبور کرده اما هنوز به محدوده بسیار شدید نرسیده است.",
      T3: "T3 در روش Rogers نشانه خطای حرارتی شدید است و با الگوی گازی متناظر با دماهای بالاتر همراه می شود."
    }
  },
  DORENBERG: {
    methodTitle: "روش Doernenberg از چهار نسبت و پنج گاز استفاده می کند و فقط وقتی معتبرتر است که گازها از سطح بحرانی L1 عبور کرده باشند.",
    methodDescription: "پایان نامه تاکید می کند اگر مقادیر گازها به حد L1 نرسیده باشند، اتکا به این روش کمتر می شود. به همین دلیل Doernenberg بیشتر برای نمونه هایی مفید است که نشانه های واضح تری از عیب دارند.",
    codeDetails: {
      PD: "در این روش، PD به تخلیه جزئی و حضور یک خطای الکتریکی با انرژی پایین اشاره دارد.",
      Thermal: "نتیجه Thermal در Doernenberg یعنی نسبت ها بیشتر به سمت تخریب یا گرمایش حرارتی رفته اند، اما این روش لزوماً دمای دقیق را مثل IEC به T1 تا T3 تفکیک نمی کند.",
      D1: "اگر این روش D1 بدهد، برداشت آن خطای الکتریکی کم انرژی یا جرقه محدود است.",
      D2: "اگر نتیجه به ناحیه D2 نزدیک شود، تفسیر آن وجود تخلیه شدیدتر یا قوس الکتریکی است.",
      Arc: "در پایان نامه اشاره شده که در این ناحیه نسبت ها بیشتر با جرقه یا آرک سازگار هستند؛ به همین خاطر در این اپ معادل D2 در نظر گرفته می شود."
    }
  },
  DUVAL: {
    methodTitle: "مثلث Duval از درصد سه گاز CH4، C2H2 و C2H4 استفاده می کند و محل نقطه را روی نواحی خطا قرار می دهد.",
    methodDescription: "در پایان نامه آمده که بهتر است قبل از استفاده از مثلث Duval ابتدا با روش IEEE وجود عیب محتمل تایید شود و سپس با درصد سه گاز هیدروکربنی، ناحیه خطا تعیین گردد.",
    codeDetails: {
      PD: "در مثلث Duval، PD به تخلیه جزئی مربوط است؛ وضعیتی که معمولاً سهم گازهای ناشی از تنش الکتریکی سبک بیشتر دیده می شود.",
      D1: "کد D1 در این روش نشان دهنده تخلیه یا جرقه کم انرژی است و هنوز در سطح قوس شدید قرار ندارد.",
      D2: "کد D2 در Duval به تخلیه الکتریکی با انرژی زیاد اشاره دارد؛ پایان نامه این ناحیه را متناظر با خطاهای شدیدتر الکتریکی می داند.",
      T1: "T1 در مثلث Duval به خطای حرارتی در رنج پایین مربوط است.",
      T2: "T2 در این روش نشان دهنده خطای حرارتی در رنج متوسط است.",
      T3: "T3 در Duval به خطای حرارتی در رنج بالا و گرمایش شدیدتر اشاره دارد.",
      DT: "نتیجه DT یعنی ناحیه مبهم یا ترکیبی که می تواند بین خطای حرارتی و تخلیه الکتریکی قرار بگیرد و باید با روش های دیگر هم کنترل شود."
    }
  },
  POTG: {
    methodTitle: "روش POTG در پایان نامه پیشنهادی نویسنده است و از درصد نسبی چهار گاز مهم و ترکیب های دوگازی برای تفکیک خطا استفاده می کند.",
    methodDescription: "پایان نامه توضیح می دهد که این روش بر پایه هیدروژن، متان، اتیلن و استیلن بنا شده و تلاش می کند محدودیت روش های کلاسیک را کمتر کند؛ مخصوصاً در جاهایی که تعیین گاز غالب یا ناحیه خطا دشوار می شود.",
    codeDetails: {
      PD: "در POTG، PD معمولاً با غلبه هیدروژن و الگوی سازگار با تخلیه جزئی شناسایی می شود.",
      D1: "کد D1 در این روش به تخلیه الکتریکی کم انرژی برمی گردد و معمولاً نسبت به PD نشانه قوی تری از عیب فعال است.",
      D2: "در پایان نامه، D2 در روش POTG با حضور معنادار استیلن و الگوهای مربوط به تخلیه شدید یا آرک داخلی توصیف شده است.",
      T1: "T1 در POTG نشان دهنده خطای حرارتی دمای پایین است که در آن متان اهمیت بیشتری پیدا می کند.",
      T2: "T2 به خطای حرارتی با دمای متوسط اشاره دارد و معمولاً رشد اتیلن نسبت به حالت های سبک تر دیده می شود.",
      T3: "T3 در این روش مربوط به خطای حرارتی شدید است؛ جایی که سهم اتیلن بالاتر می رود و دمای خطا زیادتر است.",
      "T3+D2": "این نتیجه ترکیبی یعنی نشانه های حرارتی شدید و تخلیه الکتریکی شدید هم زمان دیده شده اند و باید با حساسیت بالا بررسی شود."
    }
  }
};

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
      <div class="method-card-header">
        <span class="method-name">${escapeHtml(methodLabels[methodKey])}</span>
        <button class="method-info-button" type="button" data-method="${escapeHtml(methodKey)}" aria-label="اطلاعات ${escapeHtml(methodLabels[methodKey])}">
          <i class="uil uil-info-circle"></i>
        </button>
      </div>
      <strong class="method-code">${escapeHtml(formatMixedLabel(displayValue))}</strong>
      <span class="method-family">${escapeHtml(definition.family)}</span>
    </article>
  `;
}

function getMethodInfo(methodKey, rawValue) {
  const library = methodInfoLibrary[methodKey];
  const normalizedCode = normalizeFaultCode(rawValue);
  const definition = getFaultDefinition(rawValue);
  const displayValue = rawValue || "قابل تشخیص نیست";

  if (!library) {
    return {
      title: methodLabels[methodKey] || methodKey,
      displayValue,
      methodTitle: definition.title,
      methodDescription: definition.description,
      resultDescription: definition.recommendation
    };
  }

  return {
    title: methodLabels[methodKey],
    displayValue,
    methodTitle: library.methodTitle,
    methodDescription: library.methodDescription,
    resultDescription: library.codeDetails[normalizedCode] || library.codeDetails[String(rawValue || "").trim()] || definition.description,
    recommendation: definition.recommendation
  };
}

function buildMethodMetrics(methodKey, result) {
  if (methodKey === "IEEE") {
    return [`TDCG: ${formatNumber(result.tdcg)} ppm`];
  }

  if (methodKey === "IEC") {
    return [
      `C2H2/C2H4: ${formatMixedLabel(result.ratios.x1_C2H2_C2H4 ?? "نامشخص")}`,
      `CH4/H2: ${formatMixedLabel(result.ratios.x2_CH4_H2 ?? "نامشخص")}`,
      `C2H4/C2H6: ${formatMixedLabel(result.ratios.x3_C2H4_C2H6 ?? "نامشخص")}`
    ];
  }

  if (methodKey === "ROGERS") {
    return [
      `CH4/H2: ${formatMixedLabel(result.ratios.x2_CH4_H2 ?? "نامشخص")}`,
      `C2H4/C2H6: ${formatMixedLabel(result.ratios.x3_C2H4_C2H6 ?? "نامشخص")}`,
      `C2H2/C2H4: ${formatMixedLabel(result.ratios.x1_C2H2_C2H4 ?? "نامشخص")}`
    ];
  }

  if (methodKey === "DORENBERG") {
    return [
      `R1 = CH4/H2: ${formatMixedLabel(result.ratios.x2_CH4_H2 ?? "نامشخص")}`,
      `R2 = C2H2/C2H4: ${formatMixedLabel(result.ratios.x1_C2H2_C2H4 ?? "نامشخص")}`,
      `R3 = C2H2/CH4: ${formatMixedLabel(result.ratios.r3_C2H2_CH4 ?? "نامشخص")}`,
      `R4 = C2H6/C2H2: ${formatMixedLabel(result.ratios.r4_C2H6_C2H2 ?? "نامشخص")}`
    ];
  }

  if (methodKey === "DUVAL") {
    const total = result.input.CH4 + result.input.C2H2 + result.input.C2H4;
    const ch4 = total ? round((result.input.CH4 / total) * 100, 2) : null;
    const c2h2 = total ? round((result.input.C2H2 / total) * 100, 2) : null;
    const c2h4 = total ? round((result.input.C2H4 / total) * 100, 2) : null;
    return [
      `CH4: ${formatMixedLabel(ch4 ?? "نامشخص")}٪`,
      `C2H2: ${formatMixedLabel(c2h2 ?? "نامشخص")}٪`,
      `C2H4: ${formatMixedLabel(c2h4 ?? "نامشخص")}٪`
    ];
  }

  if (methodKey === "POTG") {
    return [
      `H2: ${formatMixedLabel(result.potgPercentages.H2 ?? "نامشخص")}٪`,
      `CH4: ${formatMixedLabel(result.potgPercentages.CH4 ?? "نامشخص")}٪`,
      `C2H2: ${formatMixedLabel(result.potgPercentages.C2H2 ?? "نامشخص")}٪`,
      `C2H4: ${formatMixedLabel(result.potgPercentages.C2H4 ?? "نامشخص")}٪`
    ];
  }

  return [];
}

function buildInfoSheetHtml(methodKey, result) {
  const info = getMethodInfo(methodKey, result.methods[methodKey]);
  const definition = getFaultDefinition(result.methods[methodKey]);
  const metricsHtml = buildMethodMetrics(methodKey, result)
    .map(item => `<span class="sheet-metric">${escapeHtml(item)}</span>`)
    .join("");

  return `
    <div class="sheet-header">
      <div>
        <span class="sheet-kicker">توضیح نتیجه</span>
        <h2 id="sheetTitle" class="sheet-title">${escapeHtml(info.title)}: ${escapeHtml(formatMixedLabel(info.displayValue))}</h2>
        <p class="sheet-subtitle">${escapeHtml(definition.title)} | ${escapeHtml(definition.family)}</p>
      </div>
      <button id="sheetClose" class="sheet-close" type="button" aria-label="بستن">×</button>
    </div>
    <div class="sheet-body">
      <section class="sheet-card">
        <h3>این روش چه چیزی را می سنجد؟</h3>
        <p>${escapeHtml(info.methodTitle)}</p>
      </section>
      <section class="sheet-card">
        <h3>معنی این کد در ${escapeHtml(info.title)}</h3>
        <p>${escapeHtml(info.resultDescription)}</p>
      </section>
      <section class="sheet-card">
        <h3>برداشت پایان نامه</h3>
        <p>${escapeHtml(info.methodDescription)}</p>
      </section>
      <section class="sheet-card">
        <h3>اعداد موثر در این نتیجه</h3>
        <div class="sheet-metric-row">${metricsHtml}</div>
      </section>
      <section class="sheet-card">
        <h3>اقدام پیشنهادی</h3>
        <p>${escapeHtml(info.recommendation || definition.recommendation)}</p>
      </section>
    </div>
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
  currentAnalysisResult = result;
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
  currentAnalysisResult = result;
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
  setupInfoSheet();
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

function openInfoSheet(methodKey) {
  if (!currentAnalysisResult || !infoSheetState) return;
  infoSheetState.content.innerHTML = buildInfoSheetHtml(methodKey, currentAnalysisResult);
  const closeButton = $("sheetClose");
  if (closeButton) closeButton.addEventListener("click", closeInfoSheet);
  infoSheetState.activeMethod = methodKey;
  infoSheetState.dragY = 0;
  infoSheetState.sheet.style.transition = "transform 240ms ease";
  infoSheetState.sheet.style.transform = "translate(50%, 0)";
  infoSheetState.backdrop.style.opacity = "1";
  infoSheetState.shell.classList.add("is-open");
  infoSheetState.shell.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeInfoSheet() {
  if (!infoSheetState) return;
  infoSheetState.activeMethod = null;
  infoSheetState.dragY = 0;
  infoSheetState.shell.classList.remove("is-open");
  infoSheetState.shell.setAttribute("aria-hidden", "true");
  infoSheetState.sheet.style.transition = "";
  infoSheetState.sheet.style.transform = "";
  infoSheetState.backdrop.style.opacity = "";
  document.body.style.overflow = "";
}

function setupInfoSheet() {
  if (infoSheetState || !$("infoSheet")) return;

  infoSheetState = {
    shell: $("infoSheet"),
    backdrop: $("sheetBackdrop"),
    sheet: document.querySelector(".info-sheet"),
    handle: $("sheetHandle"),
    content: $("sheetContent"),
    dragY: 0,
    pointerId: null,
    startY: 0,
    activeMethod: null
  };

  $("methodResults")?.addEventListener("click", event => {
    const button = event.target.closest("[data-method]");
    if (!button) return;
    openInfoSheet(button.dataset.method);
  });

  infoSheetState.backdrop.addEventListener("click", closeInfoSheet);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && infoSheetState?.activeMethod) closeInfoSheet();
  });

  infoSheetState.handle.addEventListener("pointerdown", event => {
    if (!infoSheetState?.activeMethod) return;
    infoSheetState.pointerId = event.pointerId;
    infoSheetState.startY = event.clientY;
    infoSheetState.dragY = 0;
    infoSheetState.sheet.style.transition = "none";
    infoSheetState.handle.setPointerCapture(event.pointerId);
  });

  infoSheetState.handle.addEventListener("pointermove", event => {
    if (infoSheetState.pointerId !== event.pointerId) return;
    const delta = Math.max(0, event.clientY - infoSheetState.startY);
    infoSheetState.dragY = delta;
    infoSheetState.sheet.style.transform = `translate(50%, ${delta}px)`;
    infoSheetState.backdrop.style.opacity = String(Math.max(0.12, 1 - (delta / 260)));
  });

  function releaseSheet(event) {
    if (infoSheetState.pointerId !== event.pointerId) return;
    const shouldClose = infoSheetState.dragY > 120;
    infoSheetState.pointerId = null;
    infoSheetState.sheet.style.transition = "transform 220ms ease";

    if (shouldClose) {
      closeInfoSheet();
      return;
    }

    infoSheetState.dragY = 0;
    infoSheetState.sheet.style.transform = "translate(50%, 0)";
    infoSheetState.backdrop.style.opacity = "1";
  }

  infoSheetState.handle.addEventListener("pointerup", releaseSheet);
  infoSheetState.handle.addEventListener("pointercancel", releaseSheet);
}

if (isResultsPage) {
  initResultsPage();
} else {
  initEntryPage();
}
