import { Solar } from "lunar-javascript";
import {
  BRANCH_TO_ELEMENT,
  ELEMENTS,
  STEM_TO_ELEMENT,
  type ElementKey,
} from "./elements";

export interface BaziInput {
  /** 西元年（例：1990） */
  year: number;
  /** 月（1–12） */
  month: number;
  /** 日（1–31） */
  day: number;
  /** 小時（0–23，24小時制） */
  hour: number;
  /** 分（0–59），預設 0 */
  minute?: number;
}

export interface Pillar {
  /** 完整柱（例："庚午"） */
  pillar: string;
  /** 天干 */
  stem: string;
  /** 地支 */
  branch: string;
  /** 天干五行 */
  stemElement: ElementKey;
  /** 地支主氣五行 */
  branchElement: ElementKey;
  /** 地支藏干 */
  hideStems: string[];
}

export interface Bazi {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  /** 日主（日干） */
  dayMaster: string;
  /** 日主五行 */
  dayElement: ElementKey;
  /** 月令（月支） */
  monthCommand: string;
  /** 月令五行（季節能量） */
  monthElement: ElementKey;
  /** 十神（天干對日主） */
  tenGodsStem: {
    year: string;
    month: string;
    hour: string;
  };
  /** 十神（地支藏干對日主） */
  tenGodsBranch: {
    year: string[];
    month: string[];
    day: string[];
    hour: string[];
  };
  /** 五行比例（粗估：8 個字的數量） */
  elementCount: Record<ElementKey, number>;
  /** 五行比例（百分比 0-100） */
  elementPercent: Record<ElementKey, number>;
  /** 主導的五行（比例最高者） */
  dominantElement: ElementKey;
  /** 缺失的五行（為 0） */
  missingElements: ElementKey[];
  /** 原始 lunar-javascript 輸出，方便除錯 */
  raw: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
    solarString: string;
  };
}

/**
 * 十神簡→繁的對照，lunar-javascript 輸出簡體。
 */
const TEN_GOD_SIMP_TO_TRAD: Record<string, string> = {
  比肩: "比肩",
  劫财: "劫財",
  食神: "食神",
  伤官: "傷官",
  偏财: "偏財",
  正财: "正財",
  七杀: "七殺",
  正官: "正官",
  偏印: "偏印",
  正印: "正印",
};

function normalizeTenGod(s: string): string {
  return TEN_GOD_SIMP_TO_TRAD[s] ?? s;
}

function normalizeTenGodList(list: string[]): string[] {
  return list.map(normalizeTenGod);
}

/**
 * 驗證八字輸入值。回傳標準化的輸入或 null（輸入無效）。
 */
export function validateBaziInput(input: Partial<BaziInput>): BaziInput | null {
  if (!input) return null;
  const { year, month, day, hour } = input;
  if (
    typeof year !== "number" ||
    typeof month !== "number" ||
    typeof day !== "number" ||
    typeof hour !== "number"
  ) {
    return null;
  }
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  const minute = input.minute ?? 0;
  if (minute < 0 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

/**
 * 計算八字命盤。
 *
 * 輸入以國曆（陽曆）為準，底層用 lunar-javascript 進行節氣、干支推算。
 */
export function calculateBazi(input: BaziInput): Bazi {
  const { year, month, day, hour, minute = 0 } = input;

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const yearStem = ec.getYearGan();
  const yearBranch = ec.getYearZhi();
  const monthStem = ec.getMonthGan();
  const monthBranch = ec.getMonthZhi();
  const dayStem = ec.getDayGan();
  const dayBranch = ec.getDayZhi();
  const hourStem = ec.getTimeGan();
  const hourBranch = ec.getTimeZhi();

  const pillar = (stem: string, branch: string, hideStems: string[]): Pillar => ({
    pillar: stem + branch,
    stem,
    branch,
    stemElement: STEM_TO_ELEMENT[stem],
    branchElement: BRANCH_TO_ELEMENT[branch],
    hideStems,
  });

  const yearPillar = pillar(yearStem, yearBranch, ec.getYearHideGan());
  const monthPillar = pillar(monthStem, monthBranch, ec.getMonthHideGan());
  const dayPillar = pillar(dayStem, dayBranch, ec.getDayHideGan());
  const hourPillar = pillar(hourStem, hourBranch, ec.getTimeHideGan());

  // 統計五行（年月日時 4 天干 + 4 地支主氣 = 8 字）
  const elementCount: Record<ElementKey, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  for (const p of [yearPillar, monthPillar, dayPillar, hourPillar]) {
    elementCount[p.stemElement] += 1;
    elementCount[p.branchElement] += 1;
  }

  const total = 8;
  const elementPercent = Object.fromEntries(
    Object.entries(elementCount).map(([k, v]) => [k, Math.round((v / total) * 100)]),
  ) as Record<ElementKey, number>;

  const entries = Object.entries(elementCount) as [ElementKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominantElement = entries[0][0];
  const missingElements = entries.filter(([, v]) => v === 0).map(([k]) => k);

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayMaster: dayStem,
    dayElement: STEM_TO_ELEMENT[dayStem],
    monthCommand: monthBranch,
    monthElement: BRANCH_TO_ELEMENT[monthBranch],
    tenGodsStem: {
      year: normalizeTenGod(ec.getYearShiShenGan()),
      month: normalizeTenGod(ec.getMonthShiShenGan()),
      hour: normalizeTenGod(ec.getTimeShiShenGan()),
    },
    tenGodsBranch: {
      year: normalizeTenGodList(ec.getYearShiShenZhi()),
      month: normalizeTenGodList(ec.getMonthShiShenZhi()),
      day: normalizeTenGodList(ec.getDayShiShenZhi()),
      hour: normalizeTenGodList(ec.getTimeShiShenZhi()),
    },
    elementCount,
    elementPercent,
    dominantElement,
    missingElements,
    raw: {
      yearPillar: ec.getYear(),
      monthPillar: ec.getMonth(),
      dayPillar: ec.getDay(),
      hourPillar: ec.getTime(),
      solarString: solar.toYmd(),
    },
  };
}

/**
 * 八字 → 季節卡 ID 映射。可用於在遊戲中對照「直覺抽到的季節」和「真實月令的季節」。
 */
export function monthBranchToSeasonCardId(branch: string): string | null {
  const map: Record<string, string> = {
    寅: "spring-early",
    卯: "spring-mid",
    辰: "spring-late",
    巳: "summer-early",
    午: "summer-mid",
    未: "summer-late",
    申: "autumn-early",
    酉: "autumn-mid",
    戌: "autumn-late",
    亥: "winter-early",
    子: "winter-mid",
    丑: "winter-late",
  };
  return map[branch] ?? null;
}

/**
 * 取得五行的中文名。
 */
export function elementZh(e: ElementKey): string {
  return ELEMENTS[e].zh;
}
