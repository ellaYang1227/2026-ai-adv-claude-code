# Bloom & Co. E2E 金流測試紀錄

使用 Playwright MCP 對 Bloom & Co. 花卉電商網站執行的綠界（ECPay）金流 E2E 測試，詳細流程見 [`.claude/skills/e2e-payment-test/SKILL.md`](../../.claude/skills/e2e-payment-test/SKILL.md)。

---

## 測試場景與結果

| 場景 | 流程 | 結果 |
|------|------|------|
| 場景一：完整金流成功路徑 | 加入購物車 → 結帳 → 建立訂單 → ECPay 信用卡付款 + 3D 驗證 OTP → 訂單狀態確認 | ✅ 通過（訂單 `ORD-20260704-162FB` → 已付款） |
| 場景二：付款失敗驗證 | 建立訂單 → ECPay 付款流程中於 3D 驗證頁取消 → 訂單狀態確認 | ✅ 通過（訂單 `ORD-20260704-6CC74` → 付款失敗） |
| 場景三：空購物車與未登入結帳 | 未登入前往購物車 → 嘗試前往 `/checkout` | ✅ 通過（顯示「購物車是空的」、重導至登入頁） |

---

## 測試截圖

> 截圖存放於 `docs/e2e-test/screenshots/`

| 步驟 | 截圖檔案 |
|------|---------|
| 場景一：首頁 | `screenshots/scenario1-01-homepage.png` |
| 場景一：購物車確認 | `screenshots/scenario1-02-cart.png` |
| 場景一：結帳表單 | `screenshots/scenario1-03-checkout-form.png` |
| 場景一：訂單建立（待付款） | `screenshots/scenario1-04-order-pending.png` |
| 場景一：付款成功（已付款） | `screenshots/scenario1-05-order-paid.png` |
| 場景二：付款失敗 | `screenshots/scenario2-01-payment-failed.png` |
| 場景三：空購物車 | `screenshots/scenario3-01-empty-cart.png` |
| 場景三：未登入重導登入頁 | `screenshots/scenario3-02-checkout-redirect-login.png` |

---

## 過程中發現並修正的問題

- **`src/services/ecpayService.js` — `toMerchantTradeNo` 隨機後綴 bug**：原使用 `crypto.randomBytes(2).toString('base64url')` 產生後綴，`base64url` 字元集含 `-`/`_`，機率性帶入非英數字元導致綠界回傳 10200031（`MerchantTradeNo Must be Number or English Letter`）交易失敗。已改為 `hex` 編碼確保恆為英數字元。
