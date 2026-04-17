# 部署：Cloudflare Pages + 子路徑 futurestarai.com/original-face/

## 架構

```
瀏覽器 https://futurestarai.com/original-face/*
    ↓
Cloudflare（DNS + Worker 或 Page Rule）
    ↓
Cloudflare Pages: original-face.pages.dev
```

## 第一步：在 Cloudflare Pages 部署 Next.js

1. 打開 https://dash.cloudflare.com/
2. 左側選單選 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 授權 GitHub，選 repo `founderai813/Original-Face-`
4. **Production branch** 選 `claude/five-elements-game-cx9J1`（或之後 merge 到 `main`）
5. **Build settings**：
   - Framework preset：**Next.js**
   - Build command：`npm run build`
   - Build output directory：`.next`
6. **Environment variables**（build 時和 runtime 都要）：
   | Key | Value |
   |-----|-------|
   | `BASE_PATH` | `/original-face` |
   | `ANTHROPIC_API_KEY` | `sk-ant-...`（你的 Claude API key） |
   | `ANTHROPIC_MODEL` | `claude-opus-4-6` |
7. **Compatibility flags**：加上 `nodejs_compat`（Next.js API routes 會用到 Node API）
8. 點 **Save and Deploy**，等 2–3 分鐘

部署完成後 Cloudflare 會給你一個像 `https://original-face.pages.dev` 的網址。**這時候進去測一下**，應該可以看到表單。注意網址要加上 `/original-face`：
```
https://original-face.pages.dev/original-face
```

（因為我們設了 basePath，直接進根目錄會 404，這是預期的。）

## 第二步：在 futurestarai.com 設定子路徑轉發

Cloudflare 有三種方法可以做子路徑轉發，從簡單到彈性排：

### 方法 A：Cloudflare Rules → Redirect（最簡單，但會在網址列跳轉）

不推薦——這會把使用者從 `futurestarai.com/original-face/` redirect 到 `original-face.pages.dev/original-face/`，網址列會變。

### 方法 B：Cloudflare Worker 反向代理（推薦）

保留網址列是 `futurestarai.com/original-face/`，後端從 Pages 取內容。

**步驟：**

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Create Worker**
2. 名字取 `original-face-proxy`
3. 把下面這段貼進去（覆蓋預設的）：

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 只處理 /original-face 開頭的路徑
    if (!url.pathname.startsWith("/original-face")) {
      return new Response("Not Found", { status: 404 });
    }

    // 組出 Pages 的實際網址，路徑照抄（因為 Pages 那邊也有 basePath）
    const target = new URL(
      url.pathname + url.search,
      "https://original-face.pages.dev",
    );

    // 轉送請求
    const proxied = new Request(target.toString(), request);
    // 改 Host header 讓 Pages 不拒絕
    proxied.headers.set("Host", "original-face.pages.dev");

    return fetch(proxied);
  },
};
```

4. **Save and Deploy**
5. 這個 Worker 的頁面右側找 **Settings** → **Triggers** → **Custom Domains** 底下的 **Routes**
6. 點 **Add route**，輸入：
   - Route：`futurestarai.com/original-face/*`
   - Zone：選 futurestarai.com
7. Save

完成後去瀏覽器試：
```
https://futurestarai.com/original-face/
```
應該就會看到表單。

### 方法 C：Cloudflare Workers for Platforms + Pages direct bindings（進階）

較複雜，略。如果方法 B 不夠用再研究。

## 測試清單

部署完成後手動測試這些：

- [ ] 打開 `https://futurestarai.com/original-face/` 看得到表單
- [ ] 填生辰八字按送出，看得到 AI 報告串流進來
- [ ] 試一個不同人的八字（確保不是快取舊資料）
- [ ] F12 打開 Network，確認 `/original-face/api/report` 是 200
- [ ] 手機瀏覽器打開，版面正常

## 成本估算

| 服務 | 費用 |
|------|------|
| Cloudflare Pages | 免費（每月 500 次 build、無限流量） |
| Cloudflare Worker | 免費（每天 10 萬次請求） |
| Anthropic API（Claude Opus 4.6） | 約 US$0.03–0.10 / 份免費報告 |

## 常見問題

**Q：送出表單後顯示 500**
- 檢查 Cloudflare Pages 的 Environment Variables 是否有 `ANTHROPIC_API_KEY`
- Pages Functions 頁面可以看 logs

**Q：頁面 CSS 跑掉**
- 代表 `_next/static` 資源沒載到。確認 BASE_PATH 在 build 時就設定（不是 runtime），因為 assetPrefix 是 build-time 寫死的

**Q：API 呼叫回 404**
- 確認 Worker 規則是 `/original-face/*`，且 Pages 的 BASE_PATH 有設對
