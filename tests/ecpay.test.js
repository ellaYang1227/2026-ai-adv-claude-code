const {
  ecpayUrlEncode,
  generateCheckMacValue,
  verifyCheckMacValue,
  toMerchantTradeNo,
  getMerchantTradeDate,
} = require('../src/services/ecpayService');

// Source: .claude/skills/ecpay/test-vectors/checkmacvalue.json
const HASH_KEY = 'pwFHCqoQZGmho4w6';
const HASH_IV = 'EkRm7iFT261dpevs';

describe('ECPay Service', () => {
  describe('ecpayUrlEncode', () => {
    it('should encode spaces as + (not %20)', () => {
      const result = ecpayUrlEncode('hello world');
      expect(result).toContain('+');
      expect(result).not.toContain('%20');
    });

    it('should encode ~ as %7e', () => {
      const result = ecpayUrlEncode('test~value');
      expect(result).toContain('%7e');
    });

    it("should encode ' as %27", () => {
      const result = ecpayUrlEncode("Tom's");
      expect(result).toContain('%27');
    });

    it('should restore .NET special characters (- _ . ! * ( ))', () => {
      const result = ecpayUrlEncode('a-b_c.d!e*f(g)h');
      expect(result).toBe('a-b_c.d!e*f(g)h');
    });
  });

  describe('generateCheckMacValue', () => {
    it('should produce correct value for basic AIO test vector', () => {
      const params = {
        MerchantID: '3002607',
        MerchantTradeNo: 'Test1234567890',
        MerchantTradeDate: '2025/01/01 12:00:00',
        PaymentType: 'aio',
        TotalAmount: '100',
        TradeDesc: '測試',
        ItemName: '測試商品',
        ReturnURL: 'https://example.com/notify',
        ChoosePayment: 'ALL',
        EncryptType: '1',
      };
      const result = generateCheckMacValue(params, HASH_KEY, HASH_IV);
      expect(result).toBe('291CBA324D31FB5A4BBBFDF2CFE5D32598524753AFD4959C3BF590C5B2F57FB2');
    });

    it("should handle apostrophe ' correctly (Node.js trap)", () => {
      const params = {
        MerchantID: '3002607',
        ItemName: "Tom's Shop",
        TotalAmount: '100',
      };
      const result = generateCheckMacValue(params, HASH_KEY, HASH_IV);
      expect(result).toBe('CF0A3D4901D99459D8641516EC57210700E8A5C9AB26B1D021301E9CB93EF78D');
    });

    it('should handle tilde ~ correctly', () => {
      const params = {
        MerchantID: '3002607',
        ItemName: 'Test~Product',
        TotalAmount: '200',
      };
      const result = generateCheckMacValue(params, HASH_KEY, HASH_IV);
      expect(result).toBe('CEEAE01D2F9A8E74D4AC0DCE7735B046D73F35A5EC99558A31A2EE03159DA1C9');
    });

    it('should encode spaces as + (not %20)', () => {
      const params = {
        MerchantID: '3002607',
        ItemName: 'My Test Product',
        TotalAmount: '300',
      };
      const result = generateCheckMacValue(params, HASH_KEY, HASH_IV);
      expect(result).toBe('7712A5E6EDC3B57086063C88568084C66CE882A21D40E74DE5ACA3B478C6F316');
      // Wrong value if using %20 instead of +
      expect(result).not.toBe('13F7A6B69BF856B5203212AC5F3202B6140D8E2B4316A62851712BF2AF7812D0');
    });

    it('should produce correct value for callback verification', () => {
      const params = {
        MerchantID: '3002607',
        MerchantTradeNo: 'Test1234567890',
        RtnCode: '1',
        RtnMsg: 'Succeeded',
        TradeNo: '2301011234567890',
        TradeAmt: '100',
        PaymentDate: '2025/01/01 12:05:00',
        PaymentType: 'Credit_CreditCard',
        TradeDate: '2025/01/01 12:00:00',
        SimulatePaid: '0',
      };
      const result = generateCheckMacValue(params, HASH_KEY, HASH_IV);
      expect(result).toBe('2AB536D86AFF8E1086744D59175040A32538C96B1C28C4135B551BD728E913B8');
    });
  });

  describe('verifyCheckMacValue', () => {
    it('should return true for valid CheckMacValue', () => {
      const params = {
        MerchantID: '3002607',
        ItemName: '測試商品',
        TotalAmount: '100',
      };
      const cmv = generateCheckMacValue(params, HASH_KEY, HASH_IV);
      const result = verifyCheckMacValue({ ...params, CheckMacValue: cmv }, HASH_KEY, HASH_IV);
      expect(result).toBe(true);
    });

    it('should return false for tampered params', () => {
      const params = {
        MerchantID: '3002607',
        ItemName: '測試商品',
        TotalAmount: '100',
      };
      const cmv = generateCheckMacValue(params, HASH_KEY, HASH_IV);
      const result = verifyCheckMacValue({ ...params, TotalAmount: '999', CheckMacValue: cmv }, HASH_KEY, HASH_IV);
      expect(result).toBe(false);
    });

    it('should return false for empty CheckMacValue', () => {
      const params = {
        MerchantID: '3002607',
        ItemName: '測試商品',
        TotalAmount: '100',
        CheckMacValue: '',
      };
      const result = verifyCheckMacValue(params, HASH_KEY, HASH_IV);
      expect(result).toBe(false);
    });
  });

  describe('toMerchantTradeNo', () => {
    it('should strip dashes and append random suffix', () => {
      const result = toMerchantTradeNo('ORD-20260412-ABC12');
      expect(result).toMatch(/^ORD20260412ABC12.{3}$/);
    });

    it('should produce string within 20 chars', () => {
      const result = toMerchantTradeNo('ORD-20260412-ABCDE');
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('should produce unique values for the same order_no', () => {
      const a = toMerchantTradeNo('ORD-20260412-ABC12');
      const b = toMerchantTradeNo('ORD-20260412-ABC12');
      expect(a).not.toBe(b);
    });
  });

  describe('getMerchantTradeDate', () => {
    it('should return date in yyyy/MM/dd HH:mm:ss format', () => {
      const result = getMerchantTradeDate();
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });
});
