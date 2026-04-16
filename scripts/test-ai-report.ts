/**
 * AI 命盤報告測試腳本。
 *
 * 用法：
 *   ANTHROPIC_API_KEY=sk-ant-... npm run test:ai-report
 *   # 指定層級
 *   TIER=full npm run test:ai-report
 *   # 儲存輸出到檔案
 *   SAVE=1 npm run test:ai-report
 *
 * 行為：
 *   - 對幾組測試八字分別生成報告
 *   - 串流印出到終端機
 *   - 觀察 token 使用量 & prompt cache 命中狀況
 */

import { calculateBazi } from "../src/lib/bazi";
import { streamReport, generateReport } from "../src/lib/ai-report";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("請設定 ANTHROPIC_API_KEY 環境變數後再跑本測試。");
  process.exit(1);
}

const tier = (process.env.TIER as "free" | "full") || "free";
const save = process.env.SAVE === "1";

interface Sample {
  name: string;
  gender: "male" | "female";
  year: number;
  month: number;
  day: number;
  hour: number;
  gameElement?: "wood" | "fire" | "earth" | "metal" | "water" | null;
}

const SAMPLES: Sample[] = [
  {
    name: "阿明",
    gender: "male",
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    gameElement: "wood",
  },
  {
    name: "小美",
    gender: "female",
    year: 1988,
    month: 11,
    day: 23,
    hour: 8,
    gameElement: "fire",
  },
  {
    name: "子勳",
    gender: "male",
    year: 1995,
    month: 3,
    day: 7,
    hour: 19,
    gameElement: null, // 沒玩過遊戲，跳過直覺 vs 命盤對比
  },
];

const OUTPUT_DIR = join(process.cwd(), "scripts", "output");
if (save && !existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`\n🌙 AI 命盤報告測試（tier=${tier}）\n${"─".repeat(60)}`);

for (const [i, sample] of SAMPLES.entries()) {
  console.log(
    `\n▸ 樣本 ${i + 1}：${sample.name}（${sample.gender === "male" ? "男" : "女"}） ${sample.year}/${sample.month}/${sample.day} ${sample.hour}:00`,
  );

  const bazi = calculateBazi({
    year: sample.year,
    month: sample.month,
    day: sample.day,
    hour: sample.hour,
  });

  console.log(
    `   日主=${bazi.dayMaster}（${bazi.dayElement}）｜月令=${bazi.monthCommand}（${bazi.monthElement}）｜遊戲抽到=${sample.gameElement ?? "—"}`,
  );
  console.log(`   四柱：${bazi.year.pillar} ${bazi.month.pillar} ${bazi.day.pillar} ${bazi.hour.pillar}`);
  console.log(`   ────  報告  ────`);

  // 第一輪：純串流，看效果
  let fullText = "";
  const startTs = Date.now();
  for await (const chunk of streamReport({
    name: sample.name,
    gender: sample.gender,
    bazi,
    gameElement: sample.gameElement ?? null,
    tier,
  })) {
    process.stdout.write(chunk);
    fullText += chunk;
  }
  const elapsed = Date.now() - startTs;
  console.log(`\n   ────  / 報告（${elapsed}ms）────`);

  if (save) {
    const filename = `report-${tier}-${i + 1}-${sample.name}.md`;
    writeFileSync(join(OUTPUT_DIR, filename), fullText, "utf-8");
    console.log(`   已存檔：scripts/output/${filename}`);
  }
}

// 第二輪：跑一次 non-streaming 看 usage 統計（含 cache hit）
console.log(`\n${"─".repeat(60)}\n📊 Token 使用統計（非串流，觀察 prompt cache）`);
for (let i = 0; i < 2; i++) {
  const sample = SAMPLES[0];
  const bazi = calculateBazi({
    year: sample.year,
    month: sample.month,
    day: sample.day,
    hour: sample.hour,
  });
  const result = await generateReport({
    name: sample.name,
    gender: sample.gender,
    bazi,
    gameElement: sample.gameElement ?? null,
    tier,
  });
  console.log(
    `   第${i + 1}次：input=${result.usage.inputTokens}、output=${result.usage.outputTokens}、cache_write=${result.usage.cacheCreationInputTokens}、cache_read=${result.usage.cacheReadInputTokens}`,
  );
}

console.log("");
