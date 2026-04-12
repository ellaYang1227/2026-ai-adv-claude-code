# 架構文件

## 目錄結構

```
.
├── app.js                     # Express 應用程式設定（middleware、路由掛載、404/錯誤處理）
├── server.js                  # 伺服器啟動入口（讀取 PORT、檢查 JWT_SECRET、啟動 listen）
├── database.sqlite            # SQLite 資料庫檔案（gitignore，啟動自動建立）
├── package.json               # 依賴與 npm scripts
├── vitest.config.js           # Vitest 測試設定（ESM，定義測試順序）
├── swagger-config.js          # Swagger/OpenAPI 設定（API info + securitySchemes）
├── generate-openapi.js        # 從 swagger-jsdoc 產生 openapi.json 靜態檔
├── .env.example               # 環境變數範本
├── .gitignore                 # Git 忽略規則
│
├── src/
│   ├── database.js            # 資料庫初始化（建表、seed admin + 商品資料、匯出 db 實例）
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT Bearer Token 驗證，解析 req.user
│   │   ├── adminMiddleware.js     # 檢查 req.user.role === 'admin'，否則 403
│   │   ├── sessionMiddleware.js   # 從 X-Session-Id header 讀取 req.sessionId（全域掛載）
│   │   └── errorHandler.js        # 全域錯誤處理，安全訊息映射，避免洩漏內部細節
│   └── routes/
│       ├── authRoutes.js          # 註冊、登入、取得個人資料
│       ├── productRoutes.js       # 前台商品列表（分頁）、商品詳情
│       ├── cartRoutes.js          # 購物車 CRUD（雙模式認證：JWT / Session）
│       ├── orderRoutes.js         # 建立訂單、訂單列表、訂單詳情、模擬付款
│       ├── adminProductRoutes.js  # 後台商品 CRUD（需 admin 權限）
│       ├── adminOrderRoutes.js    # 後台訂單列表（可篩選狀態）、訂單詳情
│       └── pageRoutes.js          # EJS 頁面路由（前台 7 頁 + 後台 2 頁）
│
├── views/
│   ├── layouts/
│   │   ├── front.ejs          # 前台 layout（含 header/footer/notification）
│   │   └── admin.ejs          # 後台 layout（含 sidebar/admin-header）
│   ├── pages/
│   │   ├── index.ejs          # 首頁（商品列表）
│   │   ├── product-detail.ejs # 商品詳情頁
│   │   ├── cart.ejs           # 購物車頁
│   │   ├── checkout.ejs       # 結帳頁
│   │   ├── login.ejs          # 登入頁
│   │   ├── orders.ejs         # 我的訂單頁
│   │   ├── order-detail.ejs   # 訂單詳情頁
│   │   ├── 404.ejs            # 404 頁面
│   │   └── admin/
│   │       ├── products.ejs   # 後台商品管理頁
│   │       └── orders.ejs     # 後台訂單管理頁
│   └── partials/
│       ├── head.ejs           # HTML head（meta、CSS link）
│       ├── header.ejs         # 前台導覽列
│       ├── footer.ejs         # 前台頁尾
│       ├── notification.ejs   # 通知元件
│       ├── admin-header.ejs   # 後台頂部導覽列
│       └── admin-sidebar.ejs  # 後台側邊欄
│
├── public/
│   ├── css/
│   │   ├── input.css          # Tailwind CSS 輸入檔
│   │   └── output.css         # 建置產出（gitignore）
│   ├── stylesheets/
│   │   └── style.css          # 額外自定義樣式
│   └── js/
│       ├── api.js             # 前端 API 封裝（fetch wrapper）
│       ├── auth.js            # 前端認證邏輯（token 管理）
│       ├── header-init.js     # 導覽列初始化（登入狀態切換）
│       ├── notification.js    # 通知元件邏輯
│       └── pages/
│           ├── index.js           # 首頁邏輯
│           ├── product-detail.js  # 商品詳情頁邏輯
│           ├── cart.js            # 購物車頁邏輯
│           ├── checkout.js        # 結帳頁邏輯
│           ├── login.js           # 登入頁邏輯
│           ├── orders.js          # 訂單列表頁邏輯
│           ├── order-detail.js    # 訂單詳情頁邏輯
│           ├── admin-products.js  # 後台商品管理邏輯
│           └── admin-orders.js    # 後台訂單管理邏輯
│
├── tests/
│   ├── setup.js               # 測試輔助（app 實例、request、getAdminToken、registerUser）
│   ├── auth.test.js           # 認證 API 測試
│   ├── products.test.js       # 商品 API 測試
│   ├── cart.test.js           # 購物車 API 測試
│   ├── orders.test.js         # 訂單 API 測試
│   ├── adminProducts.test.js  # 後台商品 API 測試
│   └── adminOrders.test.js    # 後台訂單 API 測試
│
└── docs/
    ├── README.md              # 項目介紹與快速開始
    ├── ARCHITECTURE.md        # 本文件
    ├── DEVELOPMENT.md         # 開發規範
    ├── FEATURES.md            # 功能清單
    ├── TESTING.md             # 測試指南
    ├── CHANGELOG.md           # 更新日誌
    └── plans/
        └── archive/           # 已完成計畫歸檔
```

## 啟動流程

1. `server.js` 被執行，先 `require('./app')` 載入應用程式
2. `app.js` 頂部 `require('dotenv').config()` 載入 `.env` 環境變數
3. `app.js` 中 `require('./src/database')` 觸發資料庫初始化：
   - 開啟（或建立）`database.sqlite`
   - 啟用 WAL 模式與 foreign_keys
   - `initializeDatabase()` 建立 5 張資料表（users, products, cart_items, orders, order_items）
   - `seedAdminUser()` 檢查並建立 admin 帳號
   - `seedProducts()` 若 products 表為空則插入 8 筆示範花卉商品
4. 掛載全域 middleware：cors → json → urlencoded → sessionMiddleware
5. 掛載 API 路由（6 組）與頁面路由（1 組）
6. 掛載 404 handler（API 回 JSON，頁面回 EJS 404 頁）與全域 errorHandler
7. `server.js` 檢查 `JWT_SECRET` 環境變數存在後，呼叫 `app.listen(PORT)`

## API 路由總覽

| 前綴 | 路由檔案 | 認證 | 說明 |
|------|---------|------|------|
| `/api/auth` | `authRoutes.js` | 部分（profile 需 JWT） | 註冊、登入、個人資料 |
| `/api/products` | `productRoutes.js` | 無 | 前台商品列表（分頁）、詳情 |
| `/api/cart` | `cartRoutes.js` | 雙模式（JWT 或 X-Session-Id） | 購物車 CRUD |
| `/api/orders` | `orderRoutes.js` | JWT | 建立訂單、列表、詳情、模擬付款 |
| `/api/admin/products` | `adminProductRoutes.js` | JWT + admin | 後台商品 CRUD |
| `/api/admin/orders` | `adminOrderRoutes.js` | JWT + admin | 後台訂單列表（可篩選）、詳情 |
| `/` | `pageRoutes.js` | 無 | EJS 頁面渲染（前台 7 頁 + 後台 2 頁） |

### API 端點明細

#### Auth (`/api/auth`)
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/register` | 無 | 註冊新帳號 |
| POST | `/login` | 無 | 登入 |
| GET | `/profile` | JWT | 取得個人資料 |

#### Products (`/api/products`)
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | 無 | 商品列表（支援 page、limit 查詢參數） |
| GET | `/:id` | 無 | 商品詳情 |

#### Cart (`/api/cart`)
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | 雙模式 | 查看購物車 |
| POST | `/` | 雙模式 | 加入商品到購物車 |
| PATCH | `/:itemId` | 雙模式 | 修改購物車商品數量 |
| DELETE | `/:itemId` | 雙模式 | 移除購物車項目 |

#### Orders (`/api/orders`)
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/` | JWT | 從購物車建立訂單 |
| GET | `/` | JWT | 自己的訂單列表 |
| GET | `/:id` | JWT | 訂單詳情 |
| PATCH | `/:id/pay` | JWT | 模擬付款（success / fail） |

#### Admin Products (`/api/admin/products`)
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | JWT + admin | 後台商品列表（支援分頁） |
| POST | `/` | JWT + admin | 新增商品 |
| PUT | `/:id` | JWT + admin | 編輯商品（部分更新） |
| DELETE | `/:id` | JWT + admin | 刪除商品（有 pending 訂單時拒絕） |

#### Admin Orders (`/api/admin/orders`)
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| GET | `/` | JWT + admin | 後台訂單列表（可依 status 篩選，支援分頁） |
| GET | `/:id` | JWT + admin | 後台訂單詳情（含 user 資訊） |

## 統一回應格式

所有 API 回應皆遵循以下 JSON 結構：

```json
{
  "data": { ... },    // 成功時為物件或陣列；失敗時為 null
  "error": null,       // 成功時為 null；失敗時為錯誤代碼字串
  "message": "成功"    // 人類可讀訊息
}
```

### 錯誤代碼對照表

| 錯誤代碼 | HTTP 狀態碼 | 說明 |
|---------|------------|------|
| `VALIDATION_ERROR` | 400 | 參數缺失或格式錯誤 |
| `UNAUTHORIZED` | 401 | 未登入或 token 無效 |
| `FORBIDDEN` | 403 | 權限不足（非 admin） |
| `NOT_FOUND` | 404 | 資源不存在 |
| `CONFLICT` | 409 | 資源衝突（如 email 重複、商品有 pending 訂單） |
| `STOCK_INSUFFICIENT` | 400 | 庫存不足 |
| `CART_EMPTY` | 400 | 購物車為空 |
| `INVALID_STATUS` | 400 | 訂單狀態不符（例如已付款的訂單再次付款） |
| `INTERNAL_ERROR` | 500 | 伺服器內部錯誤（不洩漏內部細節） |

## 認證與授權機制

### JWT 認證 (`authMiddleware.js`)

- **Header 格式**：`Authorization: Bearer <token>`
- **演算法**：HS256
- **Payload**：`{ userId, email, role }`
- **有效期**：7 天（`expiresIn: '7d'`）
- **行為**：解析 token → 查詢 DB 確認 user 存在 → 設定 `req.user = { userId, email, role }` → 呼叫 `next()`
- **失敗回應**：401 UNAUTHORIZED

### Admin 授權 (`adminMiddleware.js`)

- 前置條件：必須先通過 `authMiddleware`
- **行為**：檢查 `req.user.role === 'admin'`，否則回傳 403 FORBIDDEN
- 使用方式：`router.use(authMiddleware, adminMiddleware)`

### 雙模式認證 (`cartRoutes.js` 的 `dualAuth`)

購物車支援兩種身份識別方式，流程如下：

1. 檢查 `Authorization` header 是否存在且以 `Bearer ` 開頭
2. **有 Bearer Token**：嘗試驗證 JWT
   - Token 有效 → 設定 `req.user`，以 `user_id` 識別購物車
   - Token 無效 → **立即回 401**（不退回 session 模式）
3. **無 Bearer Token**：檢查 `req.sessionId`（由 sessionMiddleware 從 `X-Session-Id` header 設定）
   - 有 sessionId → 以 `session_id` 識別購物車
   - 無 sessionId → 回 401

關鍵設計：一旦提供了 Bearer Token 就只走 JWT 路線；只有完全沒提供 Authorization header 時才退回 session 模式。

### Session Middleware (`sessionMiddleware.js`)

- 全域掛載於所有路由之前
- 從 `X-Session-Id` header 讀取值，設定至 `req.sessionId`
- 不做驗證、不做儲存，僅為直通 (passthrough)

## 資料庫 Schema

使用 SQLite + better-sqlite3（同步 API），啟用 WAL 模式和 foreign_keys。

### users

| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| email | TEXT | UNIQUE NOT NULL | 登入 email |
| password_hash | TEXT | NOT NULL | bcrypt 雜湊（salt rounds: 正式 10，測試 1） |
| name | TEXT | NOT NULL | 使用者名稱 |
| role | TEXT | NOT NULL DEFAULT 'user', CHECK('user','admin') | 角色 |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | 建立時間 |

### products

| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | NOT NULL | 商品名稱 |
| description | TEXT | 可空 | 商品描述 |
| price | INTEGER | NOT NULL, CHECK(price > 0) | 價格（整數，單位：元） |
| stock | INTEGER | NOT NULL DEFAULT 0, CHECK(stock >= 0) | 庫存數量 |
| image_url | TEXT | 可空 | 商品圖片 URL |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | 建立時間 |
| updated_at | TEXT | NOT NULL DEFAULT datetime('now') | 更新時間 |

### cart_items

| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| session_id | TEXT | 可空 | 訪客 session 識別 |
| user_id | TEXT | 可空, FK → users(id) | 登入用戶識別 |
| product_id | TEXT | NOT NULL, FK → products(id) | 商品 ID |
| quantity | INTEGER | NOT NULL DEFAULT 1, CHECK(quantity > 0) | 數量 |

**設計重點**：`session_id` 和 `user_id` 二擇一，對應雙模式認證。

### orders

| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| order_no | TEXT | UNIQUE NOT NULL | 訂單編號（格式：`ORD-YYYYMMDD-XXXXX`） |
| user_id | TEXT | NOT NULL, FK → users(id) | 下單用戶 |
| recipient_name | TEXT | NOT NULL | 收件人姓名 |
| recipient_email | TEXT | NOT NULL | 收件人 email |
| recipient_address | TEXT | NOT NULL | 收件地址 |
| total_amount | INTEGER | NOT NULL | 訂單總金額 |
| status | TEXT | NOT NULL DEFAULT 'pending', CHECK('pending','paid','failed') | 訂單狀態 |
| created_at | TEXT | NOT NULL DEFAULT datetime('now') | 建立時間 |

### order_items

| 欄位 | 型別 | 約束 | 說明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| order_id | TEXT | NOT NULL, FK → orders(id) | 訂單 ID |
| product_id | TEXT | NOT NULL | 商品 ID（快照，非 FK） |
| product_name | TEXT | NOT NULL | 商品名稱快照 |
| product_price | INTEGER | NOT NULL | 商品價格快照 |
| quantity | INTEGER | NOT NULL | 數量 |

**設計重點**：order_items 儲存下單時的商品名稱與價格快照，不受後續商品修改影響。product_id 欄位雖無 FK 約束聲明但在 CREATE TABLE 中有 `FOREIGN KEY (product_id) REFERENCES products(id)`（注意：若商品被刪除，歷史訂單的 product_id 仍保留）。

## 金流整合（ECPay）

`.env.example` 中定義了 ECPay 綠界金流的設定（`ECPAY_MERCHANT_ID`、`ECPAY_HASH_KEY`、`ECPAY_HASH_IV`、`ECPAY_ENV=staging`），但目前程式碼中**尚未實作**實際的 ECPay 串接。

目前的付款機制為**模擬付款**：透過 `PATCH /api/orders/:id/pay` 傳入 `{ action: "success" | "fail" }` 直接更新訂單狀態，不經過真實金流。

## 頁面渲染架構

使用 EJS 模板引擎搭配手動 layout 機制（非 express-ejs-layouts 套件）：

1. `pageRoutes.js` 中的 `renderFront()` / `renderAdmin()` 先渲染頁面內容為 HTML 字串（`body`）
2. 再將 `body` 傳入對應的 layout（`layouts/front.ejs` 或 `layouts/admin.ejs`）進行最終渲染
3. 每個頁面路由可指定 `pageScript` 參數，layout 根據此參數載入 `public/js/pages/<pageScript>.js`
