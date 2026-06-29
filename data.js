// این فایل دیتاست مرجع پایان‌نامه را نگه می‌دارد.
// ترتیب ستون‌ها: H2, CH4, C2H2, C2H4, C2H6, CO, CO2, TDCG
const thesisSamples = [
  { id: 1, name: "فارابی 2T", gases: { H2: 307, CH4: 653, C2H2: 8, C2H4: 1065, C2H6: 180, CO: 1557, CO2: 10723, TDCG: 3770 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 2, name: "۲۲ بهمن 2T", gases: { H2: 88, CH4: 41, C2H2: 150, C2H4: 155, C2H6: 27, CO: 1755, CO2: 7264, TDCG: 2216 }, ref: { IEEE: "Level 3", DORENBERG: "D1", IEC: "D2", ROGERS: "D2", DUVAL: "D2", POTG: "D2" } },
  { id: 3, name: "شهریار 2T", gases: { H2: 154, CH4: 300, C2H2: 17, C2H4: 404, C2H6: 411, CO: 916, CO2: 1960, TDCG: 2202 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T1", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 4, name: "قیطریه 2T", gases: { H2: 322, CH4: 381, C2H2: 165, C2H4: 275, C2H6: 614, CO: 875, CO2: 2101, TDCG: 2632 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T1", ROGERS: "D2", DUVAL: "D2", POTG: "D2" } },
  { id: 5, name: "کهریزک 2T", gases: { H2: 150, CH4: 804, C2H2: 33, C2H4: 1469, C2H6: 115, CO: 1068, CO2: 2248, TDCG: 3639 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 6, name: "اتحاد 2T", gases: { H2: 109, CH4: 352, C2H2: 89, C2H4: 678, C2H6: 103, CO: 2406, CO2: 4373, TDCG: 3737 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 7, name: "باطری سازی 3T", gases: { H2: 156, CH4: 666, C2H2: 56, C2H4: 1350, C2H6: 191, CO: 833, CO2: 2678, TDCG: 3252 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 8, name: "استقلال 4T", gases: { H2: 152, CH4: 238, C2H2: 6, C2H4: 63, C2H6: 153, CO: 2008, CO2: 7048, TDCG: 2720 }, ref: { IEEE: "Level 2", DORENBERG: "Thermal-PD", IEC: "T1", ROGERS: "T2", DUVAL: "T2", POTG: "T2" } },
  { id: 9, name: "استقلال 1T", gases: { H2: 135, CH4: 302, C2H2: 3, C2H4: 85, C2H6: 440, CO: 856, CO2: 3372, TDCG: 1821 }, ref: { IEEE: "Level 2", DORENBERG: "Thermal-PD", IEC: "T1-PD", ROGERS: "T2", DUVAL: "T2", POTG: "T2" } },
  { id: 10, name: "ری گازی 4T", gases: { H2: 114, CH4: 442, C2H2: 1, C2H4: 762, C2H6: 156, CO: 772, CO2: 2878, TDCG: 2447 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 11, name: "شهریار 3T", gases: { H2: 95, CH4: 420, C2H2: 0, C2H4: 30, C2H6: 350, CO: 1959, CO2: 3810, TDCG: 2890 }, ref: { IEEE: "Level 3", DORENBERG: "Thermal", IEC: "T1", ROGERS: "T2", DUVAL: "T1", POTG: "T1" } },
  { id: 12, name: "گلاب عینی 2T", gases: { H2: 220, CH4: 483, C2H2: 81, C2H4: 479, C2H6: 252, CO: 1224, CO2: 2893, TDCG: 2739 }, ref: { IEEE: "Level 3", DORENBERG: "Thermal", IEC: "T2", ROGERS: "T2", DUVAL: "T2", POTG: "T2" } },
  { id: 13, name: "راکتور زیاران 7R", gases: { H2: 124, CH4: 175, C2H2: 37, C2H4: 231, C2H6: 356, CO: 149, CO2: 1651, TDCG: 1072 }, ref: { IEEE: "Level 3", DORENBERG: "Thermal", IEC: "T2-D2", ROGERS: "T2-D2", DUVAL: "T3", POTG: "T3" } },
  { id: 14, name: "ازگل 4T", gases: { H2: 80, CH4: 30, C2H2: 39, C2H4: 31, C2H6: 10, CO: 536, CO2: 2824, TDCG: 726 }, ref: { IEEE: "Level 4", DORENBERG: "Unknown", IEC: "D2", ROGERS: "D2", DUVAL: "D2", POTG: "D2" } },
  { id: 15, name: "تربیت معلم 2T", gases: { H2: 88, CH4: 128, C2H2: 9, C2H4: 336, C2H6: 76, CO: 1375, CO2: 3756, TDCG: 2022 }, ref: { IEEE: "Level 3", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 16, name: "نیروگاه بعثت 8T", gases: { H2: 61, CH4: 165, C2H2: 190, C2H4: 384, C2H6: 59, CO: 1410, CO2: 5644, TDCG: 2269 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "D1", ROGERS: "T3+D2", DUVAL: "T3+D2", POTG: "T3+D2" } },
  { id: 17, name: "خراسان 1T", gases: { H2: 186, CH4: 598, C2H2: 228, C2H4: 1374, C2H6: 120, CO: 2721, CO2: 7185, TDCG: 5227 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "D1", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 18, name: "باطری سازی 1T", gases: { H2: 238, CH4: 1378, C2H2: 41, C2H4: 1868, C2H6: 393, CO: 1199, CO2: 4506, TDCG: 5117 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } },
  { id: 19, name: "شریف آباد 2T", gases: { H2: 231, CH4: 173, C2H2: 249, C2H4: 432, C2H6: 57, CO: 1805, CO2: 7244, TDCG: 2947 }, ref: { IEEE: "Level 4", DORENBERG: "Arc", IEC: "T3+D2", ROGERS: "D2", DUVAL: "T3+D2", POTG: "T3+D2" } },
  { id: 20, name: "سیار رباط کریم", gases: { H2: 437, CH4: 1473, C2H2: 280, C2H4: 2693, C2H6: 366, CO: 1181, CO2: 6674, TDCG: 6430 }, ref: { IEEE: "Level 4", DORENBERG: "Thermal", IEC: "T3", ROGERS: "T3", DUVAL: "T3", POTG: "T3" } }
];
