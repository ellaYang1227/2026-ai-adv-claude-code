const fs = require('fs');
const os = require('os');
const path = require('path');

const dbPath = path.join(
  os.tmpdir(),
  `integration-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`
);

process.env.DATABASE_PATH = dbPath;
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

afterAll(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.unlinkSync(dbPath + suffix);
    } catch (e) {
      // 檔案不存在則忽略
    }
  }
});
