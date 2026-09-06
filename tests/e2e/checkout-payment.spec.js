const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = 'admin@hexschool.com';
const ADMIN_PASSWORD = '12345678';

/**
 * 完整金流流程：登入 → 加入購物車 → 結帳建立訂單 → 綠界網路 ATM（台灣土地銀行）付款 → 確認訂單已付款。
 * 需先手動啟動專案（npm start 或 npm run dev:server），本測試不會另外啟動伺服器。
 */
test('登入花卉電商並完成網路ATM（台灣土地銀行）付款，訂單狀態為已付款', async ({ page }) => {
  // 1-2. 登入
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'email@example.com' }).fill(ADMIN_EMAIL);
  await page.getByRole('textbox', { name: '••••••••' }).fill(ADMIN_PASSWORD);
  await page.locator('form').getByRole('button', { name: '登入' }).click();
  await expect(page).toHaveURL('/');

  // 3-4. 選擇商品並加入購物車
  await page.getByRole('button', { name: '加入購物車' }).first().click();

  // 5-6. 進入結帳頁，填寫配送資料
  await page.goto('/checkout');
  await page.getByRole('textbox', { name: '請輸入收件人姓名' }).fill('王小明');
  await page.getByRole('textbox', { name: 'email@example.com' }).fill('e2e-test@example.com');
  await page.getByRole('textbox', { name: '縣市 / 鄉鎮 / 路段 / 門號' }).fill('台北市信義區信義路一段1號');

  // 7. 建立訂單
  await page.getByRole('button', { name: '前往付款' }).click();
  await expect(page).toHaveURL(/\/orders\/.+/);
  await expect(page.getByText('待付款').first()).toBeVisible();

  // 8-9. 前往綠界付款頁
  await page.getByRole('button', { name: '前往付款 (ECPay)' }).click();
  await expect(page).toHaveURL(/payment-stage\.ecpay\.com\.tw/);

  // 10. 選擇「網路 ATM」
  // 綠界測試站頁首廣告區塊偶爾會延遲載入並讓分頁切換狀態被重置回「信用卡」，
  // 這裡加入重試：反覆點擊直到「選擇銀行」欄位確定可見為止
  const bankSelect = page.locator('#selWebATMBank');
  await expect(async () => {
    await page.getByRole('listitem', { name: 'WebATM' }).click();
    await expect(bankSelect).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 30000 });

  // 11. 選擇「台灣土地銀行」
  await bankSelect.selectOption({ label: '台灣土地銀行' });

  // 12. 點擊「前往付款」
  await page.getByRole('link', { name: '前往付款' }).click();

  // 13. 關閉提示視窗
  await page.getByRole('button', { name: '關閉' }).click();

  // 14. 土地銀行測試頁面點擊 Save
  await expect(page).toHaveURL(/LandWebAtm/);
  await page.getByRole('button', { name: 'Save' }).click();

  // 15. 綠界顯示付款成功（會經過數次轉導頁面，放寬等待時間）
  await page.waitForURL(/webatm\/result/, { timeout: 20000 });
  await expect(page.getByRole('heading', { name: '付款成功' })).toBeVisible({ timeout: 10000 });

  // 16. 點擊「返回商店」，驗證訂單狀態為已付款
  await page.getByRole('link', { name: '返回商店' }).click();
  await expect(page).toHaveURL(/\/orders\/.+payment=check/);
  await expect(page.getByText('已付款').first()).toBeVisible();

  // 需要有付款成功的截圖
  await page.screenshot({ path: 'test-results/e2e/checkout-payment-success.png', fullPage: true });
});
