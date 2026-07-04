# 作業二開發計畫：Design Skill 切版 + E2E 測試 Skill

- **分支**：`homework2-design-e2e`
- **建立日期**：2026-06-27
- **狀態**：進行中

---

## Context

根據六角學院 2026 AI 開發進化營作業二說明，完成兩個挑戰：

- 挑戰一：使用 Claude 官方 frontend-design skill 搭配 Figma MCP 設計各頁面，並依設計稿完成前台切版
- 挑戰二：建立 E2E 測試 Skill、用 Playwright 瀏覽器自動化執行完整金流流程、錄製影片

**起始狀態**：已有玫瑰色系 Tailwind 主題（`public/css/input.css`）、10 個 EJS 頁面、無 Playwright、無 `docs/design/` 目錄、無 E2E Skill。

---

## 挑戰一：frontend-design Skill 搭配 Figma MCP 設計各頁面

### Step 1 — 安裝 Claude 官方 frontend-design Skill ✅
- 使用 Claude Code `/plugin` 指令安裝官方 `frontend-design` plugin
- 安裝後執行 `/reload-plugins` 套用
- Skill 提供：視覺設計方向、字體排版建議、避免樣板化預設值的設計指引

### Step 2 — 安裝 Anthropic 官方 figma 插件並完成授權
使用 Anthropic 官方 figma 插件（內建 Figma 官方雲端 MCP），無需手動設定 `.mcp.json`：
- 執行 `/plugin`，確認是否已安裝 `figma`；未安裝則執行 `/plugin install figma` + `/reload-plugins`
- 執行 `/mcp`，確認 `figma` 已連線；未連線則選 figma → Authenticate，透過瀏覽器完成 Figma 帳號 OAuth 授權
- 請使用者提供 Figma 設計檔 URL，取出 `fileKey`

### Step 3 — 透過 frontend-design Skill 搭配 Figma MCP 產出設計稿
- 建立自訂 project skill `.claude/skills/design/SKILL.md`（呼叫方式 `/design`），內部引用官方 `frontend-design` skill 的設計流程與 Figma MCP 工具
- **不參考現有專案色彩（`public/css/input.css`）**，自行為 Bloom & Co. 規劃全新品牌色彩系統，取得各頁面視覺設計方向
- 在 Figma 中建立色彩系統（Color Styles）
- 透過 Figma MCP 設計 7 個頁面：
  - 首頁（index）、商品詳情（product-detail）
  - 購物車（cart）、結帳（checkout）
  - 訂單列表（orders）、訂單詳情（order-detail）
  - 登入／註冊（login）
- 建立 `docs/design/README.md`，記錄設計規範說明與 Figma 連結

### Step 4 — 切版實作
依 Figma 設計稿更新以下 EJS 檔案（保留 Vue 3 邏輯，只改版型與 Tailwind class）：

| 檔案 | 主要異動 |
|------|---------|
| `views/pages/index.ejs` | 商品 Grid 排版、Hero Banner |
| `views/pages/product-detail.ejs` | 大圖區、加入購物車按鈕 |
| `views/pages/cart.ejs` | 品項列表、金額彙總區 |
| `views/pages/checkout.ejs` | 表單佈局、訂單摘要 Sidebar |
| `views/pages/orders.ejs` | 訂單卡片列表 + 狀態 Badge |
| `views/pages/order-detail.ejs` | 付款狀態區塊、金流按鈕 |
| `views/pages/login.ejs` | 登入／註冊表單、Tab 切換 |
| `views/partials/header.ejs` | 導覽列（含購物車數量徽章、`md` 斷點以下漢堡選單） |

### Step 5 — RWD 響應式與導覽列補強 ✅（計畫外追加）
切版完成後追加以下項目，未在 Figma 設計稿逐一列出但屬必要的響應式調整：
- `views/partials/header.ejs`：新增漢堡選單按鈕與行動版下拉選單
- Hero Banner、商品 Grid 等區塊依斷點調整為單欄／雙欄排版
- 已同步記錄於 `docs/design/README.md` 的 Navbar（行動版）章節

---

## 挑戰二：E2E 測試 Skill 與 Playwright MCP 自動化測試

### Step 1 — 建立 E2E Skill ✅
- 新增 `.claude/skills/e2e-payment-test/SKILL.md`
- 內容涵蓋：測試目標、3 個場景定義、Playwright MCP 設定方式與執行說明

### Step 2 — 安裝 Playwright MCP
透過 Playwright MCP 讓 Claude 直接控制瀏覽器執行測試，不需預先撰寫測試腳本：
```bash
claude mcp add playwright npx @playwright/mcp@latest
```
或在 `.mcp.json` 設定：
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```
確認安裝：`claude mcp list` 或 `/mcp`

### Step 3 — 透過 Playwright MCP 執行 3 個測試場景

| 場景 | 流程 | 驗證點 |
|------|------|--------|
| 場景一：完整金流成功 | 加入購物車 → 結帳 → 訂單詳情 → 模擬付款成功 | 狀態顯示「已付款」 |
| 場景二：付款失敗 | 建立訂單 → 訂單詳情 → 模擬付款失敗 | 狀態顯示「付款失敗」 |
| 場景三：空購物車 | 未登入前往購物車 → 嘗試結帳 | 顯示「購物車是空的」、重導至登入頁 |

Claude 透過 Playwright MCP 工具逐步操作瀏覽器，測試過程以 Xbox Game Bar 或 OBS 螢幕錄製，完成後上傳 YouTube。

---

## README.md 更新 ✅
在作業1區塊下方新增作業2表格，含挑戰說明、分支連結、YouTube 錄影連結預留位置。

---

## 驗證方式
1. `npm start` — 確認所有切版頁面視覺正確
2. 呼叫 `/e2e-payment-test` — Claude 透過 Playwright MCP 控制瀏覽器執行 3 個測試場景
3. 確認每個場景的測試結果，並確認影片已錄製完成
4. `npm test` — 原有 48 個 Vitest 案例全部仍通過

---

## 待完成項目
- [x] 安裝 Anthropic 官方 figma 插件（`/plugin install figma`），完成 Figma 帳號 OAuth 授權
- [x] 呼叫 `/frontend-design` 搭配 Figma MCP 產出各頁面設計稿
- [x] 依設計稿完成 7 個 EJS 檔案切版（含 header、admin 色彩、RWD 響應式）
- [ ] 設定 Playwright MCP（`claude mcp add playwright npx @playwright/mcp@latest`）
- [ ] 呼叫 `/e2e-payment-test` 透過 Playwright MCP 執行測試並截圖
- [ ] 上傳測試錄影至 YouTube，補上連結至 `README.md`
- [ ] 計畫完成後移至 `docs/plans/archive/`
