import Anthropic from "@anthropic-ai/sdk";
import {
  buildFreeReportSystem,
  buildFullReportSystem,
  formatBaziForPrompt,
  type ReportContext,
} from "./prompts";

export type ReportTier = "free" | "full";

export interface GenerateReportOptions extends ReportContext {
  tier: ReportTier;
  /** Model override，預設使用 ANTHROPIC_MODEL env var 或 claude-opus-4-6 */
  model?: string;
  /** Max output tokens，預設 free=1024、full=4096 */
  maxTokens?: number;
}

export interface ReportResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  model: string;
  stopReason: string | null;
}

/**
 * 取得 Anthropic client。使用預設 ANTHROPIC_API_KEY env var。
 */
function getClient(): Anthropic {
  return new Anthropic();
}

/**
 * 解析 response.content 取出純文字。
 */
function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * 生成 AI 命盤報告。
 *
 * 使用 prompt caching：風格指南 + 輸出格式放在 system prompt（穩定，可快取）；
 * 使用者專屬八字資料放在 user message。
 */
export async function generateReport(
  options: GenerateReportOptions,
): Promise<ReportResult> {
  const { tier, model: modelOverride, maxTokens } = options;

  const client = getClient();
  const model =
    modelOverride ?? process.env.ANTHROPIC_MODEL ?? "claude-opus-4-6";

  const systemPrompt =
    tier === "free" ? buildFreeReportSystem() : buildFullReportSystem();

  const userMessage = formatBaziForPrompt(options);

  const resolvedMaxTokens = maxTokens ?? (tier === "free" ? 1024 : 4096);

  // 串流 + finalMessage，避免大型回應超時。
  // 穩定的 system prompt 加 cache_control，後續請求可重用。
  const stream = client.messages.stream({
    model,
    max_tokens: resolvedMaxTokens,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const finalMessage = await stream.finalMessage();

  const text = extractText(finalMessage.content);

  return {
    content: text,
    usage: {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      cacheCreationInputTokens: finalMessage.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: finalMessage.usage.cache_read_input_tokens ?? 0,
    },
    model: finalMessage.model,
    stopReason: finalMessage.stop_reason,
  };
}

/**
 * 逐字串流版本 —— 用於 Next.js 的 Server-Sent Events / streaming response。
 * 回傳的是 AsyncIterable<string>，每次 yield 一個 text delta。
 */
export async function* streamReport(
  options: GenerateReportOptions,
): AsyncGenerator<string, void, unknown> {
  const { tier, model: modelOverride, maxTokens } = options;

  const client = getClient();
  const model =
    modelOverride ?? process.env.ANTHROPIC_MODEL ?? "claude-opus-4-6";

  const systemPrompt =
    tier === "free" ? buildFreeReportSystem() : buildFullReportSystem();

  const userMessage = formatBaziForPrompt(options);

  const resolvedMaxTokens = maxTokens ?? (tier === "free" ? 1024 : 4096);

  const stream = client.messages.stream({
    model,
    max_tokens: resolvedMaxTokens,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
