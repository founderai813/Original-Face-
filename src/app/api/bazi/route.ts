import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateBazi, type BaziInput } from "@/lib/bazi";

const BaziRequestSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional(),
});

/**
 * POST /api/bazi
 * 純八字計算（不生成 AI 報告）。回傳命盤 JSON。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = BaziRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const input: BaziInput = parsed.data;
    const bazi = calculateBazi(input);
    return NextResponse.json({ bazi });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
