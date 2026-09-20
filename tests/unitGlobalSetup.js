const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Unit Test 全域隔離：整個 `vitest run` 只建立一份暫存 sqlite，
 * 讓 tests/setup.js 在載入 app 之前寫入 process.env.DATABASE_PATH。
 * 必須全體共用同一份 DB，因為測試檔之間依 vitest.config.js 的
 * sequence 循序執行且有資料依賴（auth → products → cart → orders → ...）。
 *
 * vitest 是 ESM-only 套件，CJS 測試檔無法 require('vitest') 取得 inject()，
 * 因此改用暫存 marker 檔傳遞路徑：globalSetup 執行於 vitest 主行程
 * （pid = P），每個測試檔各自在子行程執行（其 ppid = P），
 * 以 P 命名 marker 檔即可在不共用 process.env 的情況下讓兩邊對上同一份路徑。
 */
const markerPath = path.join(os.tmpdir(), `vitest-unit-db-path-${process.pid}.txt`);

module.exports = async function setup() {
  const dbPath = path.join(
    os.tmpdir(),
    `unit-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`
  );

  fs.writeFileSync(markerPath, dbPath, 'utf8');

  return function teardown() {
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(dbPath + suffix);
      } catch (e) {
        // 檔案不存在則忽略
      }
    }
    try {
      fs.unlinkSync(markerPath);
    } catch (e) {
      // 檔案不存在則忽略
    }
  };
};
