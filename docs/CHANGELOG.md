# 更新日誌

## [1.2.0] - 2026-09-06

### 新增
- 配送費用模組（`src/utils/shipping.js`）：依配送方式（宅配 / 超商取貨）、商品小計免運門檻、偏遠地區、當日急件計算運費
- 建立訂單時整合運費計算，`orders` 表新增 `delivery_method`、`is_remote_area`、`is_rush_delivery`、`shipping_fee` 欄位
- 結帳頁新增配送方式選擇與偏遠地區／當日急件勾選框，訂單摘要即時顯示運費與合計
- 訂單詳情頁、後台訂單詳情顯示配送方式與運費明細
- 配送費用 Unit Test（8 個案例，`tests/shipping.test.js`）

## [1.1.0] - 2026-04-12

### 新增
- ECPay 綠界金流 AIO 串接（CMV-SHA256）
  - `src/services/ecpayService.js`：CheckMacValue 產生/驗證、付款表單參數組合、QueryTradeInfo 查詢
  - `POST /api/orders/:id/payment`：產生 ECPay 付款表單參數
  - `POST /api/orders/:id/check-payment`：查詢 ECPay 付款結果並更新訂單
- 訂單詳情頁整合 ECPay 付款流程（前往付款按鈕、自動查詢付款狀態）
- orders 表新增 `payment_method`、`paid_at` 欄位
- ECPay CheckMacValue 單元測試（15 個測試案例，含 5 組官方 test vectors）
- 模擬付款保留為 ECPay 未設定時的 fallback

## [1.0.0] - 2026-04-12

### 新增
- 認證系統：註冊、登入、JWT 認證、個人資料 API
- 商品系統：前台商品列表（分頁）、商品詳情 API
- 購物車系統：雙模式認證（JWT / Session）、CRUD API
- 訂單系統：建立訂單（含 Transaction 扣庫存）、訂單列表、詳情、模擬付款 API
- 後台管理：商品 CRUD（含刪除保護）、訂單列表（狀態篩選）、訂單詳情 API
- 前端頁面：EJS 模板（前台 7 頁 + 後台 2 頁 + 404 頁）
- 前端互動：API 封裝、認證管理、通知元件
- 資料庫：SQLite + better-sqlite3，WAL 模式，5 張資料表
- 種子資料：admin 帳號 + 8 筆示範花卉商品
- 測試：Vitest + supertest，6 個測試檔案，32 個測試案例
- OpenAPI：swagger-jsdoc 註解 + openapi.json 產生器
- 樣式：Tailwind CSS 4.x
- 文件：專案文件結構（CLAUDE.md + docs/）
