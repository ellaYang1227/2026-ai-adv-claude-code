# 2026-ai-adv-claude-code

> [六角] 2026 AI 開發進化營 — 課程作業，採用 Claude Code 進行 AI 開發協作

## [作業1] AI Agent 協作

| 挑戰 | 說明 |
|------|------|
| 挑戰一：調整專案架構 | 主要記憶文件（AGENTS.md / CLAUDE.md）、docs 資料夾（plans / DEVELOPMENT / ARCHITECTURE / FEATURES / TESTING）、AI Agent 設定集（.codex / .claude） |
| 挑戰二：新增功能 | 綠界金流串接 |

分支：[homework1-ai-agent](https://github.com/ellaYang1227/2026-ai-adv-claude-code/tree/homework1-ai-agent)

---

## 範例專案：Bloom & Co. 花卉電商網站

全端花卉電商示範專案，提供前台商品瀏覽、購物車、訂單與線上付款功能，以及後台商品與訂單管理介面。

## 技術棧

| 層級 | 技術 |
|------|------|
| 執行環境 | Node.js |
| 後端框架 | Express.js 4.x |
| 資料庫 | SQLite（better-sqlite3，同步 API，WAL 模式） |
| 模板引擎 | EJS 5.x（前台 / 後台雙 layout） |
| 前端框架 | Vue.js 3（CDN，Options API） |
| 樣式 | Tailwind CSS 4.x（@tailwindcss/cli） |
| 認證 | JWT + bcrypt |
| 金流 | ECPay 綠界全方位金流 AIO（CMV-SHA256） |
| 測試 | Vitest + supertest |
| API 文件 | swagger-jsdoc（OpenAPI 3.0.3） |

## 功能概覽

- **認證系統** — 註冊、登入、JWT 認證、個人資料
- **商品系統** — 前台商品列表（分頁）、商品詳情
- **購物車系統** — 雙模式認證（JWT / Session）、新增 / 修改 / 刪除
- **訂單系統** — 建立訂單（Transaction 扣庫存）、訂單列表、訂單詳情
- **線上付款** — ECPay 綠界金流串接（信用卡），含 QueryTradeInfo 查詢驗證
- **模擬付款** — ECPay 未設定時的 fallback 機制
- **後台管理** — 商品 CRUD（含刪除保護）、訂單管理（狀態篩選）
- **前端頁面** — 前台 7 頁 + 後台 2 頁 + 404 頁面

## 快速開始

### 環境需求

- Node.js 18+
- npm

### 安裝與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 複製並編輯環境變數
cp .env.example .env
# 編輯 .env，設定 JWT_SECRET（必填）

# 3. 啟動伺服器（含 CSS 建置）
npm start
```

伺服器預設於 **http://localhost:3001** 啟動，首次啟動會自動建立資料表並植入種子資料。

### 開發模式

```bash
# 終端 1：啟動伺服器
npm run dev:server

# 終端 2：CSS watch 模式
npm run dev:css
```

## 環境變數

| 變數 | 說明 | 必填 | 預設值 |
|------|------|:----:|--------|
| `JWT_SECRET` | JWT 簽名密鑰 | **是** | — |
| `PORT` | 伺服器埠號 | 否 | `3001` |
| `BASE_URL` | 伺服器基礎 URL | 否 | `http://localhost:3001` |
| `ECPAY_MERCHANT_ID` | 綠界商店代號 | 否 | `3002607`（測試） |
| `ECPAY_HASH_KEY` | 綠界 HashKey | 否 | `pwFHCqoQZGmho4w6`（測試） |
| `ECPAY_HASH_IV` | 綠界 HashIV | 否 | `EkRm7iFT261dpevs`（測試） |
| `ECPAY_ENV` | 綠界環境 | 否 | `staging` |

完整環境變數說明見 `.env.example`。

## ECPay 金流

本專案整合綠界 ECPay AIO 金流，付款流程：

```
用戶點擊「前往付款」→ 產生 ECPay 表單參數 → 跳轉綠界付款頁
→ 完成付款 → 導回訂單詳情頁 → 自動查詢付款結果 → 更新訂單狀態
```

> **注意**：專案運行於本地端，無法接收綠界 ReturnURL callback，因此付款結果透過 QueryTradeInfo API 主動查詢確認。若 ECPay 環境變數未設定，前端會自動顯示模擬付款按鈕作為 fallback。

### 測試付款

使用綠界測試環境的信用卡資訊：

| 項目 | 值 |
|------|-----|
| 卡號 | `4311-9522-2222-2222` |
| 有效期 | 任意未來日期 |
| CVV | `222` |
| 3DS 驗證碼 | `1234` |

## 預設帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 管理員 | `admin@hexschool.com` | `12345678` |

## API 路由

### 認證 (`/api/auth`)

| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/register` | — | 註冊 |
| POST | `/login` | — | 登入 |
| GET | `/profile` | JWT | 個人資料 |

### 商品 (`/api/products`)

| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | — | 商品列表（分頁） |
| GET | `/:id` | — | 商品詳情 |

### 購物車 (`/api/cart`)

| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | JWT / Session | 查看購物車 |
| POST | `/` | JWT / Session | 加入商品 |
| PATCH | `/:itemId` | JWT / Session | 修改數量 |
| DELETE | `/:itemId` | JWT / Session | 移除項目 |

### 訂單 (`/api/orders`)

| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/` | JWT | 建立訂單 |
| GET | `/` | JWT | 訂單列表 |
| GET | `/:id` | JWT | 訂單詳情 |
| PATCH | `/:id/pay` | JWT | 模擬付款 |
| POST | `/:id/payment` | JWT | 產生 ECPay 付款表單參數 |
| POST | `/:id/check-payment` | JWT | 查詢 ECPay 付款結果 |

### 後台管理

| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/api/admin/products` | JWT + Admin | 商品列表 |
| POST | `/api/admin/products` | JWT + Admin | 新增商品 |
| PUT | `/api/admin/products/:id` | JWT + Admin | 編輯商品 |
| DELETE | `/api/admin/products/:id` | JWT + Admin | 刪除商品 |
| GET | `/api/admin/orders` | JWT + Admin | 訂單列表（可篩選狀態） |
| GET | `/api/admin/orders/:id` | JWT + Admin | 訂單詳情 |

> 所有 API 回應格式統一為 `{ data, error, message }`。

## 測試

```bash
npm test
```

測試使用 Vitest + supertest，按固定順序執行（ecpay → auth → products → cart → orders → adminProducts → adminOrders），共 48 個測試案例。

## 常用指令

| 指令 | 說明 |
|------|------|
| `npm start` | 建置 CSS + 啟動伺服器 |
| `npm run dev:server` | 僅啟動伺服器 |
| `npm run dev:css` | Tailwind CSS watch |
| `npm run css:build` | 建置壓縮 CSS |
| `npm run openapi` | 產生 OpenAPI JSON |
| `npm test` | 執行測試套件 |

## 專案文件

| 文件 | 說明 |
|------|------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 架構、目錄結構、資料流 |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | 開發規範、命名規則 |
| [docs/FEATURES.md](./docs/FEATURES.md) | 功能列表與完成狀態 |
| [docs/TESTING.md](./docs/TESTING.md) | 測試規範與指南 |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | 更新日誌 |
