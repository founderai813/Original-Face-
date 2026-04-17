"use client";

import { useState } from "react";
import type { ElementKey } from "@/lib/elements";
import { apiUrl } from "@/lib/paths";

interface FormState {
  name: string;
  gender: "male" | "female";
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  email: string;
  gameElement: ElementKey | "";
}

const ELEMENT_OPTIONS: { value: ElementKey | ""; label: string }[] = [
  { value: "", label: "略過（沒玩過遊戲）" },
  { value: "wood", label: "木" },
  { value: "fire", label: "火" },
  { value: "earth", label: "土" },
  { value: "metal", label: "金" },
  { value: "water", label: "水" },
];

const HOUR_OPTIONS = [
  { value: "23", label: "子時（23:00–00:59）" },
  { value: "1", label: "丑時（01:00–02:59）" },
  { value: "3", label: "寅時（03:00–04:59）" },
  { value: "5", label: "卯時（05:00–06:59）" },
  { value: "7", label: "辰時（07:00–08:59）" },
  { value: "9", label: "巳時（09:00–10:59）" },
  { value: "11", label: "午時（11:00–12:59）" },
  { value: "13", label: "未時（13:00–14:59）" },
  { value: "15", label: "申時（15:00–16:59）" },
  { value: "17", label: "酉時（17:00–18:59）" },
  { value: "19", label: "戌時（19:00–20:59）" },
  { value: "21", label: "亥時（21:00–22:59）" },
];

export default function BaziForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    gender: "male",
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "0",
    email: "",
    gameElement: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setReport("");

    // 基本檢查
    const year = Number(form.year);
    const month = Number(form.month);
    const day = Number(form.day);
    const hour = Number(form.hour);
    const minute = Number(form.minute);

    if (!form.name) return setError("請填入姓名");
    if (!form.email) return setError("請填入 Email");
    if (!year || year < 1900 || year > 2100) return setError("請輸入正確的西元年（1900–2100）");
    if (!month || month < 1 || month > 12) return setError("月份需在 1–12 之間");
    if (!day || day < 1 || day > 31) return setError("日期需在 1–31 之間");
    if (hour < 0 || hour > 23) return setError("時辰無效");

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/report"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          gender: form.gender,
          email: form.email,
          year,
          month,
          day,
          hour,
          minute,
          gameElement: form.gameElement || null,
          tier: "free",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "未知錯誤" }));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }

      // 串流回傳：一邊收一邊顯示
      const reader = res.body?.getReader();
      if (!reader) throw new Error("無法讀取回應");

      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReport(acc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "產生報告時發生錯誤");
    } finally {
      setSubmitting(false);
    }
  }

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!report && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label-ink">姓名</label>
            <input
              type="text"
              className="input-ink"
              placeholder="請輸入你的姓名"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-ink">性別</label>
            <div className="flex gap-4">
              <label className="flex-1">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === "male"}
                  onChange={() => update("gender", "male")}
                  className="sr-only peer"
                />
                <div className="px-4 py-3 text-center border border-gold-dark/50 cursor-pointer peer-checked:border-gold-main peer-checked:text-gold-light text-gold-main/60">
                  男
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === "female"}
                  onChange={() => update("gender", "female")}
                  className="sr-only peer"
                />
                <div className="px-4 py-3 text-center border border-gold-dark/50 cursor-pointer peer-checked:border-gold-main peer-checked:text-gold-light text-gold-main/60">
                  女
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="label-ink">出生年月日（西元）</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                className="input-ink"
                placeholder="年 (1990)"
                min={1900}
                max={2100}
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                required
              />
              <input
                type="number"
                className="input-ink"
                placeholder="月 (5)"
                min={1}
                max={12}
                value={form.month}
                onChange={(e) => update("month", e.target.value)}
                required
              />
              <input
                type="number"
                className="input-ink"
                placeholder="日 (15)"
                min={1}
                max={31}
                value={form.day}
                onChange={(e) => update("day", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-ink">出生時辰</label>
            <select
              className="select-ink"
              value={form.hour}
              onChange={(e) => update("hour", e.target.value)}
              required
            >
              <option value="">請選擇時辰</option>
              {HOUR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-ink">遊戲中直覺抽到的五行（選填）</label>
            <select
              className="select-ink"
              value={form.gameElement}
              onChange={(e) =>
                update("gameElement", e.target.value as ElementKey | "")
              }
            >
              {ELEMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-ink">Email（我們會把完整報告寄給你）</label>
            <input
              type="email"
              className="input-ink"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-fire-main text-sm tracking-wider">{error}</div>
          )}

          <button type="submit" className="btn-gold w-full" disabled={submitting}>
            {submitting ? "產生報告中…" : "產生我的五行報告"}
          </button>
        </form>
      )}

      {report && (
        <div className="space-y-6">
          <div className="report-prose whitespace-pre-wrap">{report}</div>
          {!submitting && (
            <div className="pt-6 border-t border-gold-dark/30 space-y-3">
              <p className="text-gold-main/70 text-sm tracking-widest">
                這是你的免費基礎報告。想看完整的八字解讀（約 2000 字）嗎？
              </p>
              <button className="btn-gold w-full" disabled>
                升級完整報告（NT$500 — 尚未上線）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
