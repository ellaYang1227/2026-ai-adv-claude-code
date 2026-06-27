# Design Skill — Bloom & Co. 花卉電商設計稿

## 觸發方式
在 Claude Code 中呼叫此 Skill：
```
/design [頁面名稱]
```
或直接告知 Claude：「請用 Design Skill 設計 [頁面]」

## Skill 目標
使用 Claude 官方 (Anthropic) 的 `frontend-design` skill，為 Bloom & Co. 花卉電商前台頁面產出設計稿，並依設計稿完成 EJS 切版。

---

## frontend-design Skill 設計流程

### 前置需求

#### 1. 安裝 Claude 官方 frontend-design plugin
```
/plugin install frontend-design
/reload-plugins
```
確認 `frontend-design` 已出現在可用 Skill 清單中。

#### 2. 確認 Anthropic 官方 figma 插件已安裝並連線
使用 **Anthropic 官方 figma 插件**，內建 Figma 官方雲端 MCP（`https://mcp.figma.com/mcp`），無需手動設定 `.mcp.json`。

**步驟一：確認插件是否已安裝**

執行 `/plugin`，在已安裝清單中尋找 `figma`：
- **已安裝** → 直接進行步驟二
- **未安裝** → 執行以下指令安裝：
  ```
  /plugin install figma
  /reload-plugins
  ```

**步驟二：確認 Figma MCP 已連線並完成 OAuth 授權**

執行 `/mcp`，確認 `figma` 顯示為已連線（Connected）：
- **已連線** → 前置需求完成，可繼續設計步驟
- **未連線 / 需授權** → 在 `/mcp` 清單中選擇 `figma` → `Authenticate`，瀏覽器會開啟 Figma 授權頁，點擊「Allow access」完成帳號 OAuth 授權，回到 Claude Code 後確認顯示「Authentication successful」

#### 3. 請使用者提供 Figma 檔案路徑
請使用者提供 Figma 設計檔的完整 URL，格式如下：
```
https://www.figma.com/design/<fileKey>/檔案名稱
```
從 URL 中取出 `fileKey`，後續步驟使用 `mcp__figma__get_figma_data` 工具讀取。

---

### 設計步驟
1. **呼叫 frontend-design**：執行 `/frontend-design`，**不參考現有專案色彩（`public/css/input.css`）**，自行為 Bloom & Co. 花卉電商規劃全新品牌色彩系統（Color Tokens），產出設計方向建議
2. **透過 Figma MCP 建立色彩系統**：依 frontend-design 規劃的結果，在 Figma 中建立 Variables（Color Tokens）與 Color Styles
3. **在 Figma 中設計各頁面**（共 7 頁，順序）：
   - `index` — 首頁（商品 Grid 2欄/3欄、Hero Banner）
   - `product-detail` — 商品詳情（大圖、描述、加購區）
   - `cart` — 購物車（品項列表、金額彙總）
   - `checkout` — 結帳（表單、訂單摘要 Sidebar）
   - `orders` — 訂單列表（卡片列表 + 狀態 Badge）
   - `order-detail` — 訂單詳情（品項明細、付款區塊）
   - `login` — 登入／註冊（Tab 切換表單）
4. **記錄設計規範**：將設計方向與說明存至 `docs/design/README.md`，並附上 Figma 檔案連結
5. **截圖存檔**：將各頁面截圖存至 `docs/design/mockups/`

---

## 切版實作原則
- 保留所有 Vue 3 Options API 邏輯，**只修改 HTML 結構與 Tailwind class**
- 不可移除 `v-model`、`@click`、`:class`、`v-for` 等 Vue 指令
- RWD 優先：行動版（預設）→ `md:` 斷點（平板）→ `lg:` 斷點（桌面）
- 圖片使用 `object-cover` + `aspect-[4/3]` 保持比例一致

---

## 輸出物清單
- [ ] `.claude/skills/design/SKILL.md`（本檔案）
- [ ] `docs/design/README.md`（設計說明與設計規範）
- [ ] `docs/design/mockups/*.png`（各頁面截圖）
- [ ] 更新後的 EJS 頁面（6 頁 + header partial）
