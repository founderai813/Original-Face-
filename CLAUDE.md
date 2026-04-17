# CLAUDE.md

此檔是給 Claude Code 看的 repo 索引，讓未來任何新的 session 都能快速上手此專案。

---

## 專案概述

**本來面目｜五行自我探索遊戲**（Original Face — Five Elements Self-Discovery）

一款結合**東方命理（八字、五行、十神）**、**桌遊設計**與 **AI 命盤報告**的自我探索產品。實體桌遊是獲客入口，數位命盤報告是商業閉環後端。

### 商業閉環

```
實體桌遊體驗（NT$1,200–1,500）
    ↓
掃碼輸入生辰八字
    ↓
免費五行基礎報告（AI 生成，~300 字）
    ↓
付費完整 AI 命盤報告（NT$500–1,200，~1800 字）
    ↓
一對一諮詢（NT$2,000–5,000）
```

完整商業規劃見 `docs/03-business-model.md`。

### 使用者流程

1. 玩家在桌遊場景中完成 70 分鐘的五行自我探索
2. 結尾掃 QR code 進入 `https://futurestarai.com/original-face/`
3. 填入生辰八字（姓名、性別、年月日時辰），以及遊戲中直覺抽到的五行（選填）
4. 系統計算命盤後，以**串流**方式即時呈現 AI 生成的免費報告
5. 報告末尾引導升級為付費完整版

---

## 品牌與網域

**主品牌**：`futurestarai.com`

**子專案命名慣例**：`<project>.futurestarai.com` 或 `futurestarai.com/<project>/`

本專案目前部署在 **`futurestarai.com/original-face/`**（子路徑模式）——透過 Cloudflare Worker 做反向代理。未來若要切換成子網域 `original-face.futurestarai.com`，只需把 `BASE_PATH` env var 清空重新 build，再調整 DNS 即可。

> 新增其他子專案時，沿用這個模式：
> - 新 repo → Cloudflare Pages 部署
> - 加一個 Worker 路由或直接綁子網域
> - 前端程式碼預設走子路徑模式，以便主品牌能一次管理多個 app

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | Next.js 14（App Router）、React 18、Tailwind CSS |
| 後端 | Next.js API Routes（Cloudflare Pages Functions） |
| 命理計算 | `lunar-javascript`（國曆 → 八字、節氣、十神） |
| AI | `@anthropic-ai/sdk` — Claude Opus 4.6 + prompt caching + streaming |
| 驗證 | `zod` |
| 部署 | Cloudflare Pages + Cloudflare Worker（反向代理） |

### 前端

- `src/app/page.tsx` — 掃碼落地頁（server component）
- `src/app/layout.tsx` — 全域版型（繁中字型、深色基調）
- `src/app/globals.css` — 金框、五行色系、表單樣式
- `src/components/BaziForm.tsx` — 生辰八字輸入表單（client component），使用 `fetch` 串流接收 AI 報告
- `src/lib/paths.ts` — `apiUrl()` helper，前端 fetch 時自動帶上 `BASE_PATH` 前綴

### 後端（API Routes）

- `src/app/api/bazi/route.ts` — `POST /api/bazi`，純八字計算，回傳命盤 JSON
- `src/app/api/report/route.ts` — `POST /api/report`，計算八字 + 呼叫 Anthropic API 串流生成報告（`text/plain` streaming response）

### 核心函式庫

- `src/lib/bazi.ts` — `calculateBazi()`：輸入年月日時，回傳四柱、日主、月令、十神、五行分佈、缺失五行、對應季節卡 ID
- `src/lib/elements.ts` — 五行資料、生剋關係、天干地支 → 五行對照
- `src/lib/prompts.ts` — AI 報告 prompt 模板：`buildFreeReportSystem()`、`buildFullReportSystem()`、`formatBaziForPrompt()`
- `src/lib/ai-report.ts` — `generateReport()`（non-streaming）、`streamReport()`（streaming generator），包裝 Anthropic SDK

### 資料（卡牌與規則）

所有桌遊卡牌都已結構化為 JSON，放在 `data/`：

| 檔案 | 內容 |
|------|------|
| `season-cards.json` | 12 張季節能量卡（含自然意象、能量、功課、一句話） |
| `ten-gods.json` | 10 種十神角色卡（正官、七殺、正財…） |
| `situation-cards.json` | 30 張情境問題卡（關係 10、自我 10、挑戰 10） |
| `interaction-cards.json` | 10 張生剋互動卡（連結類 5、張力類 5） |
| `secret-missions.json` | 10 張秘密任務卡 |
| `five-elements.json` | 五行、生剋、天干地支對照、人數 → 卡數對照 |

### 遊戲與設計文件

| 檔案 | 內容 |
|------|------|
| `docs/01-game-rules.md` | v4.0 遊戲流程（開場 → 三階段 → 結尾） |
| `docs/02-host-worksheet.md` | 主持人工作表（checklist、逐字稿、緊急接話句） |
| `docs/03-business-model.md` | 商業模式三階段 |
| `docs/04-visual-spec.md` | 卡牌視覺規格 + Midjourney prompts |
| `docs/05-deployment.md` | Cloudflare Pages + Worker 子路徑部署步驟 |

---

## 部署資訊

### 正式環境

- **主網址**：`https://futurestarai.com/original-face/`
- **底層部署**：Cloudflare Pages（`original-face.pages.dev`）
- **前端代理**：Cloudflare Worker `original-face-proxy`，路由 `futurestarai.com/original-face/*`
- **正式分支**：`claude/five-elements-game-cx9J1`（之後預計 merge 到 `main`）

### Environment Variables（Cloudflare Pages）

| Key | 用途 |
|-----|------|
| `BASE_PATH` | `/original-face`（讓 Next.js 知道自己住在子路徑） |
| `ANTHROPIC_API_KEY` | Claude API key，AI 報告必需 |
| `ANTHROPIC_MODEL` | 選填，預設 `claude-opus-4-6` |

**Compatibility flag**：`nodejs_compat`（Next.js API routes 需要 Node API）

### 部署步驟

詳見 `docs/05-deployment.md`。摘要：

1. Cloudflare Dashboard → Pages → Connect to Git → 選 repo、branch、env vars、build 設定
2. Cloudflare Worker（`docs/05-deployment.md` 裡有完整 code）做反向代理
3. Worker 綁定 `futurestarai.com/original-face/*` route

### 本機開發

```bash
cp .env.example .env.local
# 編輯 .env.local 填入 ANTHROPIC_API_KEY

npm install
npm run dev
# 打開 http://localhost:3000
```

---

## Claude Code 工作流程

### 分支策略

- **正式**：`claude/five-elements-game-cx9J1`（目前）、未來 merge 到 `main`
- **新功能**：從 `main` 開新 branch，命名 `claude/<feature-name>-<suffix>`

### NPM Scripts

| Script | 用途 |
|--------|------|
| `npm run dev` | Next.js 開發伺服器 |
| `npm run build` | 生產 build（子路徑模式用 `BASE_PATH=/original-face npm run build`） |
| `npm run start` | Production server |
| `npm run typecheck` | TypeScript 型別檢查（`tsc --noEmit`） |
| `npm run lint` | Next.js 內建 ESLint |
| `npm run test:bazi` | 八字計算回歸測試（4 組權威樣本、24 個斷言，含立春／立秋邊界） |
| `npm run test:ai-report` | 呼叫 Anthropic API 端對端測試（需要 `ANTHROPIC_API_KEY`） |

### 新功能 checklist

做完一個功能前，確認：

- [ ] `npm run typecheck` 過
- [ ] `npm run build` 過（記得測 `BASE_PATH=/original-face` 模式）
- [ ] 若動到八字邏輯，`npm run test:bazi` 要全綠
- [ ] 若動到 AI prompt，用 `npm run test:ai-report` 跑至少一次觀察輸出品質
- [ ] UI 改動：在瀏覽器手動測
- [ ] Commit 訊息用繁體中文，描述**為什麼**而不只是**做了什麼**
- [ ] Push 到 remote

### 開發慣例

- **繁體中文**：使用者文案、commit 訊息、文件都用繁中
- **文案風格**：參考 `docs/01-game-rules.md` 的卡牌文案——口語、直接、有衝擊感，不用文言、不用命理術語
- **Prompt 設計**：穩定內容放 system prompt（可 cache），變動內容放 user message。詳見 `src/lib/prompts.ts` 的 header 說明
- **fetch 呼叫**：前端一律用 `apiUrl()` helper，自動帶子路徑
- **模型預設**：Claude Opus 4.6（`claude-opus-4-6`），透過 `ANTHROPIC_MODEL` env var 可覆寫
- **型別**：善用 SDK 提供的型別，例如 `Anthropic.ContentBlock`、`Anthropic.TextBlock`，不要自己造重複的 interface

---

## 待辦（依優先順序）

### 短期（可立即推進）

- [ ] 付費金流整合（綠界 ECPay 或 Stripe）
- [ ] Email 寄送完整報告（SendGrid / Resend）
- [ ] 報告分享連結（每個報告獨立 URL + 社群預覽圖）
- [ ] 用戶資料後台（存報告、查看歷史）

### 中期（需要設計資源）

- [ ] 三張插圖外包完成（月老牽紅線、水面倒影、懸崖孤松）
- [ ] 情境問題卡最終版面（插圖嵌入）
- [ ] 卡背設計（燙銀）、覺察卡版面

### 長期（需要營運啟動）

- [ ] 第一場工作坊（場地、對象、主持人練習）
- [ ] 教練認證課程內容
- [ ] 訂閱制社群規劃

---

## 參考資訊

- **Anthropic API docs**：https://docs.anthropic.com/
- **Next.js 14 docs**：https://nextjs.org/docs
- **lunar-javascript repo**：https://github.com/6tail/lunar-javascript
- **Cloudflare Pages**：https://developers.cloudflare.com/pages/
- **Cloudflare Workers**：https://developers.cloudflare.com/workers/

---

*最後更新：2026-04-17*
