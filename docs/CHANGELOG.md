# 更新日誌

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
