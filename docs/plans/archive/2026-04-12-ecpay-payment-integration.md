# ECPay 綠界金流 AIO 串接計畫

## Context

本專案（花卉電商）目前的付款機制為**模擬付款**（`PATCH /api/orders/:id/pay`），需整合綠界 ECPay AIO 金流實現真實線上付款。

**核心限制**：專案僅運行於本地端，無法接收綠界的 Server-to-Server ReturnURL callback。因此付款結果改由前端主動呼叫 **QueryTradeInfo API** 查詢驗證。

## 付款流程

```
1. 用戶在訂單詳情頁點擊「前往付款」
2. 前端呼叫 POST /api/orders/:id/payment → 取得 ECPay 表單參數
3. 前端動態建立 form 並 submit → 瀏覽器導向綠界付款頁
4. 用戶在綠界完成付款
5. 綠界透過 ClientBackURL 導回 /orders/:id?payment=check
6. 前端偵測 payment=check → 呼叫 POST /api/orders/:id/check-payment
7. 後端呼叫 QueryTradeInfo API 查詢付款狀態
8. TradeStatus=1 → 更新訂單為 paid；其他 → 保持 pending 或標記 failed
9. 前端顯示付款結果
```

## 實作步驟

### Step 1：建立 `src/services/ecpayService.js`

新建檔案，使用 Node.js 內建 `crypto` 模組，不需額外套件。

**函式清單：**
| 函式 | 說明 |
|------|------|
| `ecpayUrlEncode(str)` | ECPay 專用 URL 編碼（encodeURIComponent → %20→+ → ~→%7e → '→%27 → lowercase → .NET 字元還原） |
| `generateCheckMacValue(params, hashKey, hashIV)` | 產生 CheckMacValue (SHA256) |
| `verifyCheckMacValue(params, hashKey, hashIV)` | timing-safe 驗證 CheckMacValue |
| `getEcpayConfig()` | 讀取環境變數，回傳設定物件（未設定時回傳 null） |
| `toMerchantTradeNo(orderNo)` | 將 `ORD-YYYYMMDD-XXXXX` 去除 dash → `ORDYYYYMMDDXXXXX`（17 字元） |
| `getMerchantTradeDate()` | 產生 UTC+8 格式 `yyyy/MM/dd HH:mm:ss` |
| `buildPaymentFormParams(order, items, baseUrl)` | 組合 AIO 表單所有參數（含 CheckMacValue） |
| `queryTradeInfo(merchantTradeNo)` | 呼叫 QueryTradeInfo API，回傳解析後的結果物件 |

**關鍵規則（依 ECPay skill）：**
- CheckMacValue 排序為 key 不區分大小寫的字典序
- ItemName 截斷至 200 字元（避免 UTF-8 截斷造成 CheckMacValue 不符）
- TimeStamp 為 Unix 秒數（非毫秒），有效期僅 3 分鐘
- 驗證必須使用 `crypto.timingSafeEqual`，禁止 `===`

### Step 2：資料庫遷移 — `src/database.js`

在 `initializeDatabase()` 中新增 migration，為 orders 表增加兩個欄位：

```sql
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN paid_at TEXT DEFAULT NULL;
```

使用 `pragma('table_info(orders)')` 檢查欄位是否已存在再執行，確保冪等。

### Step 3：新增 API 端點 — `src/routes/orderRoutes.js`

**新增端點 1：`POST /:id/payment`**（產生 ECPay 付款表單參數）
- 驗證：訂單存在、屬於當前用戶、狀態為 pending
- 呼叫 `buildPaymentFormParams` 產生參數
- 回傳 `{ data: { actionUrl, params }, error: null, message: '請前往綠界付款' }`

**新增端點 2：`POST /:id/check-payment`**（查詢付款結果）
- 驗證：訂單存在、屬於當前用戶
- 若已非 pending 狀態，直接回傳當前訂單
- 呼叫 `queryTradeInfo` 查詢 ECPay
- 依 TradeStatus 更新訂單狀態（使用 `WHERE status = 'pending'` 確保冪等）
- 回傳更新後的訂單資料

**修改現有模擬付款端點 `PATCH /:id/pay`：**
- 更新時同時設定 `payment_method = 'simulated'`、`paid_at = datetime('now')`

### Step 4：更新前端 — `public/js/pages/order-detail.js`

- 新增 `goToEcpay()` — 呼叫 payment API，動態建立 form 並 submit 至綠界
- 新增 `checkPayment()` — 呼叫 check-payment API，更新頁面顯示
- `onMounted` 中偵測 `paymentResult === 'check'` 時自動呼叫 `checkPayment()`
- 若 API 回傳 `PAYMENT_NOT_CONFIGURED` 錯誤，退回顯示模擬付款按鈕
- 新增 `paymentMessages.pending` 和 `paymentMessages.check` 訊息

### Step 5：更新 EJS 模板 — `views/pages/order-detail.ejs`

- 主要按鈕改為「前往付款」（呼叫 `goToEcpay`）
- 模擬付款按鈕改為 fallback（當 ECPay 未設定時顯示）
- 新增「正在查詢付款狀態」的提示訊息

### Step 6：新增測試 — `tests/ecpay.test.js`

使用 ECPay skill 提供的 test vectors 驗證 CheckMacValue 實作：
- SHA256 基本測試（AIO 標準參數）→ 預期 `291CBA3...`
- 特殊字元 `'` 測試 → 預期 `CF0A3D4...`
- 特殊字元 `~` 測試 → 預期 `CEEAE01...`
- 空格處理測試（%20 vs +）→ 預期 `7712A5E...`
- Callback 驗證測試 → 預期 `2AB536D...`

在 `vitest.config.js` 的 sequence 中加入 ecpay.test.js（放在 orders.test.js 之前，無資料依賴）。

### Step 7：更新文件

| 文件 | 更新內容 |
|------|---------|
| `docs/ARCHITECTURE.md` | 目錄結構加入 services/；API 路由表加入新端點；orders schema 加入新欄位；新增 ECPay 付款流程說明 |
| `docs/FEATURES.md` | 金流整合狀態從 ❌ 改為 ✅ |
| `docs/CHANGELOG.md` | 新增 ECPay 金流串接記錄 |

## 檔案變更總覽

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/services/ecpayService.js` | **新建** | ECPay 金流核心服務 |
| `src/database.js` | 修改 | 新增 payment_method、paid_at 欄位遷移 |
| `src/routes/orderRoutes.js` | 修改 | 新增 2 個端點 + 修改模擬付款 |
| `public/js/pages/order-detail.js` | 修改 | ECPay 付款流程 + 查詢邏輯 |
| `views/pages/order-detail.ejs` | 修改 | 付款按鈕 UI 更新 |
| `tests/ecpay.test.js` | **新建** | CheckMacValue 單元測試 |
| `vitest.config.js` | 修改 | 測試序列加入 ecpay |
| `docs/ARCHITECTURE.md` | 修改 | 架構文件更新 |
| `docs/FEATURES.md` | 修改 | 功能狀態更新 |
| `docs/CHANGELOG.md` | 修改 | 更新日誌 |

## 驗證方式

1. **單元測試**：`npm test` — 確認 CheckMacValue 通過所有 test vectors，既有測試不受影響
2. **手動測試**：
   - 啟動伺服器 `npm run dev:server`
   - 登入 → 加入商品至購物車 → 結帳建立訂單
   - 在訂單詳情頁點擊「前往付款」→ 確認跳轉至綠界測試頁面
   - 使用測試信用卡 `4311-9522-2222-2222`（到期日任意未來、CVV `222`、3DS 驗證碼 `1234`）
   - 付款完成後確認回導至訂單詳情頁，自動查詢付款狀態
   - 確認訂單狀態更新為「已付款」
3. **Fallback 測試**：移除 .env 中的 ECPay 設定，確認模擬付款按鈕正常顯示
