# 測試規範與指南

## 測試框架

- **測試框架**：Vitest 2.x
- **HTTP 測試**：supertest 7.x
- **斷言**：Vitest 內建（`expect`），設定 `globals: true` 免 import

## 測試檔案一覽

| 檔案 | 測試對象 | 測試數量 | 前置依賴 |
|------|---------|---------|---------|
| `tests/auth.test.js` | 認證 API（註冊、登入、個人資料） | 6 | 無 |
| `tests/products.test.js` | 前台商品 API（列表、分頁、詳情、404） | 4 | 需要 seed 商品資料 |
| `tests/cart.test.js` | 購物車 API（訪客模式 CRUD + 登入模式 + 錯誤案例） | 6 | 需要商品資料 |
| `tests/orders.test.js` | 訂單 API（建立、空車、無認證、列表、詳情、404） | 6 | 需要用戶 + 商品 + 購物車 |
| `tests/adminProducts.test.js` | 後台商品 API（列表、CRUD、權限檢查） | 6 | 需要 admin 帳號 |
| `tests/adminOrders.test.js` | 後台訂單 API（列表、篩選、詳情、權限） | 4 | 需要 admin + 既有訂單 |

## 執行順序與依賴關係

測試**必須按照固定順序序列執行**，在 `vitest.config.js` 中設定：

```javascript
{
  test: {
    globals: true,
    fileParallelism: false,  // 禁止檔案平行執行
    sequence: {
      files: [
        'tests/auth.test.js',        // 1. 先測認證（建立用戶）
        'tests/products.test.js',     // 2. 測商品（依賴 seed 資料）
        'tests/cart.test.js',         // 3. 測購物車（依賴商品 ID）
        'tests/orders.test.js',       // 4. 測訂單（依賴用戶 + 購物車）
        'tests/adminProducts.test.js',// 5. 測後台商品（依賴 admin 帳號）
        'tests/adminOrders.test.js',  // 6. 測後台訂單（依賴既有訂單）
      ],
    },
    hookTimeout: 10000,  // beforeAll 等 hook 超時 10 秒
  },
}
```

**為什麼不能平行**：所有測試共用同一個 SQLite 資料庫檔案。測試間有隱性資料依賴——例如 orders 測試依賴 auth 測試中已註冊的用戶機制，以及 products 測試中確認存在的商品 ID。

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

## 常見陷阱

### 1. 測試順序依賴

新增測試檔案後必須更新 `vitest.config.js` 的 `sequence.files`，否則測試可能因未定義的執行順序導致失敗。

### 2. 資料庫共用

所有測試共用同一個 `database.sqlite` 檔案。測試中建立的資料（用戶、商品、訂單等）會永久保留在資料庫中。如果測試失敗留下髒資料，可刪除 `database.sqlite` 重跑。

### 3. bcrypt salt rounds

`src/database.js` 中 seed admin 帳號時，若 `NODE_ENV === 'test'` 則 salt rounds 為 1（加速測試），否則為 10。但路由中的註冊（`authRoutes.js`）固定使用 salt rounds 10。

### 4. 購物車雙模式的 token 行為

在 cart 測試中，若同時提供了 `Authorization` header 和 `X-Session-Id`，JWT 優先。若 JWT 無效，**不會退回** session 模式，而是直接回 401。測試時需注意不要混用兩種認證方式。

### 5. 訂單建立會清空購物車

`POST /api/orders` 成功後會清空該用戶的購物車。若後續測試需要購物車資料，需重新加入商品。orders.test.js 中的「空車建立訂單」測試正是利用這個行為。

### 6. hookTimeout 設定

`vitest.config.js` 中 `hookTimeout: 10000`（10 秒）。若 `beforeAll` 中有多個 API 呼叫（如 adminOrders 測試需要註冊 → 加入購物車 → 建立訂單），需確保在此時間內完成。
