/**
 * 八字計算測試腳本。
 *
 * 用法：
 *   npm run test:bazi
 *
 * 用已知樣本驗證計算結果正確性。
 */

import {
  calculateBazi,
  monthBranchToSeasonCardId,
  type BaziInput,
} from "../src/lib/bazi";

interface TestCase {
  label: string;
  input: BaziInput;
  expected: {
    dayMaster: string;
    monthCommand: string;
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
  };
}

// 已知樣本 —— 使用 lunar-javascript 的權威輸出交叉驗證。
// 若未來更換底層計算庫，可用這組值確認兼容性。
const CASES: TestCase[] = [
  {
    label: "1990-05-15 14:30 (午時、典型案例)",
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 30 },
    expected: {
      dayMaster: "庚",
      monthCommand: "巳",
      yearPillar: "庚午",
      monthPillar: "辛巳",
      dayPillar: "庚辰",
      hourPillar: "癸未",
    },
  },
  {
    label: "2000-01-01 00:00 (子時、跨年邊界)",
    input: { year: 2000, month: 1, day: 1, hour: 0, minute: 0 },
    expected: {
      dayMaster: "戊",
      monthCommand: "子",
      yearPillar: "己卯",
      monthPillar: "丙子",
      dayPillar: "戊午",
      hourPillar: "壬子",
    },
  },
  {
    label: "1985-08-08 08:00 (立秋後、月令切換)",
    input: { year: 1985, month: 8, day: 8, hour: 8, minute: 0 },
    expected: {
      dayMaster: "己",
      monthCommand: "申",
      yearPillar: "乙丑",
      monthPillar: "甲申",
      dayPillar: "己卯",
      hourPillar: "戊辰",
    },
  },
  {
    label: "1990-02-04 12:00 (立春前後、年柱邊界)",
    input: { year: 1990, month: 2, day: 4, hour: 12, minute: 0 },
    expected: {
      dayMaster: "庚",
      monthCommand: "寅",
      yearPillar: "庚午",
      monthPillar: "戊寅",
      dayPillar: "庚子",
      hourPillar: "壬午",
    },
  },
];

let pass = 0;
let fail = 0;

console.log("\n🔮 八字計算測試\n" + "─".repeat(60));

for (const tc of CASES) {
  console.log(`\n▸ ${tc.label}`);
  const bazi = calculateBazi(tc.input);

  const checks: [string, string, string][] = [
    ["日主", bazi.dayMaster, tc.expected.dayMaster],
    ["月令", bazi.monthCommand, tc.expected.monthCommand],
    ["年柱", bazi.year.pillar, tc.expected.yearPillar],
    ["月柱", bazi.month.pillar, tc.expected.monthPillar],
    ["日柱", bazi.day.pillar, tc.expected.dayPillar],
    ["時柱", bazi.hour.pillar, tc.expected.hourPillar],
  ];

  for (const [name, actual, expected] of checks) {
    const ok = actual === expected;
    if (ok) pass++;
    else fail++;
    const mark = ok ? "✓" : "✗";
    console.log(`   ${mark} ${name}: ${actual}${ok ? "" : ` (預期 ${expected})`}`);
  }

  console.log(
    `   五行分佈：${Object.entries(bazi.elementCount)
      .map(([k, v]) => `${k}=${v}`)
      .join(" ")}`,
  );
  console.log(`   最強：${bazi.dominantElement}，缺：${bazi.missingElements.join(",") || "無"}`);
  console.log(
    `   十神（天干）：年=${bazi.tenGodsStem.year}、月=${bazi.tenGodsStem.month}、時=${bazi.tenGodsStem.hour}`,
  );
  console.log(
    `   對應季節卡：${monthBranchToSeasonCardId(bazi.monthCommand)}`,
  );
}

console.log("\n" + "─".repeat(60));
console.log(`結果：${pass} 通過，${fail} 失敗`);
console.log("");

process.exit(fail > 0 ? 1 : 0);
