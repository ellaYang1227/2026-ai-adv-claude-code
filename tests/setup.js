const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

// DB 隔離：DATABASE_PATH 必須在載入 app（進而載入 src/database.js）之前設定。
// 本檔案同時被 Unit Test 與 Integration Test 重複使用（見 require('../setup')）。
// Integration 測試已經由 tests/integration/setup.js 這個 setupFiles 設定好
// DATABASE_PATH，此處不可覆蓋；只有在尚未設定時（即 Unit Test 情境），
// 才去讀 tests/unitGlobalSetup.js（整個 run 只執行一次）寫入的暫存 marker 檔。
if (!process.env.DATABASE_PATH) {
  const markerPath = path.join(os.tmpdir(), `vitest-unit-db-path-${process.ppid}.txt`);
  process.env.DATABASE_PATH = fs.readFileSync(markerPath, 'utf8').trim();
}
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const app = require('../app');

/**
 * Login with the seed admin account and return the JWT token.
 */
async function getAdminToken() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@hexschool.com', password: '12345678' });
  return res.body.data.token;
}

/**
 * Register a new user and return { token, user }.
 */
async function registerUser(overrides = {}) {
  const email = overrides.email || `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: overrides.password || 'password123',
      name: overrides.name || '測試使用者',
    });
  return { token: res.body.data.token, user: res.body.data.user };
}

module.exports = { app, request, getAdminToken, registerUser };
