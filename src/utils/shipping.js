const BASE_FEE = {
  home: 120,
  store: 60,
};

const FREE_SHIPPING_THRESHOLD = 1500;
const REMOTE_AREA_SURCHARGE = 200;
const RUSH_DELIVERY_SURCHARGE = 250;

/**
 * 計算配送費用。
 * 宅配基本運費在商品小計達到免運門檻時歸零；超商取貨無免運門檻。
 * 偏遠地區與當日急件的加成對兩種配送方式皆適用，疊加在基本運費之上。
 */
function calculateShippingFee({ deliveryMethod, subtotal, isRemoteArea = false, isRushDelivery = false }) {
  let base = BASE_FEE[deliveryMethod];
  if (base === undefined) {
    throw new Error(`未知的配送方式：${deliveryMethod}`);
  }

  if (deliveryMethod === 'home' && subtotal >= FREE_SHIPPING_THRESHOLD) {
    base = 0;
  }

  const surcharge = (isRemoteArea ? REMOTE_AREA_SURCHARGE : 0) + (isRushDelivery ? RUSH_DELIVERY_SURCHARGE : 0);

  return base + surcharge;
}

module.exports = { calculateShippingFee, BASE_FEE, FREE_SHIPPING_THRESHOLD, REMOTE_AREA_SURCHARGE, RUSH_DELIVERY_SURCHARGE };
