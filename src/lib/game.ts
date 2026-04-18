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
 * 抽 3 張情境卡：暖場（關係）→ 深入（自我）→ 點火（挑戰）
 */
export function drawSituationCards(): SituationCard[] {
  const all = situationCards as SituationCard[];
  const relationship = all.filter((c) => c.category === "relationship");
  const self = all.filter((c) => c.category === "self");
  const challenge = all.filter((c) => c.category === "challenge");
  return [
    shuffleAndPick(relationship, 1)[0],
    shuffleAndPick(self, 1)[0],
    shuffleAndPick(challenge, 1)[0],
  ];
}

export function drawTenGodCard(): TenGodCard {
  return shuffleAndPick(tenGods as TenGodCard[], 1)[0];
}

export const STEP_LABELS = [
  "抽季節卡",
  "情境問題",
  "十神角色",
  "生辰八字",
  "命盤報告",
] as const;
