import elementsData from "@/data/five-elements.json";

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
export type Gender = "male" | "female";

export interface ElementInfo {
  key: ElementKey;
  zh: string;
  color: { bg: string; main: string };
  nature: string;
  keyword: string;
  stems: string[];
  branches: string[];
}

export const ELEMENTS = elementsData.elements as Record<ElementKey, ElementInfo>;
export const STEM_TO_ELEMENT = elementsData.stemToElement as Record<string, ElementKey>;
export const BRANCH_TO_ELEMENT = elementsData.branchToElement as Record<string, ElementKey>;
export const GENERATE = elementsData.generate as Record<ElementKey, ElementKey>;
export const OVERCOME = elementsData.overcome as Record<ElementKey, ElementKey>;

/**
 * 取得天干所屬五行。
 */
export function stemToElement(stem: string): ElementKey | undefined {
  return STEM_TO_ELEMENT[stem];
}

/**
 * 取得地支所屬五行（地支主氣）。
 */
export function branchToElement(branch: string): ElementKey | undefined {
  return BRANCH_TO_ELEMENT[branch];
}

/**
 * 判定兩個五行的關係：
 *  - same：同類
 *  - generate-out：我生對方（洩）
 *  - generate-in：對方生我（扶）
 *  - overcome-out：我剋對方
 *  - overcome-in：對方剋我
 */
export type ElementRelation =
  | "same"
  | "generate-out"
  | "generate-in"
  | "overcome-out"
  | "overcome-in";

export function relationBetween(a: ElementKey, b: ElementKey): ElementRelation {
  if (a === b) return "same";
  if (GENERATE[a] === b) return "generate-out";
  if (GENERATE[b] === a) return "generate-in";
  if (OVERCOME[a] === b) return "overcome-out";
  if (OVERCOME[b] === a) return "overcome-in";
  throw new Error(`Unreachable relation: ${a} vs ${b}`);
}

/**
 * 把 2–12 人的人數對應到要用幾張生剋互動卡。
 */
export function interactionCardCount(players: number): number {
  if (players <= 5) return 1;
  if (players <= 8) return 2;
  return 3;
}
