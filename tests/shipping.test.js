const { calculateShippingFee } = require('../src/utils/shipping');

describe('calculateShippingFee', () => {
  it('宅配基本運費', () => {
    expect(calculateShippingFee({ deliveryMethod: 'home', subtotal: 1000 })).toBe(120);
  });

  it('超商取貨費用', () => {
    expect(calculateShippingFee({ deliveryMethod: 'store', subtotal: 1000 })).toBe(60);
  });

  it('商品小計 1,499 元的情況（未達免運門檻，仍收基本運費）', () => {
    expect(calculateShippingFee({ deliveryMethod: 'home', subtotal: 1499 })).toBe(120);
  });

  it('商品小計 1,500 元的免運情況', () => {
    expect(calculateShippingFee({ deliveryMethod: 'home', subtotal: 1500 })).toBe(0);
  });

  it('偏遠地區加成', () => {
    expect(calculateShippingFee({ deliveryMethod: 'home', subtotal: 1000, isRemoteArea: true })).toBe(320);
  });

  it('當日急件加成', () => {
    expect(calculateShippingFee({ deliveryMethod: 'home', subtotal: 1000, isRushDelivery: true })).toBe(370);
  });

  it('多項加成同時成立', () => {
    expect(calculateShippingFee({
      deliveryMethod: 'home',
      subtotal: 1000,
      isRemoteArea: true,
      isRushDelivery: true
    })).toBe(570);
  });

  it('滿額免運與附加費同時成立', () => {
    expect(calculateShippingFee({
      deliveryMethod: 'home',
      subtotal: 1500,
      isRemoteArea: true,
      isRushDelivery: true
    })).toBe(450);
  });
});
