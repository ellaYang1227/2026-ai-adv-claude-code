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
# ECPay 未設定時自動顯示「模擬付款」按鈕（fallback）
```

---

## 測試場景

### 場景一：完整金流成功路徑（模擬付款）
**流程**：
1. 開啟首頁 `http://localhost:3001`
2. 點擊任一商品進入商品詳情頁
3. 點擊「加入購物車」
4. 前往購物車頁，確認品項顯示正確
5. 點擊「前往結帳」
6. 填寫收件人資料（姓名、Email、地址）
7. 點擊「送出訂單」
8. 進入訂單詳情頁，確認訂單狀態為「待付款」
9. 點擊「模擬付款成功」（ECPay fallback 按鈕）
10. 確認訂單狀態更新為「已付款」

**預期結果**：訂單狀態顯示「已付款」

### 場景二：付款失敗驗證
**流程**：
1. 建立訂單後進入訂單詳情頁
2. 點擊「模擬付款失敗」按鈕
3. 確認訂單狀態顯示「付款失敗」

**預期結果**：訂單狀態正確顯示「付款失敗」

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

**Windows（Xbox Game Bar）**：
1. 按 `Win + G` 開啟 Xbox Game Bar
2. 點擊「開始錄製」或按 `Win + Alt + R`
3. 呼叫 `/e2e-payment-test`，讓 Claude 開始操控瀏覽器
4. 測試結束後按 `Win + Alt + R` 停止錄製
5. 影片預設存於 `C:\Users\<使用者>\Videos\Captures\`

**OBS Studio**：
1. 新增「視窗擷取」來源，選擇瀏覽器視窗
2. 按「開始錄製」後呼叫 `/e2e-payment-test`
3. 測試結束後按「停止錄製」

---

## 輸出物

| 輸出 | 說明 |
|------|------|
| 測試結果報告 | Claude 在對話中回報每個場景的通過／失敗狀態 |
| 影片錄製 | 螢幕錄製工具（Xbox Game Bar 或 OBS）手動錄製，完成後上傳 YouTube |

---

## 測試帳號
| 角色 | Email | 密碼 |
|------|-------|------|
| 管理員 | `admin@hexschool.com` | `12345678` |
