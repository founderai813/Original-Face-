# 本來面目｜五行自我探索遊戲

> Original Face — A Five Elements Self-Discovery Card Game & Bazi Report System

一款結合東方命理（八字、五行、十神）、桌遊設計與 AI 命盤報告的自我探索產品。
實體桌遊是入口，數位命盤報告是商業閉環的後端。

---

## 專案結構

```
.
├── data/                       # 卡牌與遊戲規則的結構化資料
│   ├── season-cards.json       # 12 張季節能量卡
│   ├── ten-gods.json           # 10 種十神角色卡
│   ├── situation-cards.json    # 30 張情境問題卡
│   ├── interaction-cards.json  # 10 張生剋互動卡
│   ├── secret-missions.json    # 10 張秘密任務卡
│   └── five-elements.json      # 五行、生剋、對照表
│
├── docs/                       # 遊戲規則與設計文件
│   ├── 01-game-rules.md        # v4.0 遊戲流程
│   ├── 02-host-worksheet.md    # 主持人工作表
│   ├── 03-business-model.md    # 商業模式
│   └── 04-visual-spec.md       # 視覺設計規格 + Midjourney prompts
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 全域版型
│   │   ├── page.tsx            # 掃碼落地頁
│   │   ├── globals.css         # 金框 / 五行色系樣式
│   │   └── api/
│   │       ├── bazi/route.ts   # 純八字計算 API
│   │       └── report/route.ts # 八字 + AI 報告串流 API
│   ├── components/
│   │   └── BaziForm.tsx        # 生辰八字輸入表單
│   ├── lib/
│   │   ├── elements.ts         # 五行資料與關係計算
│   │   ├── bazi.ts             # 八字計算（使用 lunar-javascript）
│   │   ├── prompts.ts          # AI 報告 prompt 模板
│   │   └── ai-report.ts        # Anthropic SDK 串流包裝
│   └── types/
│       └── lunar-javascript.d.ts
│
└── scripts/
    ├── test-bazi.ts            # 八字計算單元測試
    └── test-ai-report.ts       # AI 報告端對端測試
```

## 快速啟動

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數
cp .env.example .env.local
# 編輯 .env.local，填入 ANTHROPIC_API_KEY

# 3. 跑八字計算測試（不需要 API key）
npm run test:bazi

# 4. 跑 AI 報告測試（需要 ANTHROPIC_API_KEY）
ANTHROPIC_API_KEY=sk-ant-... npm run test:ai-report

# 5. 啟動開發伺服器
npm run dev
# 打開 http://localhost:3000
```

## NPM Scripts

| Script | 說明 |
|--------|------|
| `npm run dev` | 啟動 Next.js 開發伺服器 |
| `npm run build` | 生產環境 build |
| `npm run start` | 啟動 production server |
| `npm run typecheck` | TypeScript 型別檢查 |
| `npm run lint` | Next.js 內建 ESLint |
| `npm run test:bazi` | 八字計算回歸測試（4 組樣本、24 個斷言） |
| `npm run test:ai-report` | 呼叫 Anthropic API 串流生成報告（需要 API key） |

## 技術架構

| 層級 | 工具 |
|------|------|
| 前端 | Next.js 14 App Router, React 18, Tailwind CSS |
| 後端 | Next.js API Routes |
| 命理 | `lunar-javascript`（八字、節氣、十神計算） |
| AI   | `@anthropic-ai/sdk` — Claude Opus 4.6 + prompt caching + streaming |
| 驗證 | `zod` |

## AI 報告設計

AI 命盤報告分兩種層級：

| Tier | 長度 | 用途 | 價格 |
|------|------|------|------|
| `free` | ~300 字 | 掃碼落地頁免費體驗，重點：日主 + 月令 + 一句話 | 免費 |
| `full` | ~1800 字 | 付費完整報告：四柱、五行分佈、十神、功課 | NT$500–1,200 |

**Prompt 設計關鍵：**

- **風格指南 + 輸出格式** 放在 system prompt，加 `cache_control: { type: "ephemeral" }` → 後續請求可 ~90% 成本折扣
- **使用者專屬八字資料** 放在 user message → breakpoint 之後，每次請求獨立
- 使用 `client.messages.stream()` + `finalMessage()`，避免大型回應 HTTP 超時
- 預設模型 `claude-opus-4-6`，可透過 `ANTHROPIC_MODEL` env var 覆寫

## 待辦

**數位**
- [ ] 付費金流整合（綠界 / Stripe）
- [ ] 用戶資料後台、報告保存
- [ ] Email 寄送完整報告
- [ ] 報告分享連結（每個報告獨立 URL）

**實體**
- [ ] 三張插圖外包（月老紅線 / 水面倒影 / 懸崖孤松）
- [ ] 情境問題卡最終版面
- [ ] 印刷規格確認與成本估算

**工作坊**
- [ ] 第一場工作坊場地和對象確認
- [ ] 主持人工作表逐字稿練習

---

*v5.0 — Claude Code 移轉版*
