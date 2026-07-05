function $(id) { return document.getElementById(id); }

const fields = ["H2", "CH4", "C2H2", "C2H4", "C2H6", "CO", "CO2"];
const STORAGE_KEY = "oilDgaLastInput";
const PENDING_ANALYSIS_KEY = "oilDgaPendingAnalysis";
const STORED_RESULT_KEY = "oilDgaLastResult";
const HISTORY_RESULT_KEY = "oilDgaHistoryResult";
const SELECTED_PROJECT_KEY = "oilDgaSelectedProjectId";
const ENTRY_CONTEXT_KEY = "oilDgaEntryContext";
const historyQuery = new URLSearchParams(window.location.search);
const activeHistoryProjectId = Number(historyQuery.get("projectId") || 0);
const activeHistoryProjectName = String(historyQuery.get("projectName") || "").trim();
const pathName = window.location.pathname;
const isResultsPage = pathName.endsWith("/results.html") || pathName.endsWith("results.html");
const isHistoryPage = pathName.endsWith("/history.html") || pathName.endsWith("history.html");
const isProjectsPage = pathName.endsWith("/projects.html") || pathName.endsWith("projects.html");
const isProfilePage = pathName.endsWith("/profile.html") || pathName.endsWith("profile.html");
const methodLabels = {
  HEPTAGON: "HEPTAGON",
  IEEE: "IEEE",
  IEC: "IEC 60599",
  ROGERS: "Rogers",
  DORENBERG: "Doernenberg",
  DUVAL: "Duval",
  POTG: "POTG"
};
const methodOrder = ["HEPTAGON", "ROGERS", "IEC", "POTG", "DUVAL", "DORENBERG", "IEEE"];
const l1GatedMethods = ["IEC", "ROGERS", "POTG"];
let currentAnalysisResult = null;
let infoSheetState = null;
let historyDeleteModalState = null;
let logoutModalState = null;
let inputConfirmModalState = null;
let projectFormModalState = null;
let sampleDateModalState = null;
const HISTORY_PAGE_SIZE = 5;
const historyState = {
  items: [],
  loading: false,
  hasMore: true,
  observer: null,
  deletingId: null
};
const projectsState = {
  items: [],
  loading: false,
  analysisSummaryById: {}
};

const persianMonthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند"
];

const methodInfoLibrary = {
  HEPTAGON: {
    methodTitle: "روش HEPTAGON با هر هفت گاز اصلی DGA کار می‌کند و برای هر گاز یک درصد وزنی در شکل هفت‌ضلعی می‌سازد.",
    methodDescription: "بر اساس مقاله اصلی، این روش برای جبران محدودیت بعضی روش‌های کلاسیک توسعه داده شده تا اثر CO، CO2، H2 و C2H6 هم در تشخیص نوع عیب یا تخریب سلولزی دیده شود.",
    codeDetails: {
      NORMAL: "در HEPTAGON این نتیجه یعنی نقطه نهایی به ناحیه نرمال یا پیرشدگی عادی نزدیک است و الگوی غالبی از عیب فعال دیده نمی‌شود.",
      PD: "در HEPTAGON، PD به الگوی غلبه هیدروژن و تخلیه جزئی نزدیک است؛ جایی که عیب هنوز بیشتر ماهیت تخلیه سبک دارد.",
      D1: "در این روش، D1 به تخلیه الکتریکی کم‌انرژی یا جرقه‌های سبک نزدیک است و معمولاً از ناحیه قوس شدید جدا می‌شود.",
      D2: "در HEPTAGON، D2 ناحیه تخلیه الکتریکی پرانرژی یا آرک داخلی است و معمولاً با سهم بالاتر استیلن دیده می‌شود.",
      T1: "نتیجه T1 در HEPTAGON به خطای حرارتی دمای پایین اشاره دارد؛ حالتی که هنوز به ناحیه‌های حرارتی شدیدتر نرسیده است.",
      T2: "نتیجه T2 در HEPTAGON نشان‌دهنده خطای حرارتی با شدت متوسط است و الگوی گازها به ناحیه دمای میانی نزدیک شده است.",
      T3: "در HEPTAGON، T3 به خطای حرارتی شدید و دماهای بالاتر مربوط می‌شود.",
      HCCD: "این کد به تخریب شدید عایق سلولزی اشاره دارد و در مقاله، برای غلبه گازهای مرتبط با CO و CO2 در ناحیه شدید به‌کار رفته است.",
      MCCD: "این کد به تخریب متوسط سلولزی اشاره دارد و از ناحیه شدید و خفیف سلولز جدا می‌شود.",
      LCCD: "این کد به تخریب خفیف سلولزی یا کربنیزه‌شدن محدودتر عایق اشاره دارد."
    }
  },
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

function toPersianDigits(value) {
  return String(value).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] || digit);
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

function formatDateTime(value) {
  if (!value) return "نامشخص";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDateOnly(value) {
  if (!value) return "نامشخص";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "long"
  }).format(new Date(value));
}

function div(a, b) {
  return ~~(a / b);
}

function mod(a, b) {
  return a - ~~(a / b) * b;
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4);
  d += div(153 * mod(gm + 9, 12) + 2, 5);
  d += gd - 34840408;
  d -= div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) - 752;
  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function jalCal(jy) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm;
  let jump;
  let leap;
  let n;
  let i;

  if (jy < jp || jy >= breaks[bl - 1]) throw new Error("Invalid Jalaali year");

  for (i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn) {
  const g = d2g(jdn);
  let jy = g.gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(g.gy, 3, r.march);
  let jd;
  let jm;
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

function toJalaali(date) {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();
  return d2j(g2d(gYear, gMonth, gDay));
}

function toGregorian(jy, jm, jd) {
  return d2g(j2d(jy, jm, jd));
}

function createLocalDateFromGregorianParts(gy, gm, gd) {
  return new Date(gy, gm - 1, gd, 12, 0, 0, 0);
}

function toStoredSampleDate(date) {
  const localMidday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  return localMidday.toISOString();
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

function buildExceededGasesLabel(result) {
  const gases = result.l1Eligibility?.exceededGases || [];
  return gases.length ? gases.join("، ") : "هیچ‌کدام";
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
  const metrics = [];

  if (l1GatedMethods.includes(methodKey)) {
    metrics.push(`وضعیت L1: ${result.l1Eligibility?.isEligible ? `فعال با ${buildExceededGasesLabel(result)}` : "هیچ گازی از L1 عبور نکرده"}`);
  }

  if (methodKey === "IEEE") {
    return [...metrics, `TDCG: ${formatNumber(result.tdcg)} ppm`];
  }

  if (methodKey === "HEPTAGON") {
    return [
      `H2: ${formatMixedLabel(result.heptagonPercentages?.H2 ?? "نامشخص")}٪`,
      `CH4: ${formatMixedLabel(result.heptagonPercentages?.CH4 ?? "نامشخص")}٪`,
      `C2H2: ${formatMixedLabel(result.heptagonPercentages?.C2H2 ?? "نامشخص")}٪`,
      `C2H4: ${formatMixedLabel(result.heptagonPercentages?.C2H4 ?? "نامشخص")}٪`,
      `C2H6: ${formatMixedLabel(result.heptagonPercentages?.C2H6 ?? "نامشخص")}٪`,
      `CO: ${formatMixedLabel(result.heptagonPercentages?.CO ?? "نامشخص")}٪`,
      `CO2: ${formatMixedLabel(result.heptagonPercentages?.CO2 ?? "نامشخص")}٪`,
      `نوع تشخیص: ${result.heptagonSource === "reference-match" ? "نزدیک‌ترین الگوی مرجع مقاله" : "قاعده مستقیم"}`
    ];
  }

  if (methodKey === "IEC") {
    return [
      ...metrics,
      `C2H2/C2H4: ${formatMixedLabel(result.ratios.x1_C2H2_C2H4 ?? "نامشخص")}`,
      `CH4/H2: ${formatMixedLabel(result.ratios.x2_CH4_H2 ?? "نامشخص")}`,
      `C2H4/C2H6: ${formatMixedLabel(result.ratios.x3_C2H4_C2H6 ?? "نامشخص")}`
    ];
  }

  if (methodKey === "ROGERS") {
    return [
      ...metrics,
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
      ...metrics,
      `H2: ${formatMixedLabel(result.potgPercentages.H2 ?? "نامشخص")}٪`,
      `CH4: ${formatMixedLabel(result.potgPercentages.CH4 ?? "نامشخص")}٪`,
      `C2H2: ${formatMixedLabel(result.potgPercentages.C2H2 ?? "نامشخص")}٪`,
      `C2H4: ${formatMixedLabel(result.potgPercentages.C2H4 ?? "نامشخص")}٪`
    ];
  }

  return metrics;
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
  const methodValues = methodOrder
    .map(key => result.methods[key])
    .filter(value => value !== undefined);
  const matches = methodValues.filter(value => {
    const definition = getFaultDefinition(value);
    return definition.family === family && definition.family !== "نامشخص";
  }).length;

  return {
    matches,
    total: methodValues.length,
    family
  };
}

function renderConsensus(consensus) {
  if (!consensus.total) {
    return `
      <div class="consensus-card">
        <p class="consensus-text">در حال حاضر، روش قابل مقایسه‌ای برای جمع‌بندی در دسترس نیست.</p>
      </div>
    `;
  }

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

function renderL1Status(result) {
  if (!result.l1Eligibility) return "";
  const gatedMethodsLabel = l1GatedMethods.map(key => methodLabels[key]).join("، ");
  const description = result.l1Eligibility.isEligible
    ? `پیش‌شرط L1 برای ${gatedMethodsLabel} برقرار است.`
    : `پیش‌شرط L1 برای ${gatedMethodsLabel} برقرار نیست؛ چون هنوز هیچ‌کدام از گازهای ورودی از سطح یک جدول IEEE عبور نکرده‌اند.`;

  return `
    <div class="consensus-card">
      <p class="consensus-text">${escapeHtml(description)}</p>
    </div>
  `;
}

function renderCelluloseStatus(result) {
  const container = $("celluloseStatus");
  if (!container || !result.cellulose) return;
  const definition = getFaultDefinition(result.cellulose.code);
  const coCo2 = result.ratios.co_co2;
  const co2Co = result.ratios.co2_co;

  container.innerHTML = `
    <section class="panel methods-panel">
      <article class="diagnosis-card severity-${definition.severityLevel}">
        <div class="diagnosis-top">
          ${renderSeverityBadge(definition)}
          <span class="confidence">CO: ${escapeHtml(formatNumber(result.input.CO))} ppm</span>
        </div>
        <p class="fault-family cellulose-subhead">وضعیت سلولوز عایقی</p>
        <strong class="final-result-title cellulose-title">${escapeHtml(definition.title)}</strong>
        <p class="result-description">${escapeHtml(definition.description)}</p>
        <div class="sheet-metric-row cellulose-metric-row">
          <span class="sheet-metric cellulose-metric-chip">CO/CO2: ${escapeHtml(formatMixedLabel(coCo2 ?? "نامشخص"))}</span>
          <span class="sheet-metric cellulose-metric-chip">CO2/CO: ${escapeHtml(formatMixedLabel(co2Co ?? "نامشخص"))}</span>
        </div>
        <div class="warning-box">
          <i class="uil uil-exclamation-triangle"></i>
          <strong>${escapeHtml(definition.recommendation)}</strong>
        </div>
      </article>
    </section>
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

function persistAnalysisResult(key, result) {
  sessionStorage.setItem(key, JSON.stringify(result));
}

function getStoredAnalysisResult(key) {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

function persistEntryContext(context) {
  sessionStorage.setItem(ENTRY_CONTEXT_KEY, JSON.stringify(context || {}));
}

function getEntryContext() {
  const raw = sessionStorage.getItem(ENTRY_CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getSelectedProjectId() {
  return String(localStorage.getItem(SELECTED_PROJECT_KEY) || "");
}

function setSelectedProjectId(projectId) {
  if (!projectId) {
    localStorage.removeItem(SELECTED_PROJECT_KEY);
    return;
  }
  localStorage.setItem(SELECTED_PROJECT_KEY, String(projectId));
}

function getSelectedProject() {
  const projectId = getSelectedProjectId();
  return projectsState.items.find(item => String(item.id) === projectId) || null;
}

function formatDateTimeLocalInput(value) {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function buildProjectOptionLabel(project) {
  const transformer = project.transformer_number || "ترانس بدون شماره";
  const station = project.station_name || "بدون ایستگاه";
  const company = project.company_name || "بدون شرکت";
  return `${transformer} | ${station} | ${company}`;
}

function normalizeSearchText(value) {
  return normalizeDigits(String(value || "")).trim().toLowerCase();
}

function closeProjectSelectDropdown() {
  $("projectSelectDropdown")?.setAttribute("hidden", "");
  $("projectSelectTrigger")?.setAttribute("aria-expanded", "false");
}

function openProjectSelectDropdown() {
  const dropdown = $("projectSelectDropdown");
  if (!dropdown) return;
  dropdown.removeAttribute("hidden");
  $("projectSelectTrigger")?.setAttribute("aria-expanded", "true");
  $("projectSearchInput")?.focus();
  $("projectSearchInput")?.select?.();
}

function syncProjectSelectionUI(project) {
  const valueNode = $("projectSelectValue");
  const helper = $("projectSelectHelper");
  const hiddenInput = $("projectSelect");
  if (!valueNode || !helper || !hiddenInput) return;
  if (!project) {
    valueNode.textContent = "ترانسفورماتور مورد نظر را انتخاب نمایید";
    helper.textContent = "برای ثبت صحیح سوابق، ترانسفورماتور مربوطه را انتخاب فرمایید.";
    hiddenInput.value = "";
    return;
  }
  hiddenInput.value = String(project.id);
  valueNode.textContent = buildProjectOptionLabel(project);
  helper.textContent = `تحلیل جدید برای ${buildProjectOptionLabel(project)} ذخیره می‌شود.`;
}

function renderProjectSelectOptions(items, query = "") {
  const optionsNode = $("projectSelectOptions");
  if (!optionsNode) return;
  const normalizedQuery = normalizeSearchText(query);
  const filteredItems = !normalizedQuery
    ? items
    : items.filter(project => normalizeSearchText(buildProjectOptionLabel(project)).includes(normalizedQuery));

  if (!filteredItems.length) {
    optionsNode.innerHTML = `<div class="project-select-empty">نتیجه‌ای پیدا نشد.</div>`;
    return;
  }

  optionsNode.innerHTML = filteredItems.map(project => `
    <button
      class="project-select-option"
      type="button"
      role="option"
      data-project-option="${escapeHtml(String(project.id))}"
      aria-selected="${String(String($("projectSelect")?.value || "") === String(project.id))}">
      <strong>${escapeHtml(project.transformer_number || "ترانس بدون شماره")}</strong>
      <span>${escapeHtml(`${project.station_name || "بدون ایستگاه"} | ${project.company_name || "بدون شرکت"}`)}</span>
    </button>
  `).join("");
}

function renderSummary(result) {
  if (!$("summary")) return;
  const definition = getFaultDefinition(result.finalDiagnosis);
  const projectMeta = [
    result.projectName ? `ترانسفورماتور: ${result.projectName}` : "",
    result.sampledAt ? `نمونه‌گیری: ${formatDateOnly(result.sampledAt)}` : ""
  ].filter(Boolean).join(" | ");
  $("summary").innerHTML = `
    <article class="diagnosis-card severity-${definition.severityLevel}">
      <div class="diagnosis-top">
        ${renderSeverityBadge(definition)}
        <span class="confidence">اعتماد: ${escapeHtml(result.confidence)}</span>
      </div>
      ${projectMeta ? `<p class="result-context">${escapeHtml(projectMeta)}</p>` : ""}
      <p class="fault-family">${escapeHtml(definition.family)}</p>
      <strong class="final-result-title">${escapeHtml(definition.title)}</strong>
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
      ${renderL1Status(result)}
      ${renderConsensus(consensus)}
    </div>
  `;
}

function renderSaveStatus(message, tone = "neutral") {
  if (!message) return;
  if (window.AppAuth?.showToast) {
    window.AppAuth.showToast(message, tone);
    return;
  }
}

async function savePendingAnalysisIfNeeded() {
  if (!sessionStorage.getItem(PENDING_ANALYSIS_KEY) || !currentAnalysisResult) return;
  if (!window.AppAuth?.isConfigured()) {
    renderSaveStatus("اتصال پایگاه داده تکمیل نشده است و این تحلیل در سوابق ذخیره نشد.", "warning");
    return;
  }
  if (!window.AppAuth?.isAuthenticated()) {
    renderSaveStatus("برای ذخیره‌سازی تحلیل، ابتدا وارد حساب کاربری شوید.", "warning");
    return;
  }

  renderSaveStatus("در حال ثبت تحلیل در سوابق ترانسفورماتور...", "neutral");
  const { error } = await window.AppAuth.saveAnalysis(currentAnalysisResult);
  if (error) {
    renderSaveStatus(`ذخیره تست انجام نشد: ${error}`, "danger");
    return;
  }

  sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
  renderSaveStatus("تحلیل با موفقیت در سوابق ترانسفورماتور ذخیره شد.", "success");
}

function renderStoredAnalysis() {
  const historyResult = getStoredAnalysisResult(HISTORY_RESULT_KEY);
  const storedResult = getStoredAnalysisResult(STORED_RESULT_KEY);
  const storedInput = getStoredInput();
  const entryContext = getEntryContext();
  const result = historyResult || storedResult || (storedInput ? analyzeDGA(storedInput) : null);

  if (!result) {
    window.location.href = "index.html";
    return;
  }

  currentAnalysisResult = result;
  if (!historyResult && entryContext) {
    currentAnalysisResult = { ...result, ...entryContext };
  }
  if (result.input) persistCurrentInput(result.input);
  persistAnalysisResult(STORED_RESULT_KEY, currentAnalysisResult);
  sessionStorage.removeItem(HISTORY_RESULT_KEY);
  renderSummary(currentAnalysisResult);
  renderMethods(currentAnalysisResult);
  renderCelluloseStatus(currentAnalysisResult);
}

function proceedToResults() {
  if (window.AppAuth?.isConfigured && !window.AppAuth.isConfigured()) {
    window.AppAuth.showGlobalMessage("تنظیمات Supabase هنوز تکمیل نشده است. برای فعال‌سازی ثبت سوابق، فایل تنظیمات را تکمیل نمایید.", "warning");
    return;
  }
  const entryContext = getEntryContext();
  if (!entryContext?.projectId) {
    window.AppAuth?.showToast("ترانسفورماتور این تحلیل مشخص نشده است.", "warning");
    return;
  }
  const gases = getFormGases();
  const result = {
    ...analyzeDGA(gases),
    projectId: entryContext.projectId,
    projectName: entryContext.projectName,
    sampledAt: entryContext.sampledAt
  };
  persistCurrentInput(gases);
  persistAnalysisResult(STORED_RESULT_KEY, result);
  sessionStorage.removeItem(HISTORY_RESULT_KEY);
  sessionStorage.setItem(PENDING_ANALYSIS_KEY, "1");
  window.location.href = "results.html";
}

function buildInputConfirmList(gases) {
  const context = getEntryContext() || {};
  const contextItems = [
    context.projectName ? `
      <div class="input-confirm-item is-wide">
        <span class="input-confirm-label">ترانسفورماتور انتخاب‌شده</span>
        <div class="input-confirm-value">
          <strong>${escapeHtml(context.projectName)}</strong>
        </div>
      </div>
    ` : "",
    context.sampledAt ? `
      <div class="input-confirm-item is-wide">
        <span class="input-confirm-label">تاریخ نمونه‌گیری</span>
        <div class="input-confirm-value">
          <strong>${escapeHtml(formatDateOnly(context.sampledAt))}</strong>
        </div>
      </div>
    ` : ""
  ].filter(Boolean).join("");
  return `${contextItems}${fields.map(key => {
    const wideClass = key === "CO2" ? " is-wide" : "";
    return `
      <div class="input-confirm-item${wideClass}">
        <span class="input-confirm-label">${escapeHtml(key)}</span>
        <div class="input-confirm-value">
          <strong>${escapeHtml(formatNumber(gases[key] ?? 0))}</strong>
          <span class="input-confirm-unit">ppm</span>
        </div>
      </div>
    `;
  }).join("")}`;
}

function getMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalCal(jy).leap === 0 ? 30 : 29;
}

function syncSampleDateDisplay() {
  const hiddenInput = $("sampledAt");
  const display = $("sampledAtDisplay");
  if (!hiddenInput || !display) return;
  display.textContent = hiddenInput.value ? formatDateOnly(hiddenInput.value) : "تاریخ نمونه‌گیری انتخاب نشده است";
}

function commitSelectedSampleDate(selectedIso) {
  const hiddenInput = $("sampledAt");
  if (!hiddenInput || !selectedIso) return;
  hiddenInput.value = selectedIso;
  syncSampleDateDisplay();
}

function renderSampleDateGrid() {
  if (!sampleDateModalState) return;
  const { viewYear, viewMonth, selectedIso } = sampleDateModalState;
  const monthLabel = $("sampleDateMonthLabel");
  const grid = $("sampleDateGrid");
  if (!monthLabel || !grid) return;
  monthLabel.textContent = `${persianMonthNames[viewMonth - 1]} ${toPersianDigits(String(viewYear))}`;

  const firstGregorian = toGregorian(viewYear, viewMonth, 1);
  const firstDate = createLocalDateFromGregorianParts(firstGregorian.gy, firstGregorian.gm, firstGregorian.gd);
  const startOffset = (firstDate.getDay() + 1) % 7;
  const daysInMonth = getMonthLength(viewYear, viewMonth);
  const selectedJalaali = selectedIso ? toJalaali(new Date(selectedIso)) : null;
  const todayJalaali = toJalaali(new Date());
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push('<span class="sample-date-cell is-empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isSelected = selectedJalaali && selectedJalaali.jy === viewYear && selectedJalaali.jm === viewMonth && selectedJalaali.jd === day;
    const isToday = todayJalaali.jy === viewYear && todayJalaali.jm === viewMonth && todayJalaali.jd === day;
    const classes = [
      "sample-date-cell",
      isSelected ? "is-selected" : "",
      isToday ? "is-today" : ""
    ].filter(Boolean).join(" ");
    cells.push(`
      <button class="${classes}" type="button" data-sample-day="${day}">
        <span>${formatMixedLabel(day)}</span>
      </button>
    `);
  }

  grid.innerHTML = cells.join("");
}

function openSampleDateModal() {
  if (!sampleDateModalState) return;
  const selectedIso = $("sampledAt")?.value || toStoredSampleDate(new Date());
  const j = toJalaali(new Date(selectedIso));
  sampleDateModalState.selectedIso = selectedIso;
  sampleDateModalState.viewYear = j.jy;
  sampleDateModalState.viewMonth = j.jm;
  renderSampleDateGrid();
  $("sampledAtTrigger")?.setAttribute("aria-expanded", "true");
  openAnimatedModal(sampleDateModalState.shell);
}

function closeSampleDateModal() {
  if (!sampleDateModalState) return;
  $("sampledAtTrigger")?.setAttribute("aria-expanded", "false");
  closeAnimatedModal(sampleDateModalState.shell);
}

function setupSampleDateModal() {
  if (sampleDateModalState || !$("sampleDateModal")) return;
  sampleDateModalState = {
    shell: $("sampleDateModal"),
    backdrop: $("sampleDateBackdrop"),
    selectedIso: $("sampledAt")?.value || "",
    viewYear: toJalaali(new Date()).jy,
    viewMonth: toJalaali(new Date()).jm
  };

  $("sampledAtTrigger")?.addEventListener("click", openSampleDateModal);
  sampleDateModalState.backdrop?.addEventListener("click", closeSampleDateModal);
  $("sampleDateCancel")?.addEventListener("click", closeSampleDateModal);
  $("sampleDatePrev")?.addEventListener("click", () => {
    if (!sampleDateModalState) return;
    sampleDateModalState.viewMonth -= 1;
    if (sampleDateModalState.viewMonth < 1) {
      sampleDateModalState.viewMonth = 12;
      sampleDateModalState.viewYear -= 1;
    }
    renderSampleDateGrid();
  });
  $("sampleDateNext")?.addEventListener("click", () => {
    if (!sampleDateModalState) return;
    sampleDateModalState.viewMonth += 1;
    if (sampleDateModalState.viewMonth > 12) {
      sampleDateModalState.viewMonth = 1;
      sampleDateModalState.viewYear += 1;
    }
    renderSampleDateGrid();
  });
  $("sampleDateGrid")?.addEventListener("click", event => {
    const dayButton = event.target.closest("[data-sample-day]");
    if (!dayButton || !sampleDateModalState) return;
    const day = Number(dayButton.dataset.sampleDay);
    const gregorian = toGregorian(sampleDateModalState.viewYear, sampleDateModalState.viewMonth, day);
    sampleDateModalState.selectedIso = toStoredSampleDate(createLocalDateFromGregorianParts(gregorian.gy, gregorian.gm, gregorian.gd));
    commitSelectedSampleDate(sampleDateModalState.selectedIso);
    renderSampleDateGrid();
    closeSampleDateModal();
  });
  $("sampleDateConfirm")?.addEventListener("click", () => {
    commitSelectedSampleDate(sampleDateModalState?.selectedIso);
    closeSampleDateModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && sampleDateModalState && !sampleDateModalState.shell.hidden) {
      closeSampleDateModal();
    }
  });
}

function setupInputConfirmModal() {
  if (inputConfirmModalState || !$("inputConfirmModal")) return;
  inputConfirmModalState = {
    shell: $("inputConfirmModal"),
    backdrop: $("inputConfirmBackdrop"),
    submit: $("inputConfirmSubmit"),
    cancel: $("inputConfirmCancel"),
    list: $("inputConfirmList"),
    pendingGases: null
  };

  inputConfirmModalState.backdrop?.addEventListener("click", closeInputConfirmModal);
  inputConfirmModalState.cancel?.addEventListener("click", closeInputConfirmModal);
  inputConfirmModalState.submit?.addEventListener("click", () => {
    closeInputConfirmModal();
    proceedToResults();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && inputConfirmModalState && !inputConfirmModalState.shell.hidden) {
      closeInputConfirmModal();
    }
  });
}

function openInputConfirmModal() {
  setupInputConfirmModal();
  if (!inputConfirmModalState) return;
  const projectId = String($("projectSelect")?.value || "");
  if (!projectId) {
    window.AppAuth?.showToast("لطفاً پیش از انجام تحلیل، ترانسفورماتور را انتخاب نمایید.", "warning");
    return;
  }
  const sampledAtValue = String($("sampledAt")?.value || "").trim();
  if (!sampledAtValue) {
    window.AppAuth?.showToast("لطفاً تاریخ نمونه‌گیری را ثبت نمایید.", "warning");
    return;
  }
  const selectedProject = projectsState.items.find(item => String(item.id) === projectId);
  if (!selectedProject) {
    window.AppAuth?.showToast("ترانسفورماتور انتخاب‌شده معتبر نیست. لطفاً مجدداً انتخاب فرمایید.", "warning");
    return;
  }
  setSelectedProjectId(projectId);
  persistEntryContext({
    projectId: Number(projectId),
    projectName: buildProjectOptionLabel(selectedProject),
    sampledAt: sampledAtValue
  });
  const gases = getFormGases();
  inputConfirmModalState.pendingGases = gases;
  inputConfirmModalState.list.innerHTML = buildInputConfirmList(gases);
  inputConfirmModalState.submit.disabled = false;
  inputConfirmModalState.submit.textContent = "بله، تحلیل شود";
  openAnimatedModal(inputConfirmModalState.shell);
}

function closeInputConfirmModal() {
  if (!inputConfirmModalState) return;
  inputConfirmModalState.pendingGases = null;
  inputConfirmModalState.submit.disabled = false;
  inputConfirmModalState.submit.textContent = "بله، تحلیل شود";
  closeAnimatedModal(inputConfirmModalState.shell);
}

async function setupEntryProjectContext() {
  const projectSelect = $("projectSelect");
  const sampledAtInput = $("sampledAt");
  const helper = $("projectSelectHelper");
  const trigger = $("projectSelectTrigger");
  const searchInput = $("projectSearchInput");
  const optionsNode = $("projectSelectOptions");
  if (!projectSelect || !sampledAtInput || !trigger || !searchInput || !optionsNode) return;

  projectSelect.value = "";
  trigger.disabled = true;
  $("projectSelectValue").textContent = "در حال بارگذاری اطلاعات ترانسفورماتورها...";
  sampledAtInput.value = toStoredSampleDate(new Date());
  syncSampleDateDisplay();

  const { data, error } = await window.AppAuth.listProjects();
  if (error) {
    $("projectSelectValue").textContent = "بارگذاری ترانسفورماتورها انجام نشد";
    helper.textContent = error;
    return;
  }

  projectsState.items = data || [];
  if (!projectsState.items.length) {
    $("projectSelectValue").textContent = "هیچ ترانسفورماتوری ثبت نشده است";
    helper.textContent = "برای ثبت و نگهداری سوابق تحلیلی، ابتدا ترانسفورماتور جدید تعریف شود.";
    return;
  }

  trigger.disabled = false;
  renderProjectSelectOptions(projectsState.items);

  const rememberedProjectId = getSelectedProjectId();
  const selectedProject = projectsState.items.find(item => String(item.id) === rememberedProjectId) || projectsState.items[0];
  if (selectedProject) {
    setSelectedProjectId(selectedProject.id);
    syncProjectSelectionUI(selectedProject);
    renderProjectSelectOptions(projectsState.items, searchInput.value);
  }

  trigger.addEventListener("click", () => {
    const isOpen = !$("projectSelectDropdown")?.hasAttribute("hidden");
    if (isOpen) {
      closeProjectSelectDropdown();
      return;
    }
    searchInput.value = "";
    renderProjectSelectOptions(projectsState.items);
    openProjectSelectDropdown();
  });

  searchInput.addEventListener("input", () => {
    renderProjectSelectOptions(projectsState.items, searchInput.value);
  });

  optionsNode.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const option = event.target.closest("[data-project-option]");
    if (!option) return;
    const nextProject = projectsState.items.find(item => String(item.id) === option.dataset.projectOption);
    if (!nextProject) return;
    setSelectedProjectId(nextProject.id);
    syncProjectSelectionUI(nextProject);
    renderProjectSelectOptions(projectsState.items, searchInput.value);
    closeProjectSelectDropdown();
  });

  $("projectSelectDropdown")?.addEventListener("click", event => {
    event.stopPropagation();
  });

  document.addEventListener("click", event => {
    const box = $("projectSelectBox");
    if (!box || box.contains(event.target)) return;
    closeProjectSelectDropdown();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeProjectSelectDropdown();
  });
}

function initEntryPage() {
  const storedInput = getStoredInput();
  if (storedInput) {
    fields.forEach(key => {
      if (storedInput[key] !== undefined) setFieldValue(key, storedInput[key]);
    });
  }
  attachPersianNumericBehavior();
  setupInputConfirmModal();
  setupSampleDateModal();
  setupEntryProjectContext();
  $("analyzeBtn")?.addEventListener("click", openInputConfirmModal);
}

function initResultsPage() {
  renderStoredAnalysis();
  setupInfoSheet();
  savePendingAnalysisIfNeeded();
  document.querySelector("[data-back]")?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "index.html";
  });
}

function buildHistoryCard(item) {
  const result = item.result || {};
  const definition = getFaultDefinition(item.final_diagnosis || result.finalDiagnosis);
  const gases = result.input || item.input || {};
  const gasSummary = fields
    .map(key => `<span class="history-chip">${escapeHtml(key)}: ${escapeHtml(formatNumber(gases[key] ?? 0))}</span>`)
    .join("");
  const isBusy = historyState.deletingId === item.id ? " is-busy" : "";

  return `
    <article class="history-card panel${isBusy}" role="button" tabindex="0" data-history-id="${escapeHtml(String(item.id))}" data-history-result='${escapeHtml(JSON.stringify(result))}'>
      <div class="history-card-top">
        <div class="history-card-meta">
          ${renderSeverityBadge(definition)}
          <span class="history-date">${escapeHtml(formatDateOnly(item.sampled_at || item.created_at))}</span>
        </div>
        <div class="history-card-actions">
          <button class="icon-button history-delete-button" type="button" data-history-delete="${escapeHtml(String(item.id))}" aria-label="حذف این سابقه">
            <i class="uil uil-trash-alt"></i>
          </button>
        </div>
      </div>
      <strong class="history-title">${escapeHtml(definition.title)}</strong>
      <p class="history-subtitle">اعتماد ${escapeHtml(item.confidence || result.confidence || "نامشخص")} | TDCG: ${escapeHtml(formatNumber(item.tdcg ?? result.tdcg ?? 0))}</p>
      <div class="history-chip-row">${gasSummary}</div>
    </article>
  `;
}

function renderHistoryList(items, { append = false } = {}) {
  const container = $("historyList");
  const empty = $("historyEmpty");
  if (!container || !empty) return;

  if (!items.length) {
    if (!append) {
      empty.hidden = false;
      container.innerHTML = "";
    }
    return;
  }

  empty.hidden = true;
  const html = items.map(buildHistoryCard).join("");
  if (append) {
    container.insertAdjacentHTML("beforeend", html);
    return;
  }
  container.innerHTML = html;
}

function openHistoryResult(serializedResult) {
  if (!serializedResult) return;
  try {
    const result = JSON.parse(serializedResult);
    if (!result || !result.input) return;
    persistCurrentInput(result.input);
    persistAnalysisResult(HISTORY_RESULT_KEY, result);
    sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
    window.location.href = "results.html";
  } catch {
    window.AppAuth?.showGlobalMessage("دسترسی به این سابقه امکان‌پذیر نبود. لطفاً مجدداً تلاش نمایید.", "danger");
  }
}

function openAnimatedModal(shell) {
  if (!shell) return;
  shell.hidden = false;
  shell.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    shell.classList.add("is-open");
  });
  document.body.style.overflow = "hidden";
}

function closeAnimatedModal(shell, onClosed) {
  if (!shell || shell.hidden) {
    if (typeof onClosed === "function") onClosed();
    return;
  }
  shell.classList.remove("is-open");
  window.setTimeout(() => {
    shell.hidden = true;
    shell.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".sheet-shell.is-open")) {
      document.body.style.overflow = "";
    }
    if (typeof onClosed === "function") onClosed();
  }, 220);
}

function setupHistoryDeleteModal() {
  if (historyDeleteModalState || !$("historyDeleteModal")) return;
  historyDeleteModalState = {
    shell: $("historyDeleteModal"),
    backdrop: $("historyDeleteBackdrop"),
    confirm: $("historyDeleteConfirm"),
    cancel: $("historyDeleteCancel"),
    activeId: null
  };

  historyDeleteModalState.backdrop?.addEventListener("click", closeHistoryDeleteModal);
  historyDeleteModalState.cancel?.addEventListener("click", closeHistoryDeleteModal);
  historyDeleteModalState.confirm?.addEventListener("click", confirmHistoryDelete);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && logoutModalState && !logoutModalState.shell.hidden) {
      closeLogoutModal();
      return;
    }
    if (event.key === "Escape" && historyDeleteModalState?.activeId !== null) {
      closeHistoryDeleteModal();
    }
  });
}

function openHistoryDeleteModal(analysisId) {
  setupHistoryDeleteModal();
  if (!historyDeleteModalState) return;
  historyDeleteModalState.activeId = Number(analysisId);
  historyDeleteModalState.confirm.disabled = false;
  historyDeleteModalState.confirm.textContent = "بله، حذف شود";
  openAnimatedModal(historyDeleteModalState.shell);
}

function closeHistoryDeleteModal() {
  if (!historyDeleteModalState) return;
  historyDeleteModalState.activeId = null;
  historyDeleteModalState.confirm.disabled = false;
  historyDeleteModalState.confirm.textContent = "بله، حذف شود";
  closeAnimatedModal(historyDeleteModalState.shell);
}

function setupLogoutModal() {
  if (logoutModalState || !$("logoutModal")) return;
  logoutModalState = {
    shell: $("logoutModal"),
    backdrop: $("logoutBackdrop"),
    confirm: $("logoutConfirm"),
    cancel: $("logoutCancel")
  };

  logoutModalState.backdrop?.addEventListener("click", closeLogoutModal);
  logoutModalState.cancel?.addEventListener("click", closeLogoutModal);
  logoutModalState.confirm?.addEventListener("click", confirmLogout);

  document.querySelectorAll("[data-logout]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      openLogoutModal();
    });
  });
}

function openLogoutModal() {
  setupLogoutModal();
  if (!logoutModalState) return;
  logoutModalState.confirm.disabled = false;
  logoutModalState.confirm.textContent = "بله، خارج شوم";
  openAnimatedModal(logoutModalState.shell);
}

function closeLogoutModal() {
  if (!logoutModalState) return;
  logoutModalState.confirm.disabled = false;
  logoutModalState.confirm.textContent = "بله، خارج شوم";
  closeAnimatedModal(logoutModalState.shell);
}

async function confirmLogout() {
  if (!logoutModalState) return;
  logoutModalState.confirm.disabled = true;
  logoutModalState.confirm.textContent = "در حال خروج...";
  await window.AppAuth?.signOut?.();
  closeLogoutModal();
}

function updateHistoryView() {
  renderHistoryList(historyState.items, { append: false });
}

async function confirmHistoryDelete() {
  if (!historyDeleteModalState || historyDeleteModalState.activeId === null) return;
  const analysisId = historyDeleteModalState.activeId;
  historyState.deletingId = analysisId;
  historyDeleteModalState.confirm.disabled = true;
  historyDeleteModalState.confirm.textContent = "در حال حذف...";
  updateHistoryView();

  const { error } = await window.AppAuth.hideAnalysis(analysisId);
  historyState.deletingId = null;

  if (error) {
    closeHistoryDeleteModal();
    updateHistoryView();
    window.AppAuth?.showToast(`حذف سابقه انجام نشد: ${error}`, "danger");
    return;
  }

  historyState.items = historyState.items.filter(item => Number(item.id) !== analysisId);
  closeHistoryDeleteModal();
  updateHistoryView();
  if (!historyState.items.length && !historyState.hasMore) {
    renderHistoryList([], { append: false });
  }
  window.AppAuth?.showToast("سابقه از لیست شما مخفی شد.", "success");
}

async function initHistoryPage() {
  const container = $("historyList");
  const loadMore = $("historyLoadMore");
  const loadMoreText = $("historyLoadMoreText");
  if (!container || !loadMore || !loadMoreText) return;
  document.querySelector("[data-project-back]")?.addEventListener("click", () => {
    window.location.href = "projects.html";
  });
  const title = document.querySelector("[data-history-title]");
  const subtitle = document.querySelector("[data-history-subtitle]");
  const emptyTitle = document.querySelector("[data-history-empty-title]");
  const emptyText = document.querySelector("[data-history-empty-text]");
  if (activeHistoryProjectId) {
    if (title) title.textContent = "لیست تحلیل‌ها";
    if (subtitle) subtitle.textContent = "آخرین تحلیل‌های ثبت‌شده برای این ترانسفورماتور در این بخش قابل مشاهده است.";
    if (emptyTitle) emptyTitle.textContent = "هنوز تحلیلی ثبت نشده است";
    if (emptyText) emptyText.textContent = "برای این ترانسفورماتور هنوز سابقه‌ای ثبت نشده است.";
    const { data: project, error: projectError } = await window.AppAuth.getProject(activeHistoryProjectId);
    if (!projectError && project) {
      renderProjectDetails(project);
    } else if (activeHistoryProjectName) {
      const fallbackTitle = document.querySelector("[data-project-title]");
      const fallbackHeader = document.querySelector("[data-project-header-title]");
      if (fallbackTitle) fallbackTitle.textContent = activeHistoryProjectName;
      if (fallbackHeader) fallbackHeader.textContent = activeHistoryProjectName;
    }
  }

  function updateLoadMoreState({ visible, loadingMore = false }) {
    loadMore.hidden = !visible;
    loadMoreText.hidden = !visible || !loadingMore;
  }

  historyState.items = [];
  historyState.loading = false;
  historyState.hasMore = true;
  historyState.deletingId = null;
  setupHistoryDeleteModal();
  updateLoadMoreState({ visible: true, loadingMore: false });
  container.innerHTML = `
    <div class="panel history-loading history-loading-panel">
      <div class="history-loading-more">
        <span>${activeHistoryProjectId ? "در حال بارگذاری سوابق ترانسفورماتور" : "در حال بارگذاری سوابق کاربر"}</span>
        <span class="loading-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>
  `;

  container.addEventListener("click", event => {
    const deleteButton = event.target.closest("[data-history-delete]");
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      openHistoryDeleteModal(deleteButton.dataset.historyDelete);
      return;
    }
    const card = event.target.closest("[data-history-result]");
    if (!card) return;
    openHistoryResult(card.dataset.historyResult);
  });
  container.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.closest("[data-history-delete]")) {
      event.preventDefault();
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-history-result]");
    if (!card) return;
    event.preventDefault();
    openHistoryResult(card.dataset.historyResult);
  });

  async function loadNextPage() {
    if (historyState.loading || !historyState.hasMore) return;
    historyState.loading = true;
    const isFirstPage = historyState.items.length === 0;
    updateLoadMoreState({ visible: true, loadingMore: !isFirstPage });
    const { data, error } = await window.AppAuth.listAnalyses({
      limit: HISTORY_PAGE_SIZE + 1,
      offset: historyState.items.length,
      projectId: activeHistoryProjectId || undefined
    });
    historyState.loading = false;
    updateLoadMoreState({ visible: true, loadingMore: false });
    if (error) {
      container.innerHTML = `<div class="panel history-loading history-error">${escapeHtml(error)}</div>`;
      historyState.hasMore = false;
      updateLoadMoreState({ visible: false, loadingMore: false });
      historyState.observer?.disconnect?.();
      return;
    }

    const fetchedItems = data || [];
    const nextItems = fetchedItems.slice(0, HISTORY_PAGE_SIZE);
    if (isFirstPage) container.innerHTML = "";
    renderHistoryList(nextItems, { append: !isFirstPage });
    historyState.items.push(...nextItems);
    historyState.hasMore = fetchedItems.length > HISTORY_PAGE_SIZE;
    updateLoadMoreState({ visible: historyState.hasMore, loadingMore: false });
    if (!historyState.hasMore) {
      historyState.observer?.disconnect?.();
    }
    if (!historyState.hasMore && !historyState.items.length) {
      renderHistoryList([], { append: false });
    }
  }

  historyState.observer?.disconnect?.();
  historyState.observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadNextPage();
    }
  }, { rootMargin: "120px 0px" });
  historyState.observer.observe(loadMore);

  await loadNextPage();
}

function extractProjectNotes(project) {
  return String(project?.extra_attributes?.notes || "").trim();
}

function buildProjectAnalysisSummaryMap(items) {
  const summaryById = {};
  (items || []).forEach(item => {
    const projectId = Number(item.project_id || 0);
    if (!projectId) return;
    const candidateDate = item.sampled_at || item.created_at || null;
    const current = summaryById[projectId] || {
      count: 0,
      lastTestAt: null
    };
    current.count += 1;
    if (!current.lastTestAt || (candidateDate && new Date(candidateDate).getTime() > new Date(current.lastTestAt).getTime())) {
      current.lastTestAt = candidateDate;
    }
    summaryById[projectId] = current;
  });
  return summaryById;
}

function buildProjectCard(project) {
  const notes = extractProjectNotes(project);
  const summary = projectsState.analysisSummaryById[Number(project.id)] || { count: 0, lastTestAt: null };
  const stationLabel = project.station_name || "بدون نام ایستگاه";
  const companyLabel = project.company_name || "بدون نام شرکت";
  const stats = [
    {
      label: "آخرین تست",
      value: summary.lastTestAt ? formatDateOnly(summary.lastTestAt) : "ثبت نشده است"
    },
    {
      label: "تعداد تحلیل",
      value: `${formatMixedLabel(summary.count)} مورد`
    }
  ];

  return `
    <article class="project-card panel" role="link" tabindex="0" data-project-id="${escapeHtml(String(project.id))}" data-project-name="${escapeHtml(buildProjectOptionLabel(project))}">
      <div class="project-card-top">
        <div class="project-card-brand" aria-hidden="true">
          <i class="uil uil-bolt-alt"></i>
        </div>
        <div class="project-card-head-copy">
          <strong class="project-card-title">${escapeHtml(project.transformer_number || "ترانس بدون عنوان")}</strong>
          <div class="project-card-subtitle-row">
            <div class="project-card-subtitle-meta">
              <span class="project-card-meta-item">
                <i class="uil uil-location-point" aria-hidden="true"></i>
                <span>${escapeHtml(stationLabel)}</span>
              </span>
              <span class="project-card-meta-separator" aria-hidden="true">|</span>
              <span class="project-card-meta-item">
                <i class="uil uil-building" aria-hidden="true"></i>
                <span>${escapeHtml(companyLabel)}</span>
              </span>
            </div>
            <i class="uil uil-angle-left-b project-card-entry-icon" aria-hidden="true"></i>
          </div>
        </div>
      </div>
      <div class="project-card-stats">
        ${stats.map(item => `
          <div class="project-card-stat">
            <span class="project-card-stat-label">${escapeHtml(item.label)}</span>
            <strong class="project-card-stat-value">${escapeHtml(item.value)}</strong>
          </div>
        `).join("")}
      </div>
      ${notes ? `<p class="project-card-notes">${escapeHtml(notes)}</p>` : ""}
    </article>
  `;
}

function openProjectHistory(projectId, projectName) {
  if (!projectId) return;
  const params = new URLSearchParams();
  params.set("projectId", String(projectId));
  if (projectName) params.set("projectName", projectName);
  window.location.href = `history.html?${params.toString()}`;
}

function renderProjectDetails(project) {
  if (!project) return;
  const title = project.transformer_number || "ترانس بدون عنوان";
  const subtitle = project.station_name || "بدون نام ایستگاه";
  const headerTitle = `${title} | ${subtitle}`;
  const set = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value || "نامشخص";
  };
  set("[data-project-header-title]", headerTitle);
  set("[data-project-title]", title);
  set("[data-project-subtitle]", subtitle);
  set("[data-detail-company]", project.company_name || "نامشخص");
  set("[data-detail-station]", project.station_name || "نامشخص");
  set("[data-detail-transformer]", project.transformer_number || "نامشخص");
  set("[data-detail-voltage]", project.voltage_kv !== null && project.voltage_kv !== undefined ? `${formatMixedLabel(project.voltage_kv)} کیلوولت` : "نامشخص");
  set("[data-detail-capacity]", project.capacity_mva !== null && project.capacity_mva !== undefined ? `${formatMixedLabel(project.capacity_mva)} مگاولت‌آمپر` : "نامشخص");
  set("[data-detail-manufacturer]", project.manufacturer || "نامشخص");
  set("[data-detail-year]", project.manufactured_year ? formatMixedLabel(project.manufactured_year) : "نامشخص");
}

function buildProjectsEmptyState() {
  return `
    <section class="panel empty-state projects-empty-state" aria-hidden="false">
      <div class="projects-empty-icon" aria-hidden="true">
        <i class="uil uil-briefcase-alt"></i>
      </div>
      <span class="projects-empty-kicker">شروع ساختار ترانسفورماتورها</span>
      <h2>هنوز ترانسفورماتوری ثبت نشده است</h2>
      <p>برای آغاز ثبت سوابق، نخستین ترانسفورماتور را تعریف نمایید.</p>
      <button class="button-link" type="button" id="projectEmptyInlineCta">ثبت ترانسفورماتور</button>
    </section>
  `;
}

function renderProjectsList(items) {
  const list = $("projectsList");
  const empty = $("projectsEmpty");
  if (!list || !empty) return;

  if (!items.length) {
    empty.hidden = true;
    empty.style.display = "none";
    empty.setAttribute("aria-hidden", "true");
    list.innerHTML = buildProjectsEmptyState();
    $("projectEmptyInlineCta")?.addEventListener("click", openProjectFormModal);
    return;
  }

  empty.hidden = true;
  empty.style.display = "none";
  empty.setAttribute("aria-hidden", "true");
  list.innerHTML = items.map(buildProjectCard).join("");
}

function resetProjectForm() {
  projectFormModalState?.form?.reset();
  const submitButton = projectFormModalState?.submit;
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "ثبت ترانسفورماتور";
  }
}

function closeProjectFormModal() {
  if (!projectFormModalState) return;
  resetProjectForm();
  closeAnimatedModal(projectFormModalState.shell);
}

function openProjectFormModal() {
  if (!projectFormModalState) return;
  resetProjectForm();
  openAnimatedModal(projectFormModalState.shell);
}

function setupProjectFormModal() {
  if (projectFormModalState || !$("projectFormModal")) return;
  projectFormModalState = {
    shell: $("projectFormModal"),
    backdrop: $("projectFormBackdrop"),
    form: $("projectForm"),
    submit: $("projectSubmit"),
    cancel: $("projectCancel")
  };

  projectFormModalState.backdrop?.addEventListener("click", closeProjectFormModal);
  projectFormModalState.cancel?.addEventListener("click", closeProjectFormModal);
  $("projectAddButton")?.addEventListener("click", openProjectFormModal);
  $("projectEmptyCta")?.addEventListener("click", openProjectFormModal);
  $("projectsList")?.addEventListener("click", event => {
    const card = event.target.closest("[data-project-id]");
    if (!card) return;
    openProjectHistory(card.dataset.projectId, card.dataset.projectName);
  });
  $("projectsList")?.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-project-id]");
    if (!card) return;
    event.preventDefault();
    openProjectHistory(card.dataset.projectId, card.dataset.projectName);
  });

  projectFormModalState.form?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!projectFormModalState) return;
    const formData = new FormData(projectFormModalState.form);
    projectFormModalState.submit.disabled = true;
    projectFormModalState.submit.textContent = "در حال ثبت اطلاعات...";

    const { data, error } = await window.AppAuth.createProject({
      companyName: formData.get("companyName"),
      stationName: formData.get("stationName"),
      transformerNumber: formData.get("transformerNumber"),
      voltageKv: formData.get("voltageKv"),
      capacityMva: formData.get("capacityMva"),
      manufacturer: formData.get("manufacturer"),
      manufacturedYear: formData.get("manufacturedYear"),
      extraNotes: formData.get("extraNotes")
    });

    if (error) {
      projectFormModalState.submit.disabled = false;
      projectFormModalState.submit.textContent = "ثبت ترانسفورماتور";
      window.AppAuth?.showToast(error, "danger");
      return;
    }

    projectsState.items.unshift(data);
    renderProjectsList(projectsState.items);
    closeProjectFormModal();
    window.AppAuth?.showToast("ترانسفورماتور با موفقیت اضافه شد.", "success");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && projectFormModalState && !projectFormModalState.shell.hidden) {
      closeProjectFormModal();
    }
  });
}

async function initProjectsPage() {
  const list = $("projectsList");
  if (!list) return;

  setupProjectFormModal();
  setupLogoutModal();
  projectsState.loading = true;
  list.innerHTML = `
    <div class="panel history-loading history-loading-panel">
      <div class="history-loading-more">
        <span>در حال بارگذاری اطلاعات ترانسفورماتورها</span>
        <span class="loading-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>
  `;

  const [{ data, error }, { data: analysesData, error: analysesError }] = await Promise.all([
    window.AppAuth.listProjects(),
    window.AppAuth.listAnalyses({ limit: 1000, offset: 0 })
  ]);
  projectsState.loading = false;

  if (error) {
    list.innerHTML = `<div class="panel history-loading history-error">${escapeHtml(error)}</div>`;
    return;
  }

  projectsState.items = data || [];
  projectsState.analysisSummaryById = analysesError ? {} : buildProjectAnalysisSummaryMap(analysesData || []);
  renderProjectsList(projectsState.items);
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
  openAnimatedModal(infoSheetState.shell);
}

function closeInfoSheet() {
  if (!infoSheetState) return;
  infoSheetState.activeMethod = null;
  infoSheetState.dragY = 0;
  closeAnimatedModal(infoSheetState.shell, () => {
    infoSheetState.sheet.style.transition = "";
    infoSheetState.sheet.style.transform = "";
    infoSheetState.backdrop.style.opacity = "";
  });
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

async function bootPage() {
  if (window.AppAuth?.ready) await window.AppAuth.ready;
  if (isResultsPage) {
    initResultsPage();
    return;
  }
  if (isProjectsPage) {
    initProjectsPage();
    return;
  }
  if (isProfilePage) {
    initProfilePage();
    return;
  }
  if (isHistoryPage) {
    initHistoryPage();
    return;
  }
  initEntryPage();
}

async function initProfilePage() {
  setupLogoutModal();
  const projectCountNode = document.querySelector("[data-profile-project-count]");
  const analysisCountNode = document.querySelector("[data-profile-analysis-count]");
  if (!projectCountNode || !analysisCountNode) return;

  projectCountNode.textContent = "—";
  analysisCountNode.textContent = "—";

  const [{ data: projects, error: projectsError }, { data: analyses, error: analysesError }] = await Promise.all([
    window.AppAuth.listProjects(),
    window.AppAuth.listAnalyses({ limit: 1000, offset: 0 })
  ]);

  if (projectsError || analysesError) {
    if (projectsError) window.AppAuth?.showToast(projectsError, "warning");
    if (analysesError) window.AppAuth?.showToast(analysesError, "warning");
    projectCountNode.textContent = "نامشخص";
    analysisCountNode.textContent = "نامشخص";
    return;
  }

  projectCountNode.textContent = formatMixedLabel((projects || []).length);
  analysisCountNode.textContent = formatMixedLabel((analyses || []).length);
}

document.addEventListener("DOMContentLoaded", bootPage);
