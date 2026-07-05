// هسته تشخیص: این فایل باید تا حد ممکن مستقل از ظاهر اپ باشد.
// فعلاً برخی روش‌ها ساده‌سازی شده‌اند. هدف نسخه بعدی: دقیق‌تر کردن POTG هندسی و جداول Rogers/Doernenberg/Duval.

function safeDivide(a, b) {
  if (!b || b === 0) return null;
  return a / b;
}

function round(num, digits = 2) {
  if (num === null || Number.isNaN(num)) return null;
  return Number(num.toFixed(digits));
}

const L1_LIMITS = {
  H2: 100,
  CH4: 120,
  C2H2: 25,
  C2H4: 50,
  C2H6: 65,
  CO: 250,
  CO2: 2500
};

const HEPTAGON_WEIGHTS = {
  H2: 3.5,
  CH4: 2.9167,
  C2H6: 5.3846,
  C2H4: 7,
  C2H2: 116.6667,
  CO: 1,
  CO2: 0.14
};

const HEPTAGON_REFERENCE_CASES = [
  { code: "PD", percentages: { H2: 93.42, CH4: 5.63, C2H2: 0, C2H4: 0, C2H6: 0.67, CO: 0.3, CO2: 0.1 } },
  { code: "HCCD", percentages: { H2: 2.96, CH4: 0.62, C2H2: 0, C2H4: 3.04, C2H6: 1.45, CO: 72.18, CO2: 19.74 } },
  { code: "NORMAL", percentages: { H2: 9.27, CH4: 19, C2H2: 0, C2H4: 26.18, C2H6: 7.8, CO: 9.24, CO2: 28.52 } },
  { code: "T1", percentages: { H2: 3.25, CH4: 8.39, C2H2: 7.7, C2H4: 3.16, C2H6: 43.85, CO: 8.39, CO2: 25.25 } },
  { code: "T2", percentages: { H2: 12.75, CH4: 19.43, C2H2: 0.64, C2H4: 53.59, C2H6: 13.44, CO: 0.11, CO2: 0.05 } },
  { code: "T3", percentages: { H2: 9.75, CH4: 18.99, C2H2: 19.38, C2H4: 39.7, C2H6: 7.78, CO: 2.68, CO2: 1.63 } },
  { code: "NORMAL", percentages: { H2: 16.27, CH4: 3.8, C2H2: 0, C2H4: 3.91, C2H6: 37.69, CO: 28.91, CO2: 9.42 } },
  { code: "D2", percentages: { H2: 1.03, CH4: 0.5, C2H2: 95.43, C2H4: 2.91, C2H6: 0.09, CO: 0.04, CO2: 0.01 } },
  { code: "MCCD", percentages: { H2: 4.03, CH4: 42.25, C2H2: 0, C2H4: 1.72, C2H6: 3.65, CO: 45.11, CO2: 3.24 } },
  { code: "D1", percentages: { H2: 7.27, CH4: 2.05, C2H2: 84.24, C2H4: 2.68, C2H6: 2, CO: 1.12, CO2: 0.65 } },
  { code: "D2", percentages: { H2: 4.29, CH4: 1.08, C2H2: 87.12, C2H4: 4.59, C2H6: 0.28, CO: 1.37, CO2: 1.27 } },
  { code: "D1", percentages: { H2: 0.7, CH4: 0.12, C2H2: 98.34, C2H4: 0.73, C2H6: 0.02, CO: 0.08, CO2: 0.01 } },
  { code: "D2", percentages: { H2: 3.83, CH4: 1.53, C2H2: 90.17, C2H4: 4.31, C2H6: 0.19, CO: 0.02, CO2: 0.01 } },
  { code: "D2", percentages: { H2: 6.23, CH4: 0.38, C2H2: 72.66, C2H4: 4.4, C2H6: 0.27, CO: 5.64, CO2: 10.42 } },
  { code: "D1", percentages: { H2: 11.77, CH4: 1.59, C2H2: 80.76, C2H4: 2.57, C2H6: 0.81, CO: 2.16, CO2: 0.34 } },
  { code: "T2", percentages: { H2: 4.51, CH4: 5.65, C2H2: 0, C2H4: 3.04, C2H6: 2.26, CO: 59.26, CO2: 25.27 } },
  { code: "T2", percentages: { H2: 0, CH4: 2.4, C2H2: 2.17, C2H4: 50.57, C2H6: 44.83, CO: 0.02, CO2: 0 } },
  { code: "T3", percentages: { H2: 11.86, CH4: 13.29, C2H2: 7.4, C2H4: 49.51, C2H6: 5.81, CO: 6.12, CO2: 5.95 } },
  { code: "LCCD", percentages: { H2: 30.98, CH4: 6.79, C2H2: 0, C2H4: 8.13, C2H6: 5.69, CO: 37.06, CO2: 11.35 } },
  { code: "PD", percentages: { H2: 88.21, CH4: 7.94, C2H2: 2.45, C2H4: 0.11, C2H6: 0.95, CO: 0.24, CO2: 0.1 } },
  { code: "PD", percentages: { H2: 88.55, CH4: 7.89, C2H2: 2.16, C2H4: 0.11, C2H6: 0.95, CO: 0.23, CO2: 0.1 } },
  { code: "D1", percentages: { H2: 7.27, CH4: 2.05, C2H2: 84.24, C2H4: 2.68, C2H6: 2, CO: 1.12, CO2: 0.65 } },
  { code: "D2", percentages: { H2: 3.48, CH4: 0.76, C2H2: 91.16, C2H4: 3.78, C2H6: 0, CO: 0.42, CO2: 0.4 } },
  { code: "D2", percentages: { H2: 8.21, CH4: 3.08, C2H2: 81.52, C2H4: 5.45, C2H6: 0.16, CO: 1.49, CO2: 0.09 } },
  { code: "PD", percentages: { H2: 58.82, CH4: 33.46, C2H2: 0, C2H4: 0.13, C2H6: 7.06, CO: 0.53, CO2: 0 } },
  { code: "D1", percentages: { H2: 0.24, CH4: 0.02, C2H2: 96.22, C2H4: 0.85, C2H6: 0.21, CO: 1.54, CO2: 0.91 } },
  { code: "D1", percentages: { H2: 7.08, CH4: 1.22, C2H2: 78.49, C2H4: 0.91, C2H6: 0.12, CO: 8.37, CO2: 3.81 } },
  { code: "D1", percentages: { H2: 2.63, CH4: 1.52, C2H2: 91.74, C2H4: 3.89, C2H6: 0.14, CO: 0.08, CO2: 0 } },
  { code: "NORMAL", percentages: { H2: 41.66, CH4: 31.61, C2H2: 0, C2H4: 8.84, C2H6: 1.92, CO: 13.69, CO2: 2.28 } },
  { code: "T3", percentages: { H2: 2.4, CH4: 14.52, C2H2: 0, C2H4: 51.99, C2H6: 30.05, CO: 0.02, CO2: 1.02 } }
];

function calculateTDCG(g) {
  // TDCG معمولاً جمع گازهای قابل احتراق است.
  return g.H2 + g.CH4 + g.C2H2 + g.C2H4 + g.C2H6 + g.CO;
}

function diagnoseIEEE(g) {
  const tdcg = calculateTDCG(g);
  if (tdcg <= 720) return { result: "Level 1", tdcg };
  if (tdcg <= 1920) return { result: "Level 2", tdcg };
  if (tdcg <= 4630) return { result: "Level 3", tdcg };
  return { result: "Level 4", tdcg };
}

function calculateRatios(g) {
  return {
    x1_C2H2_C2H4: round(safeDivide(g.C2H2, g.C2H4), 4),
    x2_CH4_H2: round(safeDivide(g.CH4, g.H2), 4),
    x3_C2H4_C2H6: round(safeDivide(g.C2H4, g.C2H6), 4),
    r3_C2H2_CH4: round(safeDivide(g.C2H2, g.CH4), 4),
    r4_C2H6_C2H2: round(safeDivide(g.C2H6, g.C2H2), 4),
    co_co2: round(safeDivide(g.CO, g.CO2), 4),
    co2_co: round(safeDivide(g.CO2, g.CO), 4)
  };
}

function evaluateL1Eligibility(g) {
  const exceededGases = Object.entries(L1_LIMITS)
    .filter(([gas, limit]) => Number(g[gas] || 0) > limit)
    .map(([gas]) => gas);

  return {
    isEligible: exceededGases.length > 0,
    exceededGases
  };
}

function calculatePotgPercentages(g) {
  const total = g.H2 + g.CH4 + g.C2H2 + g.C2H4;
  if (!total) return { H2: 0, CH4: 0, C2H2: 0, C2H4: 0 };
  return {
    H2: round((g.H2 / total) * 100, 2),
    CH4: round((g.CH4 / total) * 100, 2),
    C2H2: round((g.C2H2 / total) * 100, 2),
    C2H4: round((g.C2H4 / total) * 100, 2)
  };
}

function calculateHeptagonPercentages(g) {
  const denominator = (
    (HEPTAGON_WEIGHTS.H2 * g.H2) +
    (HEPTAGON_WEIGHTS.CH4 * g.CH4) +
    (HEPTAGON_WEIGHTS.C2H6 * g.C2H6) +
    (HEPTAGON_WEIGHTS.C2H4 * g.C2H4) +
    (HEPTAGON_WEIGHTS.C2H2 * g.C2H2) +
    g.CO +
    (HEPTAGON_WEIGHTS.CO2 * g.CO2)
  );

  if (!denominator) {
    return { H2: 0, CH4: 0, C2H2: 0, C2H4: 0, C2H6: 0, CO: 0, CO2: 0 };
  }

  return {
    H2: round(((HEPTAGON_WEIGHTS.H2 * g.H2) / denominator) * 100, 2),
    CH4: round(((HEPTAGON_WEIGHTS.CH4 * g.CH4) / denominator) * 100, 2),
    C2H2: round(((HEPTAGON_WEIGHTS.C2H2 * g.C2H2) / denominator) * 100, 2),
    C2H4: round(((HEPTAGON_WEIGHTS.C2H4 * g.C2H4) / denominator) * 100, 2),
    C2H6: round(((HEPTAGON_WEIGHTS.C2H6 * g.C2H6) / denominator) * 100, 2),
    CO: round((g.CO / denominator) * 100, 2),
    CO2: round(((HEPTAGON_WEIGHTS.CO2 * g.CO2) / denominator) * 100, 2)
  };
}

function getHeptagonDistance(a, b) {
  const gases = ["H2", "CH4", "C2H2", "C2H4", "C2H6", "CO", "CO2"];
  return Math.sqrt(gases.reduce((sum, gas) => sum + ((a[gas] - b[gas]) ** 2), 0));
}

function diagnoseHeptagon(g) {
  const percentages = calculateHeptagonPercentages(g);
  const exceededL1 = Object.entries(L1_LIMITS).some(([gas, limit]) => Number(g[gas] || 0) > limit);

  if (!exceededL1) {
    return { result: "NORMAL", percentages, distance: 0, source: "baseline" };
  }

  if (percentages.H2 >= 55 && percentages.C2H2 <= 5 && percentages.C2H4 <= 5) {
    return { result: "PD", percentages, distance: 0, source: "baseline" };
  }

  let nearest = HEPTAGON_REFERENCE_CASES[0];
  let shortestDistance = getHeptagonDistance(percentages, nearest.percentages);

  for (let i = 1; i < HEPTAGON_REFERENCE_CASES.length; i += 1) {
    const candidate = HEPTAGON_REFERENCE_CASES[i];
    const distance = getHeptagonDistance(percentages, candidate.percentages);
    if (distance < shortestDistance) {
      nearest = candidate;
      shortestDistance = distance;
    }
  }

  return {
    result: nearest.code,
    percentages,
    distance: round(shortestDistance, 3),
    source: "reference-match"
  };
}

function diagnoseIEC(g) {
  const r = calculateRatios(g);
  const x1 = r.x1_C2H2_C2H4;
  const x2 = r.x2_CH4_H2;
  const x3 = r.x3_C2H4_C2H6;

  // ساده‌سازی اولیه از منطق نسبت‌ها. نسخه بعدی باید با جدول دقیق IEC تکمیل شود.
  if (x1 === null || x2 === null || x3 === null) return "نامشخص";

  if (x1 > 0.6 && x1 <= 2.5 && x2 >= 0.1 && x2 <= 1 && x3 > 2) return "D2";
  if (x1 > 2.5 && x2 >= 0.1 && x2 <= 1) return "D2";
  if (x1 < 0.1 && x2 > 1 && x3 > 4) return "T3";
  if (x1 < 0.1 && x2 > 1 && x3 >= 1 && x3 <= 4) return "T2";
  if (x1 < 0.1 && x2 > 1 && x3 < 1) return "T1";
  if (x2 < 0.1 && x1 < 0.2) return "PD";
  return "نیازمند بررسی";
}

function diagnoseRogers(g) {
  const r = calculateRatios(g);
  const x1 = r.x2_CH4_H2;
  const x2 = r.x3_C2H4_C2H6;
  const x3 = r.x1_C2H2_C2H4;
  if (x1 === null || x2 === null || x3 === null) return "نامشخص";

  // ساده‌سازی برای MVP
  if (x3 >= 0.1 && x3 < 3 && x2 > 1) return "D2";
  if (x1 > 1 && x2 > 3 && x3 < 0.1) return "T3";
  if (x1 > 1 && x2 >= 1 && x2 <= 3 && x3 < 0.1) return "T2";
  if (x1 > 1 && x2 < 1 && x3 < 0.1) return "T1";
  return "نیازمند بررسی";
}

function diagnoseDoernenberg(g) {
  const r = calculateRatios(g);
  const r1 = r.x2_CH4_H2;
  const r2 = r.x1_C2H2_C2H4;
  const r3 = r.r3_C2H2_CH4;
  const r4 = r.r4_C2H6_C2H2;
  if ([r1, r2, r3, r4].some(v => v === null)) return "نامشخص";

  if (r1 > 1 && r2 < 0.3 && r3 < 0.3 && r4 > 0.75) return "Thermal";
  if (r1 < 1 && r2 > 0.3 && r3 > 0.3 && r4 < 0.75) return "Arc";
  if (r1 < 0.1 && r2 < 0.3) return "PD";
  return "نیازمند بررسی";
}

function diagnoseDuvalApprox(g) {
  // تقریب ساده مثلث دوال: فقط برای MVP. نسخه بعدی باید نواحی دقیق مثلث دوال را پیاده کند.
  const total = g.CH4 + g.C2H4 + g.C2H2;
  if (!total) return "نامشخص";
  const ch4 = (g.CH4 / total) * 100;
  const c2h4 = (g.C2H4 / total) * 100;
  const c2h2 = (g.C2H2 / total) * 100;

  if (c2h2 > 20 && c2h4 > 20) return "D2";
  if (c2h4 > 50 && c2h2 < 15) return "T3";
  if (c2h4 >= 20 && c2h4 <= 50 && c2h2 < 10) return "T2";
  if (ch4 > 50 && c2h4 < 20) return "T1";
  if (c2h2 > 10 && c2h4 > 40) return "DT";
  return "نیازمند بررسی";
}

function diagnosePOTG(g) {
  const p = calculatePotgPercentages(g);

  // نسخه فعلی: قواعد تقریبی بر اساس غلبه نسبی گازها.
  // نسخه بعدی: جایگزینی با مرزبندی هندسی POTG.
  if (p.C2H2 >= 25 && p.C2H4 >= 20) return "D2";
  if (p.C2H2 >= 20 && p.H2 >= 20) return "D2";
  if (p.C2H4 >= 45 && p.C2H2 < 10) return "T3";
  if (p.C2H4 >= 25 && p.C2H4 < 45 && p.C2H2 < 10) return "T2";
  if (p.CH4 >= 35 && p.C2H4 < 25 && p.C2H2 < 5) return "T1";
  if (p.H2 >= 55 && p.C2H2 < 10) return "PD";
  if (p.C2H4 >= 35 && p.C2H2 >= 10) return "T3+D2";
  return "نیازمند بررسی";
}

function analyzeCelluloseCondition(g, ratios) {
  const coCo2 = ratios.co_co2;
  const co2Co = ratios.co2_co;
  const highCarbonMonoxide = g.CO > 200;
  const hasCelluloseAlert = highCarbonMonoxide && (
    (coCo2 !== null && coCo2 > 0.3) ||
    (coCo2 !== null && coCo2 < 0.1)
  );
  const hasNormalInsulationCondition = co2Co !== null && co2Co > 3 && co2Co < 11;

  if (hasCelluloseAlert) {
    return {
      code: "CELLULOSE_ALERT",
      title: "هشدار تخریب سلولزی",
      description: "الگوی CO و CO2 با تخریب سلولزی، گرمای موضعی ناشی از حرارت روغن یا عیب حرارتی مرتبط با سلولز سازگار است."
    };
  }

  if (hasNormalInsulationCondition) {
    return {
      code: "CELLULOSE_NORMAL",
      title: "شرایط نرمال تجزیه عایقی",
      description: "نسبت CO2/CO در بازه نرمال تجزیه عایقی قرار دارد."
    };
  }

  return {
    code: "CELLULOSE_REVIEW",
    title: "نیازمند بررسی سلولز",
    description: "بر اساس نسبت های CO/CO2 و CO2/CO الگوی قطعی برای وضعیت سلولز به دست نیامد."
  };
}

function voteFinal(methods) {
  const candidates = [methods.IEC, methods.ROGERS, methods.DUVAL, methods.POTG, methods.HEPTAGON]
    .filter(v => v && !["NORMAL", "HCCD", "MCCD", "LCCD", "LCC"].includes(v))
    .filter(v => v && !["نامشخص", "نیازمند بررسی", "زیر آستانه L1"].includes(v));

  const counts = {};
  for (const c of candidates) counts[c] = (counts[c] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];

  if (!top) {
    if (methods.HEPTAGON && ["NORMAL", "HCCD", "MCCD", "LCCD", "LCC"].includes(methods.HEPTAGON)) {
      return { finalDiagnosis: methods.HEPTAGON, confidence: "متوسط" };
    }
    return { finalDiagnosis: "نیازمند بررسی", confidence: "پایین" };
  }
  const confidence = top[1] >= 3 ? "بالا" : top[1] === 2 ? "متوسط" : "پایین";
  return { finalDiagnosis: top[0], confidence };
}

function recommendation(ieee, finalDiagnosis, confidence) {
  if (finalDiagnosis === "NORMAL") return "در این روش الگوی کلی گازها به وضعیت نرمال نزدیک است؛ پایش دوره‌ای ادامه پیدا کند.";
  if (finalDiagnosis === "HCCD") return "نشانه‌های تخریب شدید سلولزی دیده می‌شود؛ عایق کاغذی و منبع گرمایش موضعی فوری بررسی شود.";
  if (finalDiagnosis === "MCCD") return "الگوی تخریب سلولزی با شدت متوسط دیده می‌شود؛ نمونه‌گیری مجدد و بررسی وضعیت عایق توصیه می‌شود.";
  if (finalDiagnosis === "LCCD" || finalDiagnosis === "LCC") return "نشانه‌های خفیف‌تری از تخریب سلولزی دیده می‌شود؛ روند CO و CO2 با سوابق تجهیز مقایسه شود.";
  if (ieee === "Level 4") return "خطر بالا: بررسی فوری، نمونه‌گیری مجدد و تصمیم بهره‌برداری توسط کارشناس.";
  if (ieee === "Level 3") return "نیازمند بازرسی دقیق‌تر و پایش روند رشد گازها.";
  if (confidence === "پایین") return "نتیجه قطعی نیست؛ سوابق تجهیز و نمونه‌گیری مجدد بررسی شود.";
  return "پایش دوره‌ای و ثبت روند تغییرات پیشنهاد می‌شود.";
}

function analyzeDGA(gases) {
  const g = {
    H2: Number(gases.H2 || 0),
    CH4: Number(gases.CH4 || 0),
    C2H2: Number(gases.C2H2 || 0),
    C2H4: Number(gases.C2H4 || 0),
    C2H6: Number(gases.C2H6 || 0),
    CO: Number(gases.CO || 0),
    CO2: Number(gases.CO2 || 0)
  };

  const ieeeData = diagnoseIEEE(g);
  const ratios = calculateRatios(g);
  const potgPercentages = calculatePotgPercentages(g);
  const heptagon = diagnoseHeptagon(g);
  const l1Eligibility = evaluateL1Eligibility(g);
  const gatedMethodResult = l1Eligibility.isEligible ? null : "زیر آستانه L1";

  const methods = {
    IEEE: ieeeData.result,
    IEC: gatedMethodResult || diagnoseIEC(g),
    ROGERS: gatedMethodResult || diagnoseRogers(g),
    DORENBERG: diagnoseDoernenberg(g),
    DUVAL: diagnoseDuvalApprox(g),
    POTG: gatedMethodResult || diagnosePOTG(g),
    HEPTAGON: heptagon.result
  };

  const final = voteFinal(methods);
  const cellulose = analyzeCelluloseCondition(g, ratios);

  return {
    input: g,
    tdcg: ieeeData.tdcg,
    ratios,
    potgPercentages,
    heptagonPercentages: heptagon.percentages,
    heptagonDistance: heptagon.distance,
    heptagonSource: heptagon.source,
    l1Eligibility,
    methods,
    cellulose,
    ...final,
    recommendation: recommendation(methods.IEEE, final.finalDiagnosis, final.confidence)
  };
}
