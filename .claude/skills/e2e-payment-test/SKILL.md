# E2E 測試 Skill — 綠界金流完整流程自動化測試

## 觸發方式

在 Claude Code 中呼叫此 Skill：

```
/e2e-payment-test
```

或直接告知 Claude：「請用 Playwright MCP 執行 E2E 金流測試」

---

## 測試目標

使用 **Playwright MCP** 讓 Claude 直接控制瀏覽器，對 Bloom & Co. 花卉電商網站執行完整的綠界金流測試流程，並自動截圖記錄每個關鍵步驟。

---

## 前置需求

### 1. 確認 Playwright MCP 已安裝

若尚未安裝，執行以下指令新增至 Claude Code：

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

或在專案 `.mcp.json` 加入：

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

安裝後執行 `claude mcp list` 或 `/mcp` 確認 playwright 出現在清單中。

### 2. 確認伺服器正在運行

```bash
npm start
# 或
npm run dev:server
```

確認 `http://localhost:3001` 可正常存取。

### 3. 環境變數（.env）

```
JWT_SECRET=your_secret
# ECPay 已設定時，點擊「前往付款 (ECPay)」會導向綠界測試站（payment-stage.ecpay.com.tw）
# 未設定時才會顯示本地「模擬付款」按鈕（fallback）
```

---

## 測試場景

### 場景一：完整金流成功路徑（ECPay 測試站付款）

**流程**：

1. 開啟首頁 `http://localhost:3001`
   - 若瀏覽器沒有自動開啟，或開啟後網址不是 `http://localhost:3001`（例如停在 `about:blank` 或前次測試殘留的頁面），改用 `browser_tabs`（action: `new`, url: `http://localhost:3001`）開一個新分頁
   - 若 `browser_navigate` 回傳「Target page, context or browser has been closed」錯誤，代表瀏覽器 session 已中斷，同樣改用 `browser_tabs` 開新分頁重新導向首頁
   - 導覽後務必用 snapshot 確認 Page URL 確實為 `http://localhost:3001/`，再繼續下一步
2. 點擊任一商品進入商品詳情頁
3. 點擊「加入購物車」
4. 前往購物車頁，確認品項顯示正確
5. 點擊「前往結帳」
6. 填寫收件人資料（姓名、Email、地址）
7. 點擊「送出訂單」
8. 進入訂單詳情頁，確認訂單狀態為「待付款」
9. 點擊「前往付款 (ECPay)」，會導向綠界測試站（payment-stage.ecpay.com.tw）的信用卡付款表單
10. 在信用卡表單填入專案內建 `ecpay` skill 中記載的官方測試信用卡資料（見下方「ECPay 測試信用卡資料」）：
    - 信用卡卡號分成 4 段輸入框：`4311` / `9522` / `2222` / `2222`
    - 卡片有效期限 MM/YY：任意未來日期（例如 `12` / `29`）
    - 信用卡安全碼 CVV：任意 3 碼（例如 `222`）
    - 持卡人姓名：`WANG XIAO MING`
    - 手機號碼：`0987654321`
    - 電子信箱：任意有效格式 Email
    - **注意**：卡號 4 段輸入框用一般 `fill`/`browser_fill_form` 填值不會觸發網站的即時驗證（送出時會出現「請輸入信用卡卡號」錯誤，即使欄位其實有值）。務必改用 `browser_type`（`slowly: true`）逐字輸入卡號 4 段，才能觸發驗證並顯示發卡銀行（例如「中國信託」）
11. 點擊「立即付款」，會跳出確認付款金額的對話框，點擊「確定」
12. 頁面導向 3D 驗證頁（`cc-stage.ecpay.com.tw/form_ssl.php`），點擊「取得OTP服務密碼」，頁面會直接顯示測試用 OTP（`(OTP密碼：1234)`）；用 `browser_type` 輸入 `1234` 到 OTP 欄位後點擊「送出」
13. 送出後會看到綠界「付款成功」頁，點擊「返回商店」導回訂單詳情頁，確認訂單狀態更新為「已付款」

**預期結果**：訂單狀態顯示「已付款」

**注意**：不要點擊「測試付款請點此」的掃碼模擬連結 —— 那是另一條路徑（WebATM/掃碼付），不會走到上述信用卡 + 3D 驗證流程。

### 場景二：付款失敗驗證

**流程（ECPay 已設定時）**：

1. 建立一筆新訂單（同場景一步驟 1-7），進入訂單詳情頁確認「待付款」
2. 點擊「前往付款 (ECPay)」，依場景一步驟 10 填入測試信用卡資料並點擊「立即付款」→「確定」，進入 3D 驗證頁（`cc-stage.ecpay.com.tw/form_ssl.php`）
3. **不要**點擊「取得OTP服務密碼」，改為直接點擊「取消(Cancel)」
4. 瀏覽器會跳出原生 confirm 對話框（「您確定要取消本次交易之身分驗證作業嗎?」），用 `browser_handle_dialog`（`accept: true`）接受
5. 頁面會導向綠界「付款失敗」頁（訊息代碼 10100058），點擊「返回商店」導回訂單詳情頁
6. 確認訂單狀態顯示「付款失敗」

**流程（ECPay 未設定 / 本地 fallback 時）**：

1. 建立訂單後進入訂單詳情頁
2. 點擊「模擬付款失敗」按鈕
3. 確認訂單狀態顯示「付款失敗」

**預期結果**：訂單狀態正確顯示「付款失敗」

**注意**：訂單詳情頁是否出現「模擬付款失敗」按鈕取決於 `.env` 是否設定 ECPay 金鑰（見上方「環境變數」章節）；已設定時只會看到「前往付款 (ECPay)」，須走上方 ECPay 流程才能觸發失敗狀態。

### 場景三：空購物車嘗試結帳

**流程**：

1. 未登入狀態前往購物車頁 `http://localhost:3001/cart`
2. 確認購物車顯示「購物車是空的」
3. 嘗試前往 `/checkout`，確認重導至登入頁

**預期結果**：空購物車狀態正確顯示，未登入無法結帳

---

## 執行方式（Playwright MCP）

執行此 Skill 時，Claude 透過 Playwright MCP 工具直接控制瀏覽器，**不需要預先撰寫測試腳本**。Claude 會：

1. 使用 MCP browser 工具開啟頁面、點擊元素、填寫表單
2. 驗證頁面狀態與文字內容
3. 回報每個場景的通過／失敗狀態

> **重要**：呼叫此 Skill 時，請明確告知 Claude「使用 Playwright MCP」，避免 Claude 改用 Bash 執行 CLI 指令。

---

## 影片錄製（螢幕錄製）

Playwright MCP **不支援自動錄影**，請在 Claude 執行測試前先開啟螢幕錄製：

**Windows（剪取工具 Snipping Tool）**：

1. 開啟「剪取工具」，切換至「錄製」模式（或按 `Win + Shift + S` 開啟後切換）
2. 選取要錄製的範圍（建議選整個瀏覽器視窗），點擊「開始」
3. 呼叫 `/e2e-payment-test`，讓 Claude 開始操控瀏覽器
4. 測試結束後點擊「停止」結束錄製
5. 錄製完成後另存新檔，預設存於 `C:\Users\<使用者>\Videos\Screen Recordings\`

---

## 輸出物

| 輸出         | 說明                                                             |
| ------------ | ---------------------------------------------------------------- |
| 測試結果報告 | Claude 在對話中回報每個場景的通過／失敗狀態                      |
| 影片錄製     | 剪取工具（Snipping Tool）手動錄製，完成後上傳 YouTube |

---

## 測試帳號

| 角色   | Email                 | 密碼       |
| ------ | --------------------- | ---------- |
| 管理員 | `admin@hexschool.com` | `12345678` |

---

## ECPay 測試信用卡資料

資料來源：專案內建的 `ecpay` skill（`.claude/skills/ecpay/SKILL.md` §測試信用卡號）。

| 項目           | 值                        |
| -------------- | ------------------------- |
| 卡號（VISA）   | `4311-9522-2222-2222`     |
| 有效期限       | 任意未來月年（例如 12/29）|
| 安全碼 CVV     | 任意 3 碼（例如 222）     |
| 持卡人姓名     | `WANG XIAO MING`          |
| 手機號碼       | `0987654321`               |
| 3D 驗證 OTP    | `1234`（頁面會直接顯示）  |
