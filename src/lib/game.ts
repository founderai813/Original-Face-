import seasonCards from "@/data/season-cards.json";
import situationCards from "@/data/situation-cards.json";
import tenGods from "@/data/ten-gods.json";
import type { ElementKey } from "./elements";

export interface SeasonCard {
  id: string;
  name: string;
  branch: string;
  month: string;
  element: string;
  elementZh: string;
  imagery: string;
  energy: string;
  description: string;
  prompt: string;
  affirmation: string;
}

export interface ChoiceOption {
  label: string;
  element: ElementKey;
}

export interface SituationCard {
  id: number;
  category: "relationship" | "self" | "challenge";
  categoryZh: string;
  question: string;
  entry: string;
  /** 若有選項表示為選擇題，沒有則是純填充題 */
  options?: ChoiceOption[];
  /** 強制純填充題（即使有 options 也忽略） */
  textOnly?: boolean;
}

export interface TenGodCard {
  id: string;
  name: string;
  role: string;
  strengths: string;
  challenges: string;
  type: string;
  polarity: string;
}

/**
 * 玩家對單張情境卡的回答。
 * - 選擇題：會有 choice（選項文字）和 element（該選項對應的五行）
 * - 填充題：只有 text
 */
export interface PlayerAnswer {
  card: SituationCard;
  choice?: string;
  element?: ElementKey;
  text?: string;
}

export interface GamePhase {
  label: string;
  color: string;
  intro: string;
  cards: SituationCard[];
}

function shuffleAndPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function drawSeasonCard(): SeasonCard {
  return shuffleAndPick(seasonCards as SeasonCard[], 1)[0];
}

/**
 * 從該類別抽 N 張卡，其中 textCount 張是填充題（無選項或 textOnly）、
 * 其餘是選擇題（有 options）。
 *
 * 若該類別的填充題不夠，會從選擇題補。
 */
function drawMixedCards(
  pool: SituationCard[],
  total: number,
  textCount: number,
): SituationCard[] {
  const textCards = pool.filter((c) => c.textOnly || !c.options);
  const choiceCards = pool.filter((c) => !c.textOnly && c.options);

  const pickedText = shuffleAndPick(textCards, Math.min(textCount, textCards.length));
  const needChoice = total - pickedText.length;
  const pickedChoice = shuffleAndPick(choiceCards, needChoice);

  // 選擇題放前面，填充題放最後（讓每階段最後 1-2 題是深入的填空）
  return [...pickedChoice, ...pickedText];
}

/**
 * 抽 20 張情境卡，分三個階段：
 * - 暖場（關係）7 張，全選擇題
 * - 深入（自我）7 張，6 選擇 + 1 填充
 * - 點火（挑戰）6 張，4 選擇 + 2 填充
 */
export function drawGamePhases(): GamePhase[] {
  const all = situationCards as SituationCard[];
  const relationship = all.filter((c) => c.category === "relationship");
  const self = all.filter((c) => c.category === "self");
  const challenge = all.filter((c) => c.category === "challenge");

  return [
    {
      label: "暖場",
      color: "text-[#f0a0a0]",
      intro: "先從簡單的開始。不用想太多，你第一個念頭是什麼就說什麼。",
      cards: drawMixedCards(relationship, 7, 0),
    },
    {
      label: "深入",
      color: "text-[#90c8f0]",
      intro: "好，暖場結束。你已經開始對自己說實話了。接下來我們去更深的地方。",
      cards: drawMixedCards(self, 7, 1),
    },
    {
      label: "點火",
      color: "text-[#e8c060]",
      intro: "最後幾題。這些問題會有點燙，但你可以的。",
      cards: drawMixedCards(challenge, 6, 2),
    },
  ];
}

export function drawTenGodCard(): TenGodCard {
  return shuffleAndPick(tenGods as TenGodCard[], 1)[0];
}

export const STEP_LABELS = [
  "季節卡",
  "情境問題",
  "十神",
  "初步讀出",
  "命盤報告",
] as const;

export function totalQuestionCount(phases: GamePhase[]): number {
  return phases.reduce((sum, p) => sum + p.cards.length, 0);
}
