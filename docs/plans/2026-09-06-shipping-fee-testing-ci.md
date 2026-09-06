# 作業三開發計畫：配送費用模組、完整測試流程與 CI 自動化

- **分支**：`homework3-shipping-testing`
- **建立日期**：2026-09-06
- **狀態**：進行中

---

## Context

根據作業說明圖檔，完成三個挑戰：

- 挑戰一：在現有花卉電商專案中加入配送費用計算功能，並將運費邏輯封裝為可獨立測試的模組
- 挑戰二：為花卉電商專案建立完整的測試流程，涵蓋前端操作、後端 API、資料庫寫入、庫存更新與綠界付款
- 挑戰三：將 Unit Test 與 Integration Test 加入 GitHub Actions，讓專案在程式碼更新時自動執行測試

**起始狀態**：`orderRoutes.js` 建立訂單時沒有運費計算；既有 7 個 Vitest 測試檔都直接讀寫專案真實的 `database.sqlite`（`src/database.js` 的 DB 路徑寫死，無法替換）；沒有 Playwright、沒有 Postman Collection、沒有 `.github/workflows/`。

---

## 執行與驗收流程（重要）

每個挑戰完成後依序：

1. 若功能或指令有變動，同步更新 `README.md` 對應段落
2. 同步更新本計畫書（勾選已完成的 AI 執行項目、更新狀態）
3. 建立 commit（依 `git-commit` skill 的規範撰寫訊息）
4. 通知你進行人工測試
5. 你完成人工測試後，回報結果，再次更新本計畫書（勾選人工驗收 Checkpoint、記錄驗收結果）
6. 確認沒問題後，才開始下一個挑戰

---

## 設計決策（已確認）

1. **偏遠地區／當日急件加成**：兩種配送方式（宅配、超商取貨）皆適用，加成疊加在各自的基本運費之上。
   ```
   base = 超商取貨 ? 60 : 120
   若為宅配 且 商品小計 >= 1500 → base = 0（超商取貨不受滿額免運影響）
   shippingFee = base + (偏遠地區 ? 200 : 0) + (當日急件 ? 250 : 0)
   ```
2. **GitHub Actions 成功截圖**：存放於新建立的 `docs/ci/` 目錄（不放進 `docs/e2e-test/`，區分手動 E2E 紀錄與 CI 紀錄）。
3. **Postman/Newman 執行所需環境變數**：說明如下（不需要新增任何密鑰）：
   - Postman Collection 本身使用「Collection Variables」`baseUrl`（預設 `http://localhost:3001`）、`token`、`sessionId`，這些由 Collection 內建的 pre-request / test script 在執行時自動寫入，**不需要你手動設定**。
   - Newman 執行前，專案本身需先用 `npm start`（或 `npm run dev:server`）在本機啟動，讀取現有 `.env`（`JWT_SECRET`、`ECPAY_*` 等既有變數，`.env.example` 已列出，不需新增）。
   - 若要打對接綠界的付款端點，需確保 `.env` 內 `ECPAY_MERCHANT_ID` / `ECPAY_HASH_KEY` / `ECPAY_HASH_IV` / `ECPAY_ENV=staging` 為目前專案既有的測試環境值，不需另外申請。
   - 若未來想切換測試對象（例如打 staging 主機而非 localhost），只需在執行指令加上 `--env-var baseUrl=<目標網址>`，不需改程式碼。

---

## 挑戰一：配送費用模組與 Unit Test

### AI 執行項目
- [x] 新增 `src/utils/shipping.js`，匯出 `calculateShippingFee({ deliveryMethod, subtotal, isRemoteArea, isRushDelivery })` 純函式
- [x] `src/database.js`：比照現有 `payment_method` 等欄位的遷移模式，為 `orders` 表新增 `delivery_method`、`is_remote_area`、`is_rush_delivery`、`shipping_fee` 欄位
- [x] `src/routes/orderRoutes.js`：`POST /api/orders` 接收配送方式與加成參數，計算運費並寫入訂單，`total_amount` 含運費，回應新增 `subtotal`、`shipping_fee`
- [x] 更新 `orderRoutes.js` 內對應的 `@openapi` Swagger 註解
- [x] `views/pages/checkout.ejs` + `public/js/pages/checkout.js`：新增配送方式選擇、偏遠地區／當日急件勾選框、訂單摘要新增運費列（另同步修正 `order-detail.ejs`、`admin/orders.ejs` 原本寫死的錯誤運費顯示）
- [x] 執行 `npm run openapi` 重新產生 `openapi.json`（未納入 git 版控，維持專案既有慣例）
- [x] 更新 `docs/FEATURES.md`、`docs/ARCHITECTURE.md`、`docs/CHANGELOG.md`
- [x] 新增 `tests/shipping.test.js`，涵蓋 8 個案例（宅配基本運費／超商取貨費用／小計 1,499／小計 1,500 免運／偏遠地區加成／當日急件加成／多項加成同時成立／滿額免運與附加費同時成立），並加入 `vitest.config.js` 的 `sequence.files`
- [x] 新增 `npm run test:unit` 指令並執行，確認 56 個測試（48 既有 + 8 新增）全數通過（過程中發現共用的 `database.sqlite` 因長期重複測試導致商品庫存耗盡，已重置該 gitignore 檔案讓其自動重建種子資料）
- [x] 更新 `README.md`（新增作業三區塊、單元測試指令與案例數）
- [x] Commit（`cda4638` → amend 為 `792b264`：合併計畫書流程規則調整、README ✅ 移除、`.gitignore` 排除 `openapi.json`）
- [x] 修正 `/cart` 訂單摘要沿用的舊版錯誤運費規則（滿 500 免運／否則 NT$150），改用與 `shipping.js` 一致的規則試算，運費為 0 時顯示「NT$ 0」（`/checkout` 維持顯示「免運」），並修正免運進度橫幅門檻為 1,500 元（Commit `9357841`）
- [x] 優化結帳頁「配送方式」與「加收項目（可複選）」的分組排版（卡片式選項 + 群組標題 + 選中狀態標示），並用 Playwright 實際操作驗證畫面與金額計算正確（Commit `ab8b1a9`）

### 人工驗收 Checkpoint
- [x] 🔲 **通知你**：請在瀏覽器實際下單，切換配送方式／勾選偏遠地區／當日急件，確認運費與總額顯示正確，且訂單詳情頁與後台訂單管理能看到正確金額
- [x] 🔲 **你已完成人工測試並確認沒問題**，開始挑戰二

---

## 挑戰二：Integration Test、E2E Test 與 Postman Collection

### AI 執行項目 — Integration Test
- [x] `src/database.js`：`dbPath` 改為 `process.env.DATABASE_PATH || 現有預設路徑`（不改變預設行為，僅新增覆寫入口）
- [x] `vitest.config.js`：`test.include` 限定在 `tests/*.test.js`，避免掃到 `tests/integration/`、`tests/e2e/`
- [x] 新增 `vitest.integration.config.js` 與 `tests/integration/setup.js`：每個測試檔案使用系統暫存目錄下獨立的 sqlite 檔，`afterAll` 清除該檔案與 `-wal`/`-shm`
- [x] 新增 `tests/integration/order-flow.integration.test.js`：登入會員 → 取商品 → 加入購物車 → 建立含配送資訊的訂單 → 驗證 HTTP 狀態碼／回應格式／訂單與訂單項目正確性／運費與總額正確性／庫存正確扣除／失敗情境不留下不完整訂單／失敗情境不誤扣庫存（3 個測試案例）
- [x] `package.json` 新增 `"test:integration": "vitest run --config vitest.integration.config.js"`

### AI 執行項目 — E2E Test
- [x] 新增 devDependency `@playwright/test`，新增 `playwright.config.js`（`baseURL: http://localhost:3001`，不設定 `webServer`，需你先手動啟動專案），並在本機安裝 Chromium 瀏覽器
- [x] 先透過 Playwright MCP 實際走過一次網路ATM／台灣土地銀行付款流程確認正確步驟，再寫成 `tests/e2e/checkout-payment.spec.js`：登入 → 加入購物車 → 結帳填寫配送資料 → 建立訂單 → 綠界頁選「網路 ATM」→「台灣土地銀行」→「前往付款」→ 關閉提示視窗 → 測試頁點擊 Save → 等待付款成功 → 點擊「返回商店」→ 驗證訂單狀態為「已付款」→ 成功畫面截圖
- [x] 排除綠界測試站頁首廣告造成的分頁狀態間歇性重置問題，加上重試邏輯（`expect(...).toPass()`）確保穩定通過
- [x] `package.json` 新增 `"test:e2e": "playwright test"`

### AI 執行項目 — Postman Collection
- [x] 新增 devDependency `openapi-to-postmanv2`、`newman`
- [x] 新增 `scripts/generate-postman.js`：`openapi.json` → `postman/collection.json`，補上 `token`/`sessionId` 變數（`baseUrl` 由 servers 自動產生）、將轉換工具預設的 `bearerToken` 變數統一改名為 `token`、登入請求換成真實種子帳號並加上自動存 token 的 test script、把登入分支移到整個 collection 最前面執行確保後續請求都能拿到 token
- [x]（人工回饋後補做）另外輸出獨立的 `postman/environment.json`（只放 `baseUrl`，`token`/`sessionId` 維持在 Collection Variables，避免 Environment 空值蓋掉登入後存入的 token），`test:postman` 改用 `newman run postman/collection.json -e postman/environment.json`
- [x] `package.json` 新增 `"postman"`（僅產生 collection + environment）與 `"test:postman"`（openapi → postman → newman run）

### 收尾
- [x] `.gitignore` 新增 `postman/collection.json`、`postman/environment.json`、`playwright-report/`、`test-results/`
- [x] 確認 `npm run test:unit`（56 通過）、`npm run test:integration`（3 通過）、`npm run test:e2e`（1 通過，穩定重跑兩次皆過）、`npm run test:postman`（21 requests、0 failed，含 admin 端點皆正確帶上 Bearer Token）皆可正常執行
- [x] 更新 `README.md`「測試」章節：補上 Integration/E2E（自動化）/Postman 三種新測試方式與指令說明，並將原本的 E2E 手動探索小節重新命名區隔
- [x] 更新 `docs/TESTING.md`：新增測試檔案一覽（shipping/ecpay）、Integration Test／E2E Test／Postman Collection 三個新章節、常見陷阱補充資料庫共用僅限 Unit Test
- [x] Commit（依子項目拆成 4 個 commit：`80c9b2c` Integration Test、`1c1b7e8` E2E Test、`7a2d0dd` Postman Collection、`5c891f6` 文件更新）
- [x]（人工驗收過程中的補充修正，各自獨立 commit）
  - `12a60b5` `.gitignore` 補上本機 Claude Code 產生的空白狀態檔（`.claude/loop.md`、`.claude/output-styles`）
  - `f9e919c` README 補上遺漏的 `npm run postman` 指令說明
  - `0ee576c` 新增獨立的 `postman/environment.json`（只放 `baseUrl`），`test:postman` 改用 `newman -e postman/environment.json` 執行

### 人工驗收 Checkpoint
- [ ] 🔲 **通知你**：請本機啟動專案（`npm start`）後，依序手動執行 `npm run test:integration`、`npm run test:e2e`、`npm run test:postman`，確認皆綠燈通過，並檢查 `tests/e2e/` 截圖與 Postman 執行結果是否符合預期
- [ ] 🔲 **等待你確認沒問題**後才開始挑戰三

---

## 挑戰三：GitHub Actions 自動化測試

### AI 執行項目
- [ ] 新增 `.github/workflows/test.yml`：`push`／`pull_request` 觸發，步驟為 checkout → setup-node（含 npm cache）→ `npm ci` → `npm run test:unit` → `npm run test:integration`（不執行 E2E、不啟動服務）
- [ ] 新建 `docs/ci/` 目錄，放置 GitHub Actions 執行成功的截圖
- [ ] 更新 `README.md`：新增 CI 徽章或說明段落，連結到 workflow
- [ ] Commit 並 push 觸發 workflow

### 人工驗收 Checkpoint
- [ ] 🔲 **通知你**：請至 GitHub Actions 頁面確認 workflow 執行成功（Unit Test、Integration Test 兩個步驟皆綠燈），並確認 `docs/ci/` 截圖已存檔
- [ ] 🔲 **等待你最終確認**，作業三計畫完成

---

## 待完成項目 TodoList（總覽）

> 細項同上，此處作為整體進度總覽

- [x] 挑戰一：Shipping 模組、DB 遷移、訂單流程整合、前端、文件、Unit Test
- [x] 挑戰一：人工驗收（瀏覽器實際下單測試）
- [ ] 挑戰二：DB 可隔離化、Integration Test
- [ ] 挑戰二：Playwright E2E Test
- [ ] 挑戰二：Postman Collection + Newman
- [ ] 挑戰二：人工驗收（本機執行三種測試指令）
- [ ] 挑戰三：GitHub Actions workflow
- [ ] 挑戰三：人工驗收（GitHub Actions 執行成功截圖）
- [ ] 計畫完成後移至 `docs/plans/archive/`
