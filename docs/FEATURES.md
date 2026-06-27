# 功能清單與完成狀態

## 狀態說明

- ✅ 已完成
- 🚧 進行中
- ❌ 未實作

---

## 1. 認證系統 ✅

### 1.1 註冊 (`POST /api/auth/register`) ✅

使用者提供 email、password、name 進行註冊，成功後回傳 user 資訊與 JWT token。

**請求 body**：
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 必須符合 email 格式（正則驗證） |
| password | string | 是 | 最少 6 個字元 |
| name | string | 是 | 使用者名稱 |

**業務邏輯**：
- 驗證三個欄位皆存在，否則 400 `VALIDATION_ERROR`
- 驗證 email 格式（`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`），否則 400 `VALIDATION_ERROR`
- 驗證密碼長度 >= 6，否則 400 `VALIDATION_ERROR`
- 查詢 DB 確認 email 未被註冊，否則 409 `CONFLICT`
- bcrypt 雜湊密碼（salt rounds: 10）
- 產生 UUID v4 作為 user id
- 新增用戶，role 固定為 `'user'`
- 簽發 JWT（payload: `{ userId, email, role }`，有效期 7 天）
- 回傳 `{ user: { id, email, name, role }, token }`

**錯誤情境**：
| 狀態碼 | 錯誤代碼 | 情境 |
|--------|---------|------|
| 400 | VALIDATION_ERROR | 欄位缺失 / email 格式不正確 / 密碼太短 |
| 409 | CONFLICT | Email 已被註冊 |

### 1.2 登入 (`POST /api/auth/login`) ✅

**請求 body**：
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 登入 email |
| password | string | 是 | 登入密碼 |

**業務邏輯**：
- 驗證 email 和 password 皆存在，否則 400 `VALIDATION_ERROR`
- 查詢 DB 取得用戶（含 password_hash）
- 用戶不存在 → 401 `UNAUTHORIZED`（訊息："Email 或密碼錯誤"，不透露具體原因）
- bcrypt.compareSync 驗證密碼，不符合 → 401 `UNAUTHORIZED`
- 簽發 JWT（同註冊邏輯）
- 回傳 `{ user: { id, email, name, role }, token }`

### 1.3 取得個人資料 (`GET /api/auth/profile`) ✅

**認證**：需要 JWT Bearer Token

**業務邏輯**：
- 從 `req.user.userId` 查詢 DB 取得 `{ id, email, name, role, created_at }`
- 用戶不存在 → 404 `NOT_FOUND`

---

## 2. 商品系統 ✅

### 2.1 前台商品列表 (`GET /api/products`) ✅

**認證**：無

**查詢參數**：
| 參數 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| page | integer | 1 | 頁碼（最小 1） |
| limit | integer | 10 | 每頁筆數（最小 1，最大 100） |

**業務邏輯**：
- `page` 和 `limit` 使用 `parseInt` 解析，非數字時使用預設值
- `page` 透過 `Math.max(1, ...)` 確保最小為 1
- `limit` 透過 `Math.max(1, Math.min(100, ...))` 限制範圍
- 查詢 products 表，依 `created_at DESC` 排序
- 回傳 `{ products: [...], pagination: { total, page, limit, totalPages } }`

### 2.2 商品詳情 (`GET /api/products/:id`) ✅

**認證**：無

**業務邏輯**：
- 依 id 查詢 products 表
- 不存在 → 404 `NOT_FOUND`
- 回傳完整商品欄位

### 2.3 後台商品列表 (`GET /api/admin/products`) ✅

**認證**：JWT + admin

與前台商品列表邏輯相同，差別在於需要管理員權限。

### 2.4 新增商品 (`POST /api/admin/products`) ✅

**認證**：JWT + admin

**請求 body**：
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| name | string | 是 | 商品名稱 |
| description | string | 否 | 商品描述（預設 null） |
| price | integer | 是 | 價格（必須為正整數） |
| stock | integer | 是 | 庫存（必須為非負整數） |
| image_url | string | 否 | 商品圖片 URL（預設 null） |

**業務邏輯**：
- 驗證 name 存在，否則 400
- 驗證 price 為正整數（`Number.isInteger(price) && price > 0`），否則 400
- 驗證 stock 為非負整數（`Number.isInteger(stock) && stock >= 0`），否則 400
- 產生 UUID v4，插入 products 表
- 回傳新建商品完整資料

### 2.5 編輯商品 (`PUT /api/admin/products/:id`) ✅

**認證**：JWT + admin

**請求 body**：所有欄位皆為選填，未提供的欄位保持原值。

**業務邏輯**：
- 查詢商品是否存在，不存在 → 404
- 若提供 name 且為空字串 → 400
- 若提供 price 且非正整數 → 400
- 若提供 stock 且非非負整數 → 400
- 合併更新：未提供的欄位使用 `existing.xxx`
- 更新時同時更新 `updated_at = datetime('now')`

### 2.6 刪除商品 (`DELETE /api/admin/products/:id`) ✅

**認證**：JWT + admin

**業務邏輯**：
- 查詢商品是否存在，不存在 → 404
- 查詢是否有 pending 狀態的訂單包含此商品（join order_items + orders）
- 有 pending 訂單 → 409 `CONFLICT`（"此商品存在未完成的訂單，無法刪除"）
- 無 pending 訂單 → 刪除商品

---

## 3. 購物車系統 ✅

### 3.1 查看購物車 (`GET /api/cart`) ✅

**認證**：雙模式（JWT 或 X-Session-Id）

**業務邏輯**：
- 根據認證模式決定查詢條件（`user_id` 或 `session_id`）
- JOIN products 表取得商品名稱、價格、庫存、圖片
- 計算 total（所有項目的 price * quantity 總和）
- 回傳 `{ items: [{ id, product_id, quantity, product: { name, price, stock, image_url } }], total }`

### 3.2 加入商品到購物車 (`POST /api/cart`) ✅

**認證**：雙模式

**請求 body**：
| 欄位 | 型別 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| productId | string | 是 | 無 | 商品 ID |
| quantity | integer | 否 | 1 | 數量（正整數） |

**業務邏輯**（重要 — 累加機制）：
- 驗證 productId 存在，否則 400
- 驗證 quantity 為正整數，否則 400
- 查詢商品是否存在，不存在 → 404
- 查詢購物車中是否已有此商品：
  - **已存在**：累加數量（`existingItem.quantity + qty`）
    - 若累加後超過庫存 → 400 `STOCK_INSUFFICIENT`
    - 否則 UPDATE 購物車數量
  - **不存在**：檢查 qty 是否超過庫存
    - 超過 → 400 `STOCK_INSUFFICIENT`
    - 否則 INSERT 新購物車項目
- 回傳 `{ id, product_id, quantity }`（quantity 為更新後的總量）

### 3.3 修改購物車商品數量 (`PATCH /api/cart/:itemId`) ✅

**認證**：雙模式

**請求 body**：
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| quantity | integer | 是 | 新數量（正整數，非累加，直接替換） |

**業務邏輯**：
- 驗證 quantity 為正整數
- 查詢購物車項目（需匹配 owner），不存在 → 404
- 查詢商品庫存，新數量超過庫存 → 400 `STOCK_INSUFFICIENT`
- 直接更新為新數量（注意：與 POST 的累加不同，PATCH 是直接設定）

### 3.4 移除購物車項目 (`DELETE /api/cart/:itemId`) ✅

**認證**：雙模式

**業務邏輯**：
- 查詢購物車項目（需匹配 owner），不存在 → 404
- 刪除該項目

---

## 4. 訂單系統 ✅

### 4.1 建立訂單 (`POST /api/orders`) ✅

**認證**：JWT（僅登入用戶可建立訂單，不支援 session 模式）

**請求 body**：
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| recipientName | string | 是 | 收件人姓名 |
| recipientEmail | string | 是 | 收件人 email（需符合格式） |
| recipientAddress | string | 是 | 收件地址 |

**業務邏輯**（含 Transaction）：
1. 驗證三個收件欄位皆存在，否則 400
2. 驗證 recipientEmail 格式
3. 查詢該用戶的購物車項目（JOIN products 取得即時價格與庫存）
4. 購物車為空 → 400 `CART_EMPTY`
5. 逐項檢查庫存，任一不足 → 400 `STOCK_INSUFFICIENT`（訊息列出所有不足商品名稱）
6. 計算訂單總金額（所有項目的 product_price * quantity）
7. 在 **Transaction** 中執行：
   - INSERT orders（產生訂單編號 `ORD-YYYYMMDD-XXXXX`）
   - 逐項 INSERT order_items（快照商品名稱與價格）
   - 逐項 UPDATE products 扣除庫存（`stock = stock - quantity`）
   - DELETE 該用戶的所有 cart_items（清空購物車）
8. 回傳訂單資訊 `{ id, order_no, total_amount, status: 'pending', items, created_at }`

**訂單編號格式**：`ORD-YYYYMMDD-XXXXX`（XXXXX 為 UUID 前 5 碼大寫）

### 4.2 訂單列表 (`GET /api/orders`) ✅

**認證**：JWT

**業務邏輯**：
- 查詢該用戶的所有訂單（`WHERE user_id = ?`）
- 依 `created_at DESC` 排序
- 回傳 `{ orders: [{ id, order_no, total_amount, status, created_at }] }`
- 注意：無分頁功能

### 4.3 訂單詳情 (`GET /api/orders/:id`) ✅

**認證**：JWT

**業務邏輯**：
- 查詢訂單（`WHERE id = ? AND user_id = ?`，確保只能看自己的訂單）
- 不存在 → 404
- 查詢 order_items
- 回傳訂單完整資訊（含 items）

### 4.4 模擬付款 (`PATCH /api/orders/:id/pay`) ✅

**認證**：JWT

**請求 body**：
| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| action | string | 是 | `"success"` 或 `"fail"` |

**業務邏輯**：
- 驗證 action 為 `"success"` 或 `"fail"`，否則 400
- 查詢訂單（需匹配 user_id），不存在 → 404
- 訂單狀態不是 `"pending"` → 400 `INVALID_STATUS`
- 更新狀態：`success` → `"paid"`，`fail` → `"failed"`
- 回傳更新後的訂單（含 items）

### 4.5 後台訂單列表 (`GET /api/admin/orders`) ✅

**認證**：JWT + admin

**查詢參數**：
| 參數 | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| page | integer | 1 | 頁碼 |
| limit | integer | 10 | 每頁筆數（最大 100） |
| status | string | 無 | 篩選狀態（pending / paid / failed） |

**業務邏輯**：
- 若提供 status 且為合法值，加入 WHERE 條件
- 支援分頁
- 回傳所有用戶的訂單（不限於當前用戶）

### 4.6 後台訂單詳情 (`GET /api/admin/orders/:id`) ✅

**認證**：JWT + admin

**業務邏輯**：
- 查詢訂單（不限 user_id，管理員可查看所有訂單）
- 查詢 order_items
- 查詢下單用戶的 `{ name, email }`
- 回傳 `{ ...order, items, user }`

---

## 5. 前端頁面 ✅

| 路由 | 頁面 | Layout | 說明 |
|------|------|--------|------|
| `/` | index.ejs | front | 首頁（商品列表） |
| `/products/:id` | product-detail.ejs | front | 商品詳情 |
| `/cart` | cart.ejs | front | 購物車 |
| `/checkout` | checkout.ejs | front | 結帳 |
| `/login` | login.ejs | front | 登入 |
| `/orders` | orders.ejs | front | 我的訂單 |
| `/orders/:id` | order-detail.ejs | front | 訂單詳情 |
| `/admin/products` | admin/products.ejs | admin | 後台商品管理 |
| `/admin/orders` | admin/orders.ejs | admin | 後台訂單管理 |

---

## 6. 金流整合（ECPay） ✅

### 6.1 ECPay AIO 金流 ✅

使用綠界全方位金流 AIO（CMV-SHA256）方案，消費者跳轉至綠界標準付款頁完成付款。

**付款流程**：
1. 用戶在訂單詳情頁點擊「前往付款」
2. 前端呼叫 `POST /api/orders/:id/payment` 取得 ECPay 表單參數
3. 前端動態建立 form 並提交至綠界付款頁
4. 付款完成後綠界透過 ClientBackURL 導回訂單詳情頁
5. 前端自動呼叫 `POST /api/orders/:id/check-payment` 查詢付款結果
6. 後端呼叫綠界 QueryTradeInfo API 驗證付款狀態並更新訂單

**限制**：本專案運行於本地端，無法接收綠界 ReturnURL callback，因此改用 QueryTradeInfo 主動查詢。

**API 端點**：
| 方法 | 路徑 | 認證 | 說明 |
|------|------|------|------|
| POST | `/api/orders/:id/payment` | JWT | 產生 ECPay 付款表單參數 |
| POST | `/api/orders/:id/check-payment` | JWT | 查詢 ECPay 付款結果 |

**Fallback**：若 ECPay 環境變數未設定，前端自動顯示模擬付款按鈕。

### 6.2 模擬付款（保留） ✅

透過 `PATCH /api/orders/:id/pay` 傳入 `{ action: "success" | "fail" }` 更新訂單狀態，作為 ECPay 未設定時的替代方案。
