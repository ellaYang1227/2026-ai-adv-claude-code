# 開發規範

## 命名規則對照表

| 類別 | 規則 | 範例 |
|------|------|------|
| 檔案名稱（路由） | camelCase | `authRoutes.js`, `adminProductRoutes.js` |
| 檔案名稱（middleware） | camelCase | `authMiddleware.js`, `errorHandler.js` |
| 檔案名稱（測試） | camelCase + `.test.js` | `auth.test.js`, `adminOrders.test.js` |
| 檔案名稱（前端 JS） | kebab-case | `header-init.js`, `admin-products.js` |
| 檔案名稱（EJS 頁面） | kebab-case | `product-detail.ejs`, `order-detail.ejs` |
| 資料庫表名 | snake_case（複數） | `users`, `cart_items`, `order_items` |
| 資料庫欄位 | snake_case | `password_hash`, `created_at`, `image_url` |
| API 路由 | kebab-case（複數名詞） | `/api/products`, `/api/admin/orders` |
| API 請求 body 欄位 | camelCase | `productId`, `recipientName`, `recipientEmail` |
| API 回應 data 欄位 | snake_case（保持 DB 原始欄位名） | `product_id`, `total_amount`, `created_at` |
| JavaScript 變數/函式 | camelCase | `getAdminToken`, `dualAuth`, `getOwnerCondition` |
| 環境變數 | UPPER_SNAKE_CASE | `JWT_SECRET`, `ADMIN_EMAIL`, `ECPAY_HASH_KEY` |

**重要注意事項**：API 請求 body 使用 camelCase（如 `productId`），但 API 回應中的資料直接使用資料庫的 snake_case 欄位名（如 `product_id`）。這是目前的專案慣例，新增 API 時須遵循。

## 模組系統

本專案使用 **CommonJS**（`require` / `module.exports`），不使用 ESM。唯一的例外是 `vitest.config.js` 使用 ESM 語法（`import` / `export default`），因 Vitest 要求。

### 依賴關係

```
server.js → app.js → src/database.js（初始化 DB，匯出 db 實例）
                    → src/middleware/*（各 middleware）
                    → src/routes/*（各路由，內部各自 require database + middleware）
```

所有路由檔案直接 `require('../database')` 取得 db 實例，使用 better-sqlite3 的同步 API 執行查詢。

## 新增 API 路由步驟

1. 在 `src/routes/` 建立路由檔案（命名：`<功能>Routes.js`）
2. 使用 `express.Router()` 建立路由
3. 在檔案頂部加入 `@openapi` JSDoc 註解（供 swagger-jsdoc 產生文件）
4. 回應格式統一為 `{ data, error, message }`
5. 在 `app.js` 中 `app.use('/api/<prefix>', require('./src/routes/<功能>Routes'))` 掛載
6. 若需認證，在路由或 router 層級使用：
   - 一般用戶：`authMiddleware`
   - 管理員：`authMiddleware, adminMiddleware`
   - 購物車雙模式：自行實作或引用 `dualAuth`（目前寫在 cartRoutes.js 內部，未抽為公用）

## 新增 Middleware 步驟

1. 在 `src/middleware/` 建立檔案（命名：`<功能>Middleware.js`）
2. 匯出一個 `(req, res, next)` 函式
3. 錯誤回應使用統一格式 `{ data: null, error: '<CODE>', message: '<訊息>' }`
4. 全域 middleware 在 `app.js` 中 `app.use()` 掛載
5. 路由級 middleware 在路由檔案中 `router.use()` 或個別路由參數掛載

## 新增資料庫表步驟

1. 在 `src/database.js` 的 `initializeDatabase()` 函式中的 `db.exec()` 區塊加入 `CREATE TABLE IF NOT EXISTS` SQL
2. 啟用適當的約束（NOT NULL、CHECK、FOREIGN KEY）
3. ID 欄位使用 `TEXT PRIMARY KEY`，值為 UUID v4
4. 時間欄位使用 `TEXT NOT NULL DEFAULT (datetime('now'))`
5. 若需要 seed 資料，在 `initializeDatabase()` 中新增對應的 seed 函式
6. 刪除 `database.sqlite` 重啟伺服器即可重新初始化

## 環境變數

| 變數 | 用途 | 必填 | 預設值 |
|------|------|------|--------|
| `JWT_SECRET` | JWT 簽名密鑰 | **是**（server.js 啟動時檢查） | 無 |
| `PORT` | 伺服器埠號 | 否 | `3001` |
| `BASE_URL` | 伺服器基礎 URL | 否 | `http://localhost:3001` |
| `FRONTEND_URL` | 前端 URL（CORS origin） | 否 | `http://localhost:5173` |
| `ADMIN_EMAIL` | 種子 admin 帳號 email | 否 | `admin@hexschool.com` |
| `ADMIN_PASSWORD` | 種子 admin 帳號密碼 | 否 | `12345678` |
| `ECPAY_MERCHANT_ID` | 綠界商店代號 | 否（尚未實作） | `3002607` |
| `ECPAY_HASH_KEY` | 綠界 HashKey | 否（尚未實作） | `pwFHCqoQZGmho4w6` |
| `ECPAY_HASH_IV` | 綠界 HashIV | 否（尚未實作） | `EkRm7iFT261dpevs` |
| `ECPAY_ENV` | 綠界環境（staging/production） | 否（尚未實作） | `staging` |
| `NODE_ENV` | Node 環境 | 否 | 無（影響 bcrypt salt rounds：test=1, 其他=10） |

## OpenAPI / Swagger JSDoc 格式

每個 API 路由上方使用 `@openapi` 註解，範例：

```javascript
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: 取得商品列表
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 message:
 *                   type: string
 */
```

- `tags` 使用中括號語法 `[TagName]`
- 需要認證的 API 加上 `security` 區塊：
  - JWT：`- bearerAuth: []`
  - Session：`- sessionId: []`
- 執行 `npm run openapi` 可從這些註解產生 `openapi.json`

## 計畫歸檔流程

1. 計畫檔案命名格式：`YYYY-MM-DD-<feature-name>.md`
2. 計畫文件結構：User Story → Spec → Tasks
3. 功能完成後：移至 `docs/plans/archive/`
4. 更新 `docs/FEATURES.md` 和 `docs/CHANGELOG.md`
