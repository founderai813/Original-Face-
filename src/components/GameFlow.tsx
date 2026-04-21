"use client";

import { useState, useCallback, useMemo } from "react";
import {
  drawSeasonCard,
  drawGamePhases,
  drawTenGodCard,
  totalQuestionCount,
  STEP_LABELS,
  type SeasonCard,
  type TenGodCard,
  type PlayerAnswer,
  type GamePhase,
  type ChoiceOption,
} from "@/lib/game";
import type { ElementKey } from "@/lib/elements";
import { apiUrl } from "@/lib/paths";

type Step = 1 | 2 | 3 | 4 | 5;

const ELEMENT_COLORS: Record<string, { border: string; text: string }> = {
  wood: { border: "border-[#9dd89d]", text: "text-[#9dd89d]" },
  fire: { border: "border-[#e8704a]", text: "text-[#e8704a]" },
  earth: { border: "border-[#d4a845]", text: "text-[#d4a845]" },
  metal: { border: "border-[#a8cce0]", text: "text-[#a8cce0]" },
  water: { border: "border-[#6090d0]", text: "text-[#6090d0]" },
};

export default function GameFlow() {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [seasonCard, setSeasonCard] = useState<SeasonCard | null>(null);
  const [seasonRevealed, setSeasonRevealed] = useState(false);

  // Step 2
  const [phases] = useState<GamePhase[]>(() => drawGamePhases());
  const total = useMemo(() => totalQuestionCount(phases), [phases]);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [currentChoice, setCurrentChoice] = useState<ChoiceOption | null>(null);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [showPhaseIntro, setShowPhaseIntro] = useState(true);

  // Step 3
  const [tenGodCard, setTenGodCard] = useState<TenGodCard | null>(null);
  const [tenGodReaction, setTenGodReaction] = useState("");

  // Step 4 — preliminary
  const [preliminary, setPreliminary] = useState("");
  const [prelimLoading, setPrelimLoading] = useState(false);

  // Step 5 — bazi + full report
  const [baziForm, setBaziForm] = useState({
    name: "",
    gender: "male" as "male" | "female",
    year: "",
    month: "",
    day: "",
    hour: "",
  });
  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [showBaziForm, setShowBaziForm] = useState(false);

  // ── current question helper ──
  const currentPhase = phases[phaseIdx];
  const currentCard = currentPhase?.cards[cardIdx];
  const globalIdx = useMemo(() => {
    let count = 0;
    for (let p = 0; p < phaseIdx; p++) count += phases[p].cards.length;
    return count + cardIdx;
  }, [phases, phaseIdx, cardIdx]);

  // ── Step 1：季節卡 ──
  function handleDrawSeason() {
    const card = drawSeasonCard();
    setSeasonCard(card);
    setTimeout(() => setSeasonRevealed(true), 100);
  }

  // ── Step 2：回上一題 ──
  function handleGoBack() {
    if (globalIdx <= 0) return;

    // 移除最後一筆回答
    const newAnswers = [...playerAnswers];
    newAnswers.pop();
    setPlayerAnswers(newAnswers);
    setCurrentText("");
    setCurrentChoice(null);

    if (cardIdx > 0) {
      setCardIdx(cardIdx - 1);
    } else if (phaseIdx > 0) {
      const prevPhase = phases[phaseIdx - 1];
      setPhaseIdx(phaseIdx - 1);
      setCardIdx(prevPhase.cards.length - 1);
      setShowPhaseIntro(false);
    }
  }

  // ── Step 2：情境問題 ──
  function handleAnswerSubmit() {
    if (!currentCard) return;

    const isChoice = !!currentCard.options && !currentCard.textOnly;
    const trimmed = currentText.trim();

    // 檢查是否有回答
    if (isChoice && !currentChoice) return;
    if (!isChoice && !trimmed) return;

    const answer: PlayerAnswer = { card: currentCard };
    if (isChoice && currentChoice) {
      answer.choice = currentChoice.label;
      answer.element = currentChoice.element;
    }
    if (trimmed) {
      answer.text = trimmed;
    }

    setPlayerAnswers([...playerAnswers, answer]);
    setCurrentText("");
    setCurrentChoice(null);

    if (cardIdx < currentPhase.cards.length - 1) {
      setCardIdx(cardIdx + 1);
    } else if (phaseIdx < phases.length - 1) {
      setPhaseIdx(phaseIdx + 1);
      setCardIdx(0);
      setShowPhaseIntro(true);
    } else {
      setStep(3);
    }
  }

  // ── Step 4：初步讀出 ──
  const handlePreliminary = useCallback(async () => {
    if (!seasonCard) return;
    setPrelimLoading(true);
    try {
      const res = await fetch(apiUrl("/api/preliminary"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "你",
          seasonCard: {
            name: seasonCard.name,
            elementZh: seasonCard.elementZh,
            energy: seasonCard.energy,
          },
          tenGodCard: tenGodCard
            ? { name: tenGodCard.name, role: tenGodCard.role }
            : { name: "未抽", role: "—" },
          tenGodReaction: tenGodReaction || undefined,
          gameAnswers: playerAnswers.map((pa) => ({
            category: pa.card.categoryZh,
            question: pa.card.question,
            choice: pa.choice,
            element: pa.element,
            text: pa.text,
          })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("無法讀取回應");
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPreliminary(acc);
      }
    } catch {
      setPreliminary("讀出暫時無法產生，但你仍然可以繼續看命盤報告。");
    } finally {
      setPrelimLoading(false);
    }
  }, [seasonCard, tenGodCard, tenGodReaction, playerAnswers]);

  // ── Step 5：完整報告 ──
  const handleGenerateReport = useCallback(async () => {
    setReportError("");
    setReportLoading(true);
    try {
      const res = await fetch(apiUrl("/api/report"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: baziForm.name,
          gender: baziForm.gender,
          email: "test@game.local",
          year: Number(baziForm.year),
          month: Number(baziForm.month),
          day: Number(baziForm.day),
          hour: Number(baziForm.hour),
          minute: 0,
          gameElement: seasonCard?.element || null,
          tier: "free",
          gameAnswers: playerAnswers.map((pa) => ({
            category: pa.card.categoryZh,
            question: pa.card.question,
            choice: pa.choice,
            element: pa.element,
            text: pa.text,
          })),
          tenGodDrawn: tenGodCard
            ? { name: tenGodCard.name, role: tenGodCard.role }
            : null,
          tenGodReaction,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "未知錯誤" }));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }
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
      setReportError(err instanceof Error ? err.message : "報告生成失敗");
    } finally {
      setReportLoading(false);
    }
  }, [baziForm, seasonCard, playerAnswers, tenGodCard, tenGodReaction]);

  // ── Progress bar ──
  function ProgressBar() {
    return (
      <div className="flex items-center justify-center gap-2 mb-10">
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const active = s === step;
          const done = s < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border transition-all ${
                  active
                    ? "border-gold-light bg-gold-main/20 text-gold-light"
                    : done
                      ? "border-gold-main/60 bg-gold-main/10 text-gold-main"
                      : "border-ink-edge text-ink-edge"
                }`}
              >
                {done ? "\u2713" : s}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-6 h-px ${done ? "bg-gold-main/40" : "bg-ink-edge"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ProgressBar />

      {/* ════ Step 1：季節卡 ════ */}
      {step === 1 && (
        <div className="text-center space-y-8">
          <div>
            <p className="text-gold-main/70 tracking-widest text-sm mb-2">
              第一步
            </p>
            <h2 className="text-2xl tracking-widest text-gold-light">
              抽一張季節卡
            </h2>
            <p className="text-gold-main/60 mt-2 text-sm">
              這張卡說的是你今天帶來的能量，不是你永遠的樣子。
            </p>
          </div>

          {!seasonCard && (
            <button onClick={handleDrawSeason} className="btn-gold mx-auto">
              翻 牌
            </button>
          )}

          {seasonCard && (
            <div
              className={`border ${ELEMENT_COLORS[seasonCard.element]?.border ?? "border-gold-main"} p-8 transition-all duration-700 ${
                seasonRevealed
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <span
                  className={`text-3xl tracking-widest ${ELEMENT_COLORS[seasonCard.element]?.text ?? "text-gold-light"}`}
                >
                  {seasonCard.name}
                </span>
                <span className="text-gold-main/50 text-sm">
                  {seasonCard.month}｜{seasonCard.elementZh}
                </span>
              </div>
              <p className="text-gold-main/80 text-sm italic mb-4">
                {seasonCard.imagery}
              </p>
              <p className="text-gold-light/90 leading-relaxed mb-4">
                {seasonCard.description}
              </p>
              <p className="text-gold-main/70 text-sm border-t border-gold-dark/30 pt-4">
                {seasonCard.prompt}
              </p>
              <p
                className={`mt-4 text-sm ${ELEMENT_COLORS[seasonCard.element]?.text ?? "text-gold-light"}`}
              >
                {seasonCard.affirmation}
              </p>
              <button onClick={() => setStep(2)} className="btn-gold mt-8">
                繼 續
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════ Step 2：情境問題（20 題） ════ */}
      {step === 2 && currentCard && (
        <div className="space-y-6">
          {/* 階段轉場介紹 */}
          {showPhaseIntro ? (
            <div className="text-center space-y-6">
              <p className="text-gold-main/70 tracking-widest text-sm">
                第二步 · {currentPhase.label}階段
              </p>
              <h2
                className={`text-2xl tracking-widest ${currentPhase.color}`}
              >
                {currentPhase.label}
              </h2>
              <p className="text-gold-main/70 leading-relaxed max-w-md mx-auto">
                {currentPhase.intro}
              </p>
              <button
                onClick={() => setShowPhaseIntro(false)}
                className="btn-gold"
              >
                準備好了
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span
                    className={`text-xs tracking-widest ${currentPhase.color}`}
                  >
                    {currentPhase.label}
                  </span>
                  <span className="text-gold-dark/40 text-xs">
                    {globalIdx + 1} / {total}
                  </span>
                </div>
                {/* progress bar */}
                <div className="w-full h-1 bg-ink-edge rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-main/60 transition-all duration-300"
                    style={{
                      width: `${((globalIdx + 1) / total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="border border-gold-dark/50 p-6 space-y-4">
                <p className="text-gold-main/70 text-sm italic">
                  {currentCard.entry}
                </p>
                <p className="text-gold-light text-lg leading-relaxed">
                  {currentCard.question}
                </p>

                {/* 選擇題：顯示 4 個選項按鈕 */}
                {currentCard.options && !currentCard.textOnly && (
                  <div className="space-y-2">
                    {currentCard.options.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setCurrentChoice(opt)}
                        className={`w-full text-left px-4 py-3 border transition-all ${
                          currentChoice?.label === opt.label
                            ? "border-gold-light bg-gold-main/10 text-gold-light"
                            : "border-gold-dark/50 text-gold-main/80 hover:border-gold-main/60 hover:text-gold-light"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 填充題：顯示 textarea */}
                {(currentCard.textOnly || !currentCard.options) && (
                  <textarea
                    className="input-ink min-h-[120px] resize-none"
                    placeholder="說真話就好。不用完美，真的就好。"
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                  />
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {globalIdx > 0 && (
                      <button
                        onClick={handleGoBack}
                        className="text-gold-dark/60 text-xs hover:text-gold-main transition-colors"
                      >
                        ← 上一題
                      </button>
                    )}
                    <span className="text-gold-dark/40 text-xs">
                      {currentCard.options && !currentCard.textOnly
                        ? currentChoice
                          ? "已選擇"
                          : "選一個"
                        : `${currentText.trim().length} 字`}
                    </span>
                  </div>
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={
                      currentCard.options && !currentCard.textOnly
                        ? !currentChoice
                        : currentText.trim().length < 2
                    }
                    className="btn-gold"
                  >
                    {globalIdx < total - 1 ? "下一題" : "完成所有問題"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════ Step 3：十神卡 ════ */}
      {step === 3 && (
        <div className="text-center space-y-8">
          <div>
            <p className="text-gold-main/70 tracking-widest text-sm mb-2">
              第三步
            </p>
            <h2 className="text-2xl tracking-widest text-gold-light">
              抽一張十神卡
            </h2>
            <p className="text-gold-main/60 mt-2 text-sm">
              這張卡代表一種角色能量。看看它像不像今天的你。
            </p>
          </div>

          {!tenGodCard && (
            <button
              onClick={() => setTenGodCard(drawTenGodCard())}
              className="btn-gold mx-auto"
            >
              翻 牌
            </button>
          )}

          {tenGodCard && (
            <div className="border border-gold-main p-8 space-y-4 text-left">
              <div className="text-center mb-4">
                <span className="text-3xl tracking-widest text-gold-light">
                  {tenGodCard.name}
                </span>
                <span className="text-gold-main/60 text-sm ml-3">
                  {tenGodCard.role}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-gold-light/90">
                  <span className="text-gold-main/60 mr-2">天生優勢：</span>
                  {tenGodCard.strengths}
                </p>
                <p className="text-gold-light/90">
                  <span className="text-gold-main/60 mr-2">可能挑戰：</span>
                  {tenGodCard.challenges}
                </p>
              </div>
              <div className="border-t border-gold-dark/30 pt-4 space-y-3">
                <p className="text-gold-main/70 text-sm text-center">
                  這個角色像今天的你嗎？
                </p>
                <textarea
                  className="input-ink min-h-[80px] resize-none"
                  placeholder="像或不像都好，說說看為什麼。"
                  value={tenGodReaction}
                  onChange={(e) => setTenGodReaction(e.target.value)}
                />
                <div className="text-center">
                  <button
                    onClick={() => {
                      setStep(4);
                      setTimeout(handlePreliminary, 200);
                    }}
                    className="btn-gold"
                  >
                    看我的初步讀出
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ Step 4：初步讀出 ════ */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gold-main/70 tracking-widest text-sm mb-2">
              第四步
            </p>
            <h2 className="text-2xl tracking-widest text-gold-light">
              從你的回答中，我看到了這些
            </h2>
          </div>

          {prelimLoading && (
            <div className="text-center text-gold-main/50 text-sm tracking-widest animate-pulse py-8">
              正在讀取你的回答…
            </div>
          )}

          {preliminary && (
            <div className="border border-gold-main/40 p-8 space-y-6">
              <div className="report-prose whitespace-pre-wrap text-center leading-relaxed">
                {preliminary}
              </div>

              {!prelimLoading && !showBaziForm && (
                <div className="pt-6 border-t border-gold-dark/30 text-center space-y-4">
                  <p className="text-gold-main/80 text-sm tracking-widest leading-relaxed">
                    以上是從你的回答讀出來的。
                    <br />
                    想不想看你的命盤怎麼說？
                  </p>
                  <button
                    onClick={() => setShowBaziForm(true)}
                    className="btn-gold"
                  >
                    輸入生辰八字，看命盤對照
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 八字表單 */}
          {showBaziForm && (
            <div className="space-y-4 pt-4">
              <div className="text-center mb-4">
                <p className="text-gold-main/60 text-sm tracking-widest">
                  你的命盤早就寫好了——只是你還沒看過。
                </p>
              </div>

              <div>
                <label className="label-ink">姓名（或暱稱）</label>
                <input
                  type="text"
                  className="input-ink"
                  placeholder="怎麼稱呼你？"
                  value={baziForm.name}
                  onChange={(e) =>
                    setBaziForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="label-ink">性別</label>
                <div className="flex gap-4">
                  {(["male", "female"] as const).map((g) => (
                    <label key={g} className="flex-1">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={baziForm.gender === g}
                        onChange={() =>
                          setBaziForm((f) => ({ ...f, gender: g }))
                        }
                        className="sr-only peer"
                      />
                      <div className="px-4 py-3 text-center border border-gold-dark/50 cursor-pointer peer-checked:border-gold-main peer-checked:text-gold-light text-gold-main/60">
                        {g === "male" ? "男" : "女"}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-ink">出生年月日（西元）</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    className="input-ink"
                    placeholder="年"
                    min={1900}
                    max={2100}
                    value={baziForm.year}
                    onChange={(e) =>
                      setBaziForm((f) => ({ ...f, year: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    className="input-ink"
                    placeholder="月"
                    min={1}
                    max={12}
                    value={baziForm.month}
                    onChange={(e) =>
                      setBaziForm((f) => ({ ...f, month: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    className="input-ink"
                    placeholder="日"
                    min={1}
                    max={31}
                    value={baziForm.day}
                    onChange={(e) =>
                      setBaziForm((f) => ({ ...f, day: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label-ink">出生時辰</label>
                <select
                  className="select-ink"
                  value={baziForm.hour}
                  onChange={(e) =>
                    setBaziForm((f) => ({ ...f, hour: e.target.value }))
                  }
                >
                  <option value="">請選擇</option>
                  {[
                    ["23", "子時（23:00–00:59）"],
                    ["1", "丑時（01:00–02:59）"],
                    ["3", "寅時（03:00–04:59）"],
                    ["5", "卯時（05:00–06:59）"],
                    ["7", "辰時（07:00–08:59）"],
                    ["9", "巳時（09:00–10:59）"],
                    ["11", "午時（11:00–12:59）"],
                    ["13", "未時（13:00–14:59）"],
                    ["15", "申時（15:00–16:59）"],
                    ["17", "酉時（17:00–18:59）"],
                    ["19", "戌時（19:00–20:59）"],
                    ["21", "亥時（21:00–22:59）"],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (
                    !baziForm.name ||
                    !baziForm.year ||
                    !baziForm.month ||
                    !baziForm.day ||
                    !baziForm.hour
                  )
                    return;
                  setStep(5);
                  setTimeout(handleGenerateReport, 200);
                }}
                disabled={
                  !baziForm.name ||
                  !baziForm.year ||
                  !baziForm.month ||
                  !baziForm.day ||
                  !baziForm.hour
                }
                className="btn-gold w-full"
              >
                看命盤對照
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════ Step 5：命盤報告 ════ */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gold-main/70 tracking-widest text-sm mb-2">
              你的命盤報告
            </p>
            <h2 className="text-2xl tracking-widest text-gold-light">
              {baziForm.name}，這是你
            </h2>
          </div>

          {reportError && (
            <div className="text-fire-main text-sm tracking-wider text-center">
              {reportError}
            </div>
          )}

          {report && (
            <div className="report-prose whitespace-pre-wrap">{report}</div>
          )}

          {reportLoading && (
            <div className="text-center text-gold-main/50 text-sm tracking-widest animate-pulse">
              命盤報告生成中…
            </div>
          )}

          {!reportLoading && report && (
            <div className="pt-6 border-t border-gold-dark/30 space-y-3 text-center">
              <p className="text-gold-main/70 text-sm tracking-widest">
                這是你的免費基礎報告。想看完整解讀嗎？
              </p>
              <button className="btn-gold" disabled>
                升級完整報告（NT$500 — 尚未上線）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
