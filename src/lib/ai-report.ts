import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildFreeReportSystem,
  buildFullReportSystem,
  formatBaziForPrompt,
  type ReportContext,
} from "./prompts";

export type ReportTier = "free" | "full";

export interface GenerateReportOptions extends ReportContext {
  tier: ReportTier;
  model?: string;
  maxTokens?: number;
}

export interface ReportResult {
  content: string;
  model: string;
}

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function generateReport(
  options: GenerateReportOptions,
): Promise<ReportResult> {
  const { tier, model: modelOverride, maxTokens } = options;

  const client = getClient();
  const modelName = modelOverride ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: tier === "free" ? buildFreeReportSystem() : buildFullReportSystem(),
  });

  const userMessage = formatBaziForPrompt(options);
  const resolvedMaxTokens = maxTokens ?? (tier === "free" ? 1024 : 4096);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { maxOutputTokens: resolvedMaxTokens },
  });

  const text = result.response.text();

  return {
    content: text,
    model: modelName,
  };
}

export async function* streamReport(
  options: GenerateReportOptions,
): AsyncGenerator<string, void, unknown> {
  const { tier, model: modelOverride, maxTokens } = options;

  const client = getClient();
  const modelName = modelOverride ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: tier === "free" ? buildFreeReportSystem() : buildFullReportSystem(),
  });

  const userMessage = formatBaziForPrompt(options);
  const resolvedMaxTokens = maxTokens ?? (tier === "free" ? 1024 : 4096);

  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { maxOutputTokens: resolvedMaxTokens },
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
