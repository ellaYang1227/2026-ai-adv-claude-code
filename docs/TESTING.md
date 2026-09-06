# 測試規範與指南

## 測試框架

- **單元 / 整合測試**：Vitest 2.x + supertest 7.x
- **E2E 測試（自動化）**：Playwright Test 1.x
- **E2E 測試（手動探索）**：Playwright MCP（見 `.claude/skills/e2e-payment-test/SKILL.md`）
- **API 測試集**：Postman Collection（由 `openapi-to-postmanv2` 從 `openapi.json` 產生）+ Newman CLI
- **斷言**：Vitest 內建（`expect`），設定 `globals: true` 免 import

## 測試檔案一覽（Unit Test — `tests/*.test.js`）

| 檔案 | 測試對象 | 測試數量 | 前置依賴 |
|------|---------|---------|---------|
| `tests/shipping.test.js` | 配送費用計算（`src/utils/shipping.js`，純函式） | 8 | 無 |
| `tests/ecpay.test.js` | ECPay CheckMacValue（含官方 test vectors） | 16 | 無 |
| `tests/auth.test.js` | 認證 API（註冊、登入、個人資料） | 6 | 無 |
| `tests/products.test.js` | 前台商品 API（列表、分頁、詳情、404） | 4 | 需要 seed 商品資料 |
| `tests/cart.test.js` | 購物車 API（訪客模式 CRUD + 登入模式 + 錯誤案例） | 6 | 需要商品資料 |
| `tests/orders.test.js` | 訂單 API（建立、空車、無認證、列表、詳情、404） | 6 | 需要用戶 + 商品 + 購物車 |
| `tests/adminProducts.test.js` | 後台商品 API（列表、CRUD、權限檢查） | 6 | 需要 admin 帳號 |
| `tests/adminOrders.test.js` | 後台訂單 API（列表、篩選、詳情、權限） | 4 | 需要 admin + 既有訂單 |

執行：`npm run test:unit`（等同 `npm test`）。

## 執行順序與依賴關係

測試**必須按照固定順序序列執行**，在 `vitest.config.js` 中設定：

```javascript
{
  test: {
    globals: true,
    include: ['tests/*.test.js'],  // 排除 tests/integration/、tests/e2e/
    fileParallelism: false,        // 禁止檔案平行執行
    sequence: {
      files: [
        'tests/shipping.test.js',     // 0. 純函式，無 DB 依賴
        'tests/ecpay.test.js',        // 1. 純函式，無 DB 依賴
        'tests/auth.test.js',         // 2. 先測認證（建立用戶）
        'tests/products.test.js',     // 3. 測商品（依賴 seed 資料）
        'tests/cart.test.js',         // 4. 測購物車（依賴商品 ID）
        'tests/orders.test.js',       // 5. 測訂單（依賴用戶 + 購物車）
        'tests/adminProducts.test.js',// 6. 測後台商品（依賴 admin 帳號）
        'tests/adminOrders.test.js',  // 7. 測後台訂單（依賴既有訂單）
      ],
    },
    hookTimeout: 10000,  // beforeAll 等 hook 超時 10 秒
  },
}
```

**為什麼不能平行**：Unit Test 全部共用專案的 `database.sqlite` 檔案。測試間有隱性資料依賴——例如 orders 測試依賴 auth 測試中已註冊的用戶機制，以及 products 測試中確認存在的商品 ID。

## 輔助函式（`tests/setup.js`）

| 函式 | 參數 | 回傳值 | 說明 |
|------|------|--------|------|
| `getAdminToken()` | 無 | `string` (JWT token) | 使用 seed admin 帳號登入，回傳 token |
| `registerUser(overrides?)` | `{ email?, password?, name? }` | `{ token, user }` | 註冊新用戶，自動產生唯一 email |

### 匯出項目

```javascript
module.exports = { app, request, getAdminToken, registerUser };
```

- `app`：Express 應用程式實例（直接 require app.js）
- `request`：supertest 的 `request` 函式（已導入）

### registerUser 的 email 產生策略

```javascript
const email = overrides.email || `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
```

使用時間戳 + 隨機字串確保每次呼叫產生唯一 email。

## 撰寫新測試步驟

1. **建立檔案**：在 `tests/` 目錄建立 `<功能>.test.js`

2. **引入 setup**：
   ```javascript
   const { app, request, getAdminToken, registerUser } = require('./setup');
   ```

3. **使用 describe 區塊組織**：
   ```javascript
   describe('功能名稱 API', () => {
     let token;

     beforeAll(async () => {
       // 取得需要的 token 或前置資料
       const { token: t } = await registerUser();
       token = t;
     });

     it('should ...', async () => {
       const res = await request(app)
         .get('/api/...')
         .set('Authorization', `Bearer ${token}`);

       expect(res.status).toBe(200);
       expect(res.body).toHaveProperty('data');
       expect(res.body).toHaveProperty('error', null);
       expect(res.body).toHaveProperty('message');
     });
   });
   ```

4. **更新 vitest.config.js**：將新測試檔案加入 `sequence.files` 陣列的適當位置

5. **驗證回應結構**：每個成功測試應驗證統一回應格式的三個欄位 `data`, `error`, `message`

## 測試撰寫範例

### 成功案例
```javascript
it('should create a new product', async () => {
  const res = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: '測試商品', price: 500, stock: 100 });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('data');
  expect(res.body).toHaveProperty('error', null);
  expect(res.body.data).toHaveProperty('id');
  expect(res.body.data).toHaveProperty('name', '測試商品');
});
```

### 錯誤案例
```javascript
it('should return 404 for non-existent product', async () => {
  const res = await request(app).get('/api/products/non-existent-id');

  expect(res.status).toBe(404);
  expect(res.body).toHaveProperty('data', null);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error).not.toBeNull();
});
```

### 權限檢查
```javascript
it('should deny access to regular user', async () => {
  const { token } = await registerUser();
  const res = await request(app)
    .get('/api/admin/products')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(403);
  expect(res.body).toHaveProperty('error');
  expect(res.body.error).not.toBeNull();
});
```

## Integration Test（`tests/integration/*.integration.test.js`）

執行：`npm run test:integration`（獨立設定檔 `vitest.integration.config.js`）。

- **DB 隔離**：`src/database.js` 的 DB 路徑改為 `process.env.DATABASE_PATH || 預設路徑`。`tests/integration/setup.js` 作為 `setupFiles`，在載入 app 之前於系統暫存目錄產生一個獨立的 sqlite 檔案路徑並寫入 `process.env.DATABASE_PATH`，`afterAll` 時刪除該檔案與 `-wal`/`-shm`。**完全不會動到專案的 `database.sqlite`**。
- **測試輔助函式**：沿用 `tests/setup.js` 的 `app`、`request`、`getAdminToken`、`registerUser`（相對路徑 `require('../setup')`），因為 DB 路徑已由 setupFiles 決定，重複使用不會影響隔離性。
- **涵蓋情境**：`tests/integration/order-flow.integration.test.js`
  - 完整成功流程：登入 → 加入購物車 → 建立訂單（含配送方式與運費）→ 驗證回應格式、運費/總額正確性、庫存正確扣除、購物車清空
  - 庫存不足：建立訂單前用 admin 調低庫存 → 驗證回傳 `STOCK_INSUFFICIENT`、不建立訂單、不誤扣庫存、購物車不被清空
  - 空購物車：驗證回傳 `CART_EMPTY`

## E2E 測試 — 自動化（Playwright Test，`tests/e2e/*.spec.js`）

執行：`npm run test:e2e`（設定檔 `playwright.config.js`）。

- **不會另外啟動伺服器**：`playwright.config.js` 未設定 `webServer`，執行前需自行 `npm start` 或 `npm run dev:server`。
- **直接對真實的 `database.sqlite` 與綠界測試站操作**：每次執行都會建立真實訂單、扣真實庫存，屬於預期行為；如需乾淨環境可比照 Unit Test 刪除 `database.sqlite` 重建。
- **`tests/e2e/checkout-payment.spec.js`**：登入（`admin@hexschool.com` / `12345678`）→ 加入購物車 → 結帳 → 前往綠界付款頁 → 選擇「網路 ATM」→「台灣土地銀行」→ 前往付款 → 關閉提示視窗 → 在土地銀行測試頁點擊 Save → 確認付款成功 → 返回商店 → 驗證訂單狀態為「已付款」→ 存下成功畫面截圖至 `test-results/e2e/`（不納入版控）。
- **已知的第三方頁面不穩定性**：綠界測試站（`payment-stage.ecpay.com.tw`）頁首廣告區塊偶爾延遲載入，會讓付款方式分頁的選取狀態被重置回「信用卡」。腳本對「點擊網路ATM分頁 → 確認選擇銀行欄位可見」這段加了 `expect(...).toPass()` 重試邏輯因應。

## Postman Collection（`postman/collection.json` + `postman/environment.json`，皆不納入版控）

執行：`npm run test:postman`（內部依序執行 `npm run openapi` → `npm run postman` → `newman run postman/collection.json -e postman/environment.json`）。

- **產生方式**：`scripts/generate-postman.js` 用 `openapi-to-postmanv2` 把 `openapi.json` 轉成 Postman Collection，並做以下後處理：
  - 補上 `token`、`sessionId` 兩個 Collection Variables（`baseUrl` 由 `openapi.json` 的 `servers[0].url` 自動產生，預設 `http://localhost:3001`）
  - 把轉換工具預設產生的 bearer 變數名稱（`bearerToken`）統一改為 `token`，讓所有需要登入的請求都用 `{{token}}` 帶 Bearer Token
  - 把「登入」請求的 body 換成專案種子帳號（`admin@hexschool.com` / `12345678`），並加上 test script：登入成功後把 `data.token` 存進 `pm.collectionVariables`
  - 把登入請求所在的分支搬到整個 collection 最前面執行（newman 依 `item` 陣列順序做深度優先執行），確保後續請求都能拿到剛登入的 token
  - 另外輸出一份獨立的 `postman/environment.json`，**只放 `baseUrl`**：`token`／`sessionId` 是執行期間動態產生的值，故意不放進 Environment，避免 Postman 變數優先權（Environment > Collection Variables）讓 Environment 裡的空值蓋掉登入後存入的 token。要切換測試目標主機（如 staging）時，改這個檔案的 `baseUrl` 即可
- **只需登入一次**：因為 admin 帳號本身具備管理員權限，登入一次即可讓一般會員 API 與後台管理 API 都成功通過驗證。
- **路徑／內文參數**：轉換工具產生的是通用範例值（如 `<string>`），呼叫需要真實 ID 的端點（如訂單詳情、商品詳情）前，建議先從對應的列表端點取得真實 ID 再手動帶入。

## 常見陷阱

### 1. 測試順序依賴

新增測試檔案後必須更新 `vitest.config.js` 的 `sequence.files`，否則測試可能因未定義的執行順序導致失敗。

### 2. 資料庫共用（僅限 Unit Test）

Unit Test（`tests/*.test.js`）共用同一個 `database.sqlite` 檔案。測試中建立的資料（用戶、商品、訂單等）會永久保留在資料庫中，長期重複執行可能耗盡種子商品的庫存導致後續測試失敗（曾實際發生過）。如果測試失敗留下髒資料或庫存被耗盡，可刪除 `database.sqlite`（及 `-wal`/`-shm`）讓專案重新建立種子資料。Integration Test 使用獨立的暫存 DB，不受此限制。

### 3. bcrypt salt rounds

`src/database.js` 中 seed admin 帳號時，若 `NODE_ENV === 'test'` 則 salt rounds 為 1（加速測試），否則為 10。但路由中的註冊（`authRoutes.js`）固定使用 salt rounds 10。

### 4. 購物車雙模式的 token 行為

在 cart 測試中，若同時提供了 `Authorization` header 和 `X-Session-Id`，JWT 優先。若 JWT 無效，**不會退回** session 模式，而是直接回 401。測試時需注意不要混用兩種認證方式。

### 5. 訂單建立會清空購物車

`POST /api/orders` 成功後會清空該用戶的購物車。若後續測試需要購物車資料，需重新加入商品。orders.test.js 中的「空車建立訂單」測試正是利用這個行為。

### 6. hookTimeout 設定

`vitest.config.js` 中 `hookTimeout: 10000`（10 秒）。若 `beforeAll` 中有多個 API 呼叫（如 adminOrders 測試需要註冊 → 加入購物車 → 建立訂單），需確保在此時間內完成。
