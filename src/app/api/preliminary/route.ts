import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { buildPreliminarySystem, formatPreliminaryPrompt } from "@/lib/prompts";

const PreliminaryRequestSchema = z.object({
  name: z.string().min(1).max(50),
  seasonCard: z.object({
    name: z.string(),
    elementZh: z.string(),
    energy: z.string(),
  }),
  tenGodCard: z.object({
    name: z.string(),
    role: z.string(),
  }),
  tenGodReaction: z.string().optional(),
  gameAnswers: z.array(
    z.object({
      category: z.string(),
      question: z.string(),
      choice: z.string().optional(),
      element: z.enum(["wood", "fire", "earth", "metal", "water"]).optional(),
      text: z.string().optional(),
    }),
  ),
});

/**
 * POST /api/preliminary
 *
 * 初步讀出：根據玩家抽的牌 + 回答，產出 ~150 字的反映。
 * 不含八字命盤。用來鉤住玩家繼續看完整報告。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = PreliminaryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set on the server" },
      { status: 500 },
    );
  }

  const input = parsed.data;
  const systemPrompt = buildPreliminarySystem();
  const userMessage = formatPreliminaryPrompt(input);

  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-6";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = client.messages.stream({
          model,
          max_tokens: 512,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of apiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "初步讀出失敗";
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
