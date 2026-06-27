# 花卉電商網站 (backend-project)

一個全端花卉電商示範專案，提供前台商品瀏覽、購物車、訂單功能，以及後台商品與訂單管理介面。

## 技術棧

| 層級 | 技術 |
|------|------|
| 執行環境 | Node.js |
| 後端框架 | Express.js 4.x |
| 資料庫 | SQLite（透過 better-sqlite3，同步 API） |
| 模板引擎 | EJS 5.x（雙 layout：front / admin） |
| 樣式 | Tailwind CSS 4.x（透過 @tailwindcss/cli 建置） |
| 認證 | JWT（jsonwebtoken）+ bcrypt 密碼雜湊 |
| 測試 | Vitest + supertest |
| API 文件 | swagger-jsdoc（OpenAPI 3.0.3） |
| ID 產生 | uuid v4 |
| 跨域 | cors |

## 快速開始

```bash
# 1. 複製環境變數
cp .env.example .env

# 2. 編輯 .env，設定 JWT_SECRET（必填）
#    其他變數可維持預設值

# 3. 安裝依賴
npm install

# 4. 啟動伺服器（含 CSS 建置）
npm start

# 伺服器預設於 http://localhost:3001 啟動
```

### 開發模式

需要同時啟動兩個終端：

```bash
# 終端 1：啟動伺服器
npm run dev:server

# 終端 2：CSS watch 模式
npm run dev:css
```

### 執行測試

```bash
npm test
```

測試使用同一個 SQLite 資料庫，按照固定順序執行（auth → products → cart → orders → adminProducts → adminOrders）。

### 產生 OpenAPI 文件

```bash
npm run openapi
# 產出 openapi.json
```

## 預設帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| Admin | admin@hexschool.com | 12345678 |

啟動時會自動建立資料表並種子 admin 帳號與 8 筆示範花卉商品。

## 常用指令表

| 指令 | 說明 |
|------|------|
| `npm start` | 建置 CSS + 啟動伺服器 |
| `npm run dev:server` | 僅啟動伺服器 |
| `npm run dev:css` | Tailwind CSS watch |
| `npm run css:build` | 建置壓縮 CSS |
| `npm run openapi` | 產生 OpenAPI JSON |
| `npm test` | 執行測試套件 |

## 文件索引

| 文件 | 說明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架構、目錄結構、資料流 |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 開發規範、命名規則 |
| [FEATURES.md](./FEATURES.md) | 功能列表與完成狀態 |
| [TESTING.md](./TESTING.md) | 測試規範與指南 |
| [CHANGELOG.md](./CHANGELOG.md) | 更新日誌 |
