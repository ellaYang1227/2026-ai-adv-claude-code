# Bloom & Co. 設計規範

Figma 設計稿：[2026-AI-課程 Bloom & Co. 花卉電商](https://www.figma.com/design/lnRMwFsPubRvnYzRPm2KMS/2026-AI-%E8%AA%B2%E7%A8%8B---Bloom---Co.-%E8%8A%B1%E5%8D%89%E9%9B%BB%E5%95%86)

---

## 設計方向：The Modern Florist

以「現代花藝師」為核心意象，拒絕粉嫩甜膩的花卉電商刻板印象，改用深墨綠色作為主要 UI 色彩，搭配羊皮紙米白底色，傳遞職人質感與高端品味。關鍵美學選擇：**深綠（#1C3329）作為 Navbar、Footer、主要 CTA 按鈕**，讓花卉本身成為畫面中最鮮豔的元素。

---

## 色彩系統

| Token 名稱 | Hex 值 | 用途 |
|-----------|--------|------|
| `deepGreen` | `#1C3329` | Navbar、Footer、主要按鈕、品牌標誌 |
| `deepGreenHover` | `#254438` | 主要按鈕 hover 狀態 |
| `ivory` | `#FAFAF7` | 頁面主背景 |
| `surface` | `#F2F0EB` | 卡片背景、Sidebar、步驟指示器背景 |
| `clay` | `#C4A882` | 次要強調、裝飾元素 |
| `sage` | `#8FA68E` | 商品圖片佔位符、輔助色 |
| `text` | `#1A1A1A` | 主要文字 |
| `textSecondary` | `#6B6B6B` | 次要文字、說明文字 |
| `textMuted` | `#9A948E` | 輔助文字、placeholder |
| `border` | `#DEDAD4` | 分隔線、輸入框邊框 |
| `white` | `#FFFFFF` | 卡片白底、輸入框背景 |

> 以上數值對應 `public/css/input.css` 中 `@theme` 的實際 CSS 變數（切版階段依實際視覺效果微調過，已同步於此）。

> 以上色彩已在 Figma 建立為 Local Variable Collection「Bloom & Co. Tokens」。

---

## 字體系統

| 角色 | 字體 | 用途 |
|------|------|------|
| Display | Cormorant Garamond Italic | Hero 標題、品牌名稱、頁面大標 |
| Heading | Cormorant Garamond Bold | 區塊標題、訂單號碼 |
| UI Body | DM Sans Regular | 一般內文、說明 |
| UI Medium | DM Sans Medium | 導覽連結、標籤 |
| UI SemiBold | DM Sans SemiBold | 價格、重要數據、按鈕文字 |

**字體比例：**

| Style | Size | Usage |
|-------|------|-------|
| Display/Hero | 74px Cormorant Italic | Hero Banner 主標語 |
| Display/H1 | 38–42px Cormorant Bold | 頁面主標題 |
| Display/H2 | 28–32px Cormorant Bold | 商品名稱、區塊標題 |
| UI/Body | 14–15px DM Sans Regular | 一般文字 |
| UI/Small | 12–13px DM Sans Regular | 說明文字、輔助資訊 |
| UI/Caption | 11–12px DM Sans Medium | Badge 標籤、步驟編號 |

---

## 頁面清單

所有設計稿位於 Figma 檔案的「Screens」頁面，以 1440px 寬的 Frame 水平排列。

| Frame 名稱 | 路由 | 說明 |
|-----------|------|------|
| `Screen/index` | `/` | 首頁：Navbar + Hero Banner + 商品 3 欄 Grid + Footer |
| `Screen/product-detail` | `/products/:id` | 商品詳情：麵包屑 + 2 欄（圖左/資訊右）+ Footer |
| `Screen/cart` | `/cart` | 購物車：品項列表 + 訂單摘要 Sidebar |
| `Screen/checkout` | `/checkout` | 結帳：3 步驟指示器 + 表單 + 訂單摘要 |
| `Screen/orders` | `/orders` | 訂單列表：頁面標題 + 訂單卡片（含狀態 Badge）|
| `Screen/order-detail` | `/orders/:id` | 訂單詳情：訂單標題 + 2 欄（品項/配送付款）|
| `Screen/login` | `/login` | 登入/註冊：置中卡片 + Tab 切換 |

---

## 元件規範

### Navbar
- 背景：`deepGreen`
- 高度：76px，左右 padding 80px
- 品牌名：Cormorant Garamond Italic 26px（白色）
- 導覽連結：DM Sans Medium 15px（白色 85% 透明度）

### Navbar（行動版）
- `md` 斷點以下導覽連結收合為漢堡選單按鈕，點擊展開／收合下拉選單（背景沿用 `deepGreen`）
- Hero Banner、商品 Grid 等區塊同步依斷點調整為單欄／雙欄排版

### Footer
- 背景：`deepGreen`
- 高度：140px，左右 padding 80px
- 品牌名：Cormorant Garamond Italic 22px（白色）
- 版權文字：DM Sans Regular 12px（白色 40% 透明度）

### 主要按鈕（CTA）
- 背景：`deepGreen`
- 文字：DM Sans Medium/SemiBold 14–15px（白色）
- Padding：水平 22–24px，垂直 9–12px
- Corner Radius：2px

### 輸入框
- 背景：白色
- 邊框：`border`（1px）
- Corner Radius：2px
- 高度：44px
- Placeholder：DM Sans Regular 13–14px（45% 透明度）

### 狀態 Badge（訂單列表）
| 狀態 | 文字色 | 背景色 |
|------|--------|--------|
| 已付款 | `#0F703F` | `#E5F5ED` |
| 處理中 | `#754F0B` | `#FEF3D8` |
| 付款失敗 | `#991B1B` | `#FBE7E7` |

---

## 設計截圖

> 截圖存放於 `docs/design/mockups/`

| 頁面 | 截圖檔案 |
|------|---------|
| 首頁 | `mockups/index.png` |
| 商品詳情 | `mockups/product-detail.png` |
| 購物車 | `mockups/cart.png` |
| 結帳 | `mockups/checkout.png` |
| 訂單列表 | `mockups/orders.png` |
| 訂單詳情 | `mockups/order-detail.png` |
| 登入/註冊 | `mockups/login.png` |
