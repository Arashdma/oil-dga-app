const faultDefinitions = {
  PD: {
    title: "تخلیه جزئی",
    family: "خطای الکتریکی",
    severityLabel: "متوسط",
    severityLevel: 2,
    description: "نشانه‌ای از تخلیه الکتریکی موضعی یا کرونا در داخل ترانسفورماتور است. معمولاً با افزایش هیدروژن همراه می‌شود و می‌تواند نشانه یک عیب اولیه باشد.",
    recommendation: "روند تغییر گازها بررسی شود، نمونه‌گیری مجدد در بازه کوتاه‌تر انجام شود و وضعیت عایق و نقاط مستعد تخلیه کنترل شود."
  },
  D1: {
    title: "تخلیه الکتریکی با انرژی کم",
    family: "خطای الکتریکی",
    severityLabel: "زیاد",
    severityLevel: 3,
    description: "نشان‌دهنده جرقه یا تخلیه الکتریکی کم‌انرژی است. این وضعیت از تخلیه جزئی جدی‌تر است و نیاز به بررسی دقیق‌تر دارد.",
    recommendation: "بازرسی تخصصی، بررسی روند رشد گازها و مقایسه با سوابق تست‌های قبلی توصیه می‌شود."
  },
  D2: {
    title: "تخلیه الکتریکی با انرژی زیاد",
    family: "خطای الکتریکی",
    severityLabel: "خیلی زیاد",
    severityLevel: 4,
    description: "نشان‌دهنده قوس الکتریکی یا آرک داخلی است. این خطا می‌تواند بسیار جدی باشد و در صورت تداوم، ریسک آسیب جدی به ترانسفورماتور دارد.",
    recommendation: "بررسی فوری توسط کارشناس، نمونه‌گیری مجدد، بررسی رله بوخهلتس و تصمیم‌گیری بهره‌برداری با احتیاط انجام شود."
  },
  T1: {
    title: "خطای حرارتی دمای پایین",
    family: "خطای حرارتی",
    severityLabel: "متوسط",
    severityLevel: 2,
    description: "نشان‌دهنده گرم‌شدن بیش از حد در محدوده دمای پایین، معمولاً کمتر از حدود ۳۰۰ درجه سانتی‌گراد است.",
    recommendation: "شرایط بارگیری، سیستم خنک‌کاری، سوابق تست روغن و روند رشد گازها بررسی شود."
  },
  T2: {
    title: "خطای حرارتی دمای متوسط",
    family: "خطای حرارتی",
    severityLabel: "زیاد",
    severityLevel: 3,
    description: "نشان‌دهنده خطای حرارتی در محدوده حدود ۳۰۰ تا ۷۰۰ درجه سانتی‌گراد است. این وضعیت می‌تواند ناشی از نقاط داغ، مشکل در اتصالات یا شرایط نامطلوب بهره‌برداری باشد.",
    recommendation: "بررسی دقیق‌تر وضعیت بارگیری، اتصالات، سیستم خنک‌کاری و نمونه‌گیری مجدد در بازه کوتاه‌تر توصیه می‌شود."
  },
  T3: {
    title: "خطای حرارتی دمای بالا",
    family: "خطای حرارتی",
    severityLabel: "خیلی زیاد",
    severityLevel: 4,
    description: "نشان‌دهنده خطای حرارتی شدید، معمولاً بالاتر از حدود ۷۰۰ درجه سانتی‌گراد است. این وضعیت می‌تواند برای ترانسفورماتور خطرناک باشد.",
    recommendation: "بررسی فوری، تصمیم‌گیری بهره‌برداری با نظر کارشناس، کنترل بارگیری و انجام تست تکمیلی توصیه می‌شود."
  },
  DT: {
    title: "خطای ترکیبی یا نامشخص",
    family: "خطای ترکیبی",
    severityLabel: "زیاد",
    severityLevel: 3,
    description: "نشانه‌هایی از خطای حرارتی و الکتریکی به‌صورت همزمان یا نتیجه‌ای مبهم بین چند ناحیه خطا دیده می‌شود.",
    recommendation: "نتیجه باید با چند روش DGA، سوابق تست‌های قبلی، شرایط بهره‌برداری و نظر کارشناس بررسی شود."
  },
  "T3+D2": {
    title: "خطای ترکیبی حرارتی شدید و الکتریکی شدید",
    family: "خطای ترکیبی",
    severityLabel: "بحرانی",
    severityLevel: 5,
    description: "هم‌زمان نشانه‌هایی از خطای حرارتی شدید و تخلیه الکتریکی با انرژی زیاد دیده می‌شود. این وضعیت بسیار جدی است.",
    recommendation: "بررسی فوری و تصمیم‌گیری اضطراری توسط تیم بهره‌برداری و کارشناس ترانسفورماتور توصیه می‌شود."
  },
  "T2-D2": {
    title: "خطای محتمل بین حرارتی متوسط و الکتریکی شدید",
    family: "خطای ترکیبی / مبهم",
    severityLabel: "زیاد",
    severityLevel: 3,
    description: "نتیجه بین خطای حرارتی متوسط و تخلیه الکتریکی با انرژی زیاد قرار گرفته است و نیاز به بررسی تکمیلی دارد.",
    recommendation: "روش‌های مختلف DGA با هم مقایسه شوند و نمونه‌گیری مجدد برای بررسی روند رشد گازها انجام شود."
  },
  Thermal: {
    title: "تخریب یا خطای حرارتی",
    family: "خطای حرارتی",
    severityLabel: "نیازمند بررسی",
    severityLevel: 2,
    description: "نشانه‌های کلی از تخریب حرارتی یا گرم‌شدن بیش از حد دیده می‌شود، اما سطح دقیق دما مشخص نشده است.",
    recommendation: "برای تشخیص دقیق‌تر، نتیجه با روش‌های IEC، Rogers، Duval و POTG مقایسه شود."
  },
  "Level 1": {
    title: "سطح یک گازهای محلول",
    family: "شاخص کلی وضعیت",
    severityLabel: "کم",
    severityLevel: 1,
    description: "مقدار کلی گازهای محلول در محدوده کم قرار دارد و از نظر شاخص TDCG وضعیت نسبتاً عادی ارزیابی می‌شود.",
    recommendation: "پایش دوره‌ای طبق برنامه نگهداری ادامه یابد."
  },
  "Level 2": {
    title: "سطح دو گازهای محلول",
    family: "شاخص کلی وضعیت",
    severityLabel: "متوسط",
    severityLevel: 2,
    description: "افزایش گازهای محلول مشاهده می‌شود و نیاز به توجه و پایش منظم‌تر وجود دارد.",
    recommendation: "روند تغییرات گازها و شرایط بهره‌برداری با دقت بیشتری بررسی شود."
  },
  "Level 3": {
    title: "سطح سه گازهای محلول",
    family: "شاخص کلی وضعیت",
    severityLabel: "زیاد",
    severityLevel: 3,
    description: "گازهای محلول در سطحی قرار گرفته‌اند که احتمال وجود عیب فعال را تقویت می‌کند.",
    recommendation: "نمونه‌گیری مجدد، بررسی شرایط کاری و تحلیل تکمیلی توصیه می‌شود."
  },
  "Level 4": {
    title: "سطح چهار گازهای محلول",
    family: "شاخص کلی وضعیت",
    severityLabel: "خیلی زیاد",
    severityLevel: 4,
    description: "مقدار کل گازها در محدوده هشدار بالا قرار دارد و می‌تواند نشانه یک خطای جدی یا در حال توسعه باشد.",
    recommendation: "بررسی فوری و تصمیم‌گیری بهره‌برداری با نظر کارشناس انجام شود."
  },
  unknown: {
    title: "قابل تشخیص نیست",
    family: "نامشخص",
    severityLabel: "نامشخص",
    severityLevel: 1,
    description: "بر اساس داده‌های واردشده، تشخیص قطعی یا قابل اتکا به دست نیامده است.",
    recommendation: "مقادیر ورودی، واحدها، کیفیت نمونه‌گیری و سوابق تست بررسی شود."
  }
};

const faultAliases = {
  "": "unknown",
  UNKNOWN: "unknown",
  "نامشخص": "unknown",
  "نیازمند بررسی": "unknown",
  "قابل تشخیص نیست": "unknown",
  "تخریب حرارتی": "Thermal",
  "خطای حرارتی": "Thermal",
  THERMAL: "Thermal",
  ARC: "D2",
  "T3 + D2": "T3+D2",
  "T3+ D2": "T3+D2",
  "T3 +D2": "T3+D2",
  "T2 - D2": "T2-D2",
  "T2- D2": "T2-D2",
  "T2 -D2": "T2-D2"
};

function normalizeFaultCode(code) {
  if (!code) return "unknown";
  const trimmed = String(code).trim();
  if (!trimmed) return "unknown";

  const collapsed = trimmed.replace(/\s+/g, " ");
  const directAlias = faultAliases[collapsed];
  if (directAlias) return directAlias;

  const upper = collapsed.toUpperCase();
  if (faultAliases[upper]) return faultAliases[upper];

  const compact = upper.replace(/\s+/g, "");
  if (compact === "T3+D2") return "T3+D2";
  if (compact === "T2-D2") return "T2-D2";
  if (compact === "THERMAL") return "Thermal";
  if (compact === "ARC") return "D2";
  if (/^LEVEL[1-4]$/.test(compact)) return `Level ${compact.slice(-1)}`;

  if (faultDefinitions[trimmed]) return trimmed;
  if (faultDefinitions[upper]) return upper;

  return "unknown";
}

function getFaultDefinition(code) {
  const normalizedCode = normalizeFaultCode(code);
  return {
    code: normalizedCode,
    ...faultDefinitions[normalizedCode]
  };
}

window.faultDefinitions = faultDefinitions;
window.getFaultDefinition = getFaultDefinition;
window.normalizeFaultCode = normalizeFaultCode;
