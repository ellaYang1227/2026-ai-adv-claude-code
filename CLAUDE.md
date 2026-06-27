# CLAUDE.md

## 專案概述
花卉電商網站 (backend-project) — Express.js + better-sqlite3 + EJS + JWT 認證 + Tailwind CSS

## 常用指令
```bash
npm start              # 建置 CSS 並啟動伺服器
npm run dev:server     # 僅啟動伺服器（不建置 CSS）
npm run dev:css        # Tailwind CSS watch 模式
npm run css:build      # 建置並壓縮 CSS
npm run openapi        # 產生 openapi.json
npm test               # 執行所有測試（vitest，序列執行）
```

## 關鍵規則
- 所有 API 回應格式統一為 `{ data, error, message }`，不可偏離此結構
- 購物車支援雙模式認證：JWT Bearer Token 或 X-Session-Id header（見 cartRoutes.js 的 dualAuth）
- 測試必須按照 vitest.config.js 定義的順序執行，因為測試之間有資料依賴（auth → products → cart → orders → adminProducts → adminOrders）
- 資料庫使用 WAL 模式且啟用 foreign_keys，所有 ID 欄位為 UUID v4 字串
- 功能開發使用 docs/plans/ 記錄計畫；完成後移至 docs/plans/archive/

## 詳細文件
- ./docs/README.md — 項目介紹與快速開始
- ./docs/ARCHITECTURE.md — 架構、目錄結構、資料流
- ./docs/DEVELOPMENT.md — 開發規範、命名規則
- ./docs/FEATURES.md — 功能列表與完成狀態
- ./docs/TESTING.md — 測試規範與指南
- ./docs/CHANGELOG.md — 更新日誌
