// ECPay AIO 金流服務
// Source: ECPay skill guides/13 §Node.js + guides/01 §AIO
const crypto = require('crypto');

// ECPay 端點設定
const ECPAY_URLS = {
  staging: {
    paymentUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
    queryUrl: 'https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
  },
  production: {
    paymentUrl: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5',
    queryUrl: 'https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5'
  }
};

/**
 * 讀取 ECPay 環境變數設定
 * @returns {Object|null} 設定物件，未設定時回傳 null
 */
function getEcpayConfig() {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIV) return null;

  const env = process.env.ECPAY_ENV || 'staging';
  return {
    merchantId,
    hashKey,
    hashIV,
    ...(ECPAY_URLS[env] || ECPAY_URLS.staging)
  };
}

/**
 * ECPay 專用 URL Encode（ecpayUrlEncode）
 * Source: guides/13 §Node.js (line 211-225)
 * 流程: encodeURIComponent → %20→+ → ~→%7e → '→%27 → 轉小寫 → .NET 字元替換
 */
function ecpayUrlEncode(source) {
  let encoded = encodeURIComponent(source)
    .replace(/%20/g, '+')
    .replace(/~/g, '%7e')
    .replace(/'/g, '%27');
  encoded = encoded.toLowerCase();
  const replacements = {
    '%2d': '-', '%5f': '_', '%2e': '.', '%21': '!',
    '%2a': '*', '%28': '(', '%29': ')',
  };
  for (const [old, char] of Object.entries(replacements)) {
    encoded = encoded.split(old).join(char);
  }
  return encoded;
}

/**
 * 產生 CheckMacValue (SHA256)
 * Source: guides/13 §Node.js (line 227-244)
 * 流程: filter → sort(case-insensitive) → concat → ecpayUrlEncode → SHA256 → toUpperCase
 */
function generateCheckMacValue(params, hashKey, hashIV) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([k]) => k !== 'CheckMacValue')
  );
  const sorted = Object.keys(filtered)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const paramStr = sorted.map(k => `${k}=${filtered[k]}`).join('&');
  const raw = `HashKey=${hashKey}&${paramStr}&HashIV=${hashIV}`;
  const encoded = ecpayUrlEncode(raw);
  const hash = crypto.createHash('sha256').update(encoded, 'utf8').digest('hex');
  return hash.toUpperCase();
}

/**
 * 驗證 CheckMacValue（timing-safe）
 * Source: guides/13 §Node.js (line 246-253) — 禁止使用 == / ===，必須使用 crypto.timingSafeEqual
 */
function verifyCheckMacValue(params, hashKey, hashIV) {
  const received = params.CheckMacValue || '';
  const calculated = generateCheckMacValue(params, hashKey, hashIV);
  const a = Buffer.from(received);
  const b = Buffer.from(calculated);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * 將 order_no 轉為 MerchantTradeNo（去除 dash + 隨機後綴，最長 20 字元）
 * ORD-YYYYMMDD-XXXXX → ORDYYYYMMDDXXXXX (17 chars) + 3 chars random suffix
 * 後綴確保同一訂單可多次送出付款請求（ECPay 不允許重複編號）
 */
function toMerchantTradeNo(orderNo) {
  const base = orderNo.replace(/-/g, '');
  const suffix = crypto.randomBytes(2).toString('base64url').slice(0, 3);
  return (base + suffix).slice(0, 20);
}

/**
 * 產生 MerchantTradeDate（UTC+8）
 * Source: SKILL.md — 必須使用 UTC+8 時區，格式 yyyy/MM/dd HH:mm:ss
 */
function getMerchantTradeDate() {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc8.getUTCDate()).padStart(2, '0');
  const hh = String(utc8.getUTCHours()).padStart(2, '0');
  const mm = String(utc8.getUTCMinutes()).padStart(2, '0');
  const ss = String(utc8.getUTCSeconds()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

/**
 * 組合 ECPay AIO 付款表單參數
 * Source: guides/01 §步驟 1 + §AIO 必填參數表
 * @param {Object} order - 訂單資料 { id, order_no, total_amount }
 * @param {Array} items - 訂單商品 [{ product_name, quantity }]
 * @param {string} baseUrl - 本地伺服器 base URL
 * @returns {{ actionUrl: string, params: Object }}
 */
function buildPaymentFormParams(order, items, baseUrl) {
  const config = getEcpayConfig();
  const merchantTradeNo = toMerchantTradeNo(order.order_no);

  // Source: guides/01 §前置確認清單 — 建議 ItemName 截斷至 200 字元內
  const itemName = items
    .map(i => `${i.product_name} x${i.quantity}`)
    .join('#')
    .substring(0, 200);

  // Source: SKILL.md — ItemName/TradeDesc 避免系統指令關鍵字（echo, curl 等）
  const params = {
    MerchantID: config.merchantId,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: getMerchantTradeDate(),
    PaymentType: 'aio',
    TotalAmount: String(order.total_amount),
    TradeDesc: 'Flower Shop Order',
    ItemName: itemName,
    // ReturnURL: 本地端無法接收 callback，設定 placeholder（綠界要求必填）
    ReturnURL: `${baseUrl}/api/orders/ecpay/notify`,
    // ClientBackURL: 付款後導回訂單詳情頁（僅導回，不帶付款結果）
    ClientBackURL: `${baseUrl}/orders/${order.id}?payment=check`,
    ChoosePayment: 'ALL',
    EncryptType: '1'
  };

  params.CheckMacValue = generateCheckMacValue(params, config.hashKey, config.hashIV);

  return {
    actionUrl: config.paymentUrl,
    params
  };
}

/**
 * 查詢綠界交易狀態
 * Source: guides/01 §查詢訂單 — TimeStamp 有效期僅 3 分鐘，每次呼叫前必須重新產生
 * @param {string} merchantTradeNo
 * @returns {Promise<Object>} 查詢結果（含 TradeStatus）
 */
async function queryTradeInfo(merchantTradeNo) {
  const config = getEcpayConfig();

  // Source: SKILL.md — Timestamp 一律使用 Unix 秒數（非毫秒）
  const params = {
    MerchantID: config.merchantId,
    MerchantTradeNo: merchantTradeNo,
    TimeStamp: String(Math.floor(Date.now() / 1000))
  };

  params.CheckMacValue = generateCheckMacValue(params, config.hashKey, config.hashIV);

  // Source: guides/01 §HTTP 協議速查 — Content-Type: application/x-www-form-urlencoded
  const body = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const response = await fetch(config.queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const text = await response.text();

  // Source: guides/01 §端點 URL — 查詢回應為 URL-encoded 字串
  const result = {};
  text.split('&').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      result[pair.substring(0, idx)] = pair.substring(idx + 1);
    }
  });

  return result;
}

module.exports = {
  getEcpayConfig,
  ecpayUrlEncode,
  generateCheckMacValue,
  verifyCheckMacValue,
  toMerchantTradeNo,
  getMerchantTradeDate,
  buildPaymentFormParams,
  queryTradeInfo
};
