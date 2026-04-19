import seasonCards from "@/data/season-cards.json";
import situationCards from "@/data/situation-cards.json";
import tenGods from "@/data/ten-gods.json";

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

export interface SituationCard {
  id: number;
  category: "relationship" | "self" | "challenge";
  categoryZh: string;
  question: string;
  entry: string;
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

export interface PlayerAnswer {
  card: SituationCard;
  answer: string;
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
 * 抽 20 張情境卡，分三個階段：
 * - 暖場（關係）7 張
 * - 深入（自我）7 張
 * - 點火（挑戰）6 張
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
      cards: shuffleAndPick(relationship, 7),
    },
    {
      label: "深入",
      color: "text-[#90c8f0]",
      intro: "好，暖場結束。你已經開始對自己說實話了。接下來我們去更深的地方。",
      cards: shuffleAndPick(self, 7),
    },
    {
      label: "點火",
      color: "text-[#e8c060]",
      intro: "最後幾題。這些問題會有點燙，但你可以的。",
      cards: shuffleAndPick(challenge, 6),
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
