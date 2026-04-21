import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateBazi } from "@/lib/bazi";
import { streamReport } from "@/lib/ai-report";
import type { ElementKey } from "@/lib/elements";

const GameAnswerSchema = z.object({
  category: z.string(),
  question: z.string(),
  choice: z.string().optional(),
  element: z.enum(["wood", "fire", "earth", "metal", "water"]).optional(),
  text: z.string().optional(),
});

const ReportRequestSchema = z.object({
  name: z.string().min(1).max(50),
  gender: z.enum(["male", "female"]),
  email: z.string().email(),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional(),
  gameElement: z
    .enum(["wood", "fire", "earth", "metal", "water"])
    .nullable()
    .optional(),
  tier: z.enum(["free", "full"]).default("free"),
  gameAnswers: z.array(GameAnswerSchema).optional(),
  tenGodDrawn: z
    .object({ name: z.string(), role: z.string() })
    .nullable()
    .optional(),
  tenGodReaction: z.string().optional(),
});

/**
 * POST /api/report
 *
 * 計算八字 → 呼叫 Gemini API 生成報告，以串流回傳純文字。
 *
 * TODO：付費版本（tier=full）需要先走金流驗證，目前開放純 dev 測試。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = ReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set on the server" },
      { status: 500 },
    );
  }

  const input = parsed.data;

  let bazi;
  try {
    bazi = calculateBazi({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "八字計算失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 串流 text/plain 回前端。
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = streamReport({
          name: input.name,
          gender: input.gender,
          bazi,
          gameElement: (input.gameElement ?? null) as ElementKey | null,
          tier: input.tier,
          gameAnswers: input.gameAnswers,
          tenGodDrawn: input.tenGodDrawn ?? undefined,
          tenGodReaction: input.tenGodReaction,
        });
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "報告生成失敗";
        controller.enqueue(encoder.encode(`\n\n[錯誤：${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
