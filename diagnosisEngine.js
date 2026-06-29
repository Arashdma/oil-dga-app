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
    r4_C2H6_C2H2: round(safeDivide(g.C2H6, g.C2H2), 4)
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

function voteFinal(methods) {
  const candidates = [methods.IEC, methods.ROGERS, methods.DUVAL, methods.POTG]
    .filter(v => v && !["نامشخص", "نیازمند بررسی"].includes(v));

  const counts = {};
  for (const c of candidates) counts[c] = (counts[c] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];

  if (!top) return { finalDiagnosis: "نیازمند بررسی", confidence: "پایین" };
  const confidence = top[1] >= 3 ? "بالا" : top[1] === 2 ? "متوسط" : "پایین";
  return { finalDiagnosis: top[0], confidence };
}

function recommendation(ieee, finalDiagnosis, confidence) {
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

  const methods = {
    IEEE: ieeeData.result,
    IEC: diagnoseIEC(g),
    ROGERS: diagnoseRogers(g),
    DORENBERG: diagnoseDoernenberg(g),
    DUVAL: diagnoseDuvalApprox(g),
    POTG: diagnosePOTG(g)
  };

  const final = voteFinal(methods);

  return {
    input: g,
    tdcg: ieeeData.tdcg,
    ratios,
    potgPercentages,
    methods,
    ...final,
    recommendation: recommendation(methods.IEEE, final.finalDiagnosis, final.confidence)
  };
}
