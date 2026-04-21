import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not set on the server" },
      { status: 500 },
    );
  }

  const input = parsed.data;
  const systemPrompt = buildPreliminarySystem();
  const userMessage = formatPreliminaryPrompt(input);

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { maxOutputTokens: 1024 },
        });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
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
