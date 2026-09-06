const { app, request, getAdminToken, registerUser } = require('../setup');

describe('Order flow (integration)', () => {
  let token;
  let productId;
  let productPrice;

  beforeAll(async () => {
    const { token: t } = await registerUser();
    token = t;

    const prodRes = await request(app).get('/api/products?limit=1');
    const product = prodRes.body.data.products[0];
    productId = product.id;
    productPrice = product.price;
  });

  function addToCart(quantity) {
    return request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity });
  }

  it('建立訂單：完整成功流程，運費、總額與庫存皆正確', async () => {
    const beforeStock = (await request(app).get(`/api/products/${productId}`)).body.data.stock;

    await addToCart(2);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientName: '整合測試收件人',
        recipientEmail: 'integration@example.com',
        recipientAddress: '台北市信義區信義路一段 1 號',
        deliveryMethod: 'store',
        isRemoteArea: false,
        isRushDelivery: true
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('error', null);

    const subtotal = productPrice * 2;
    const expectedShippingFee = 60 + 250; // 超商取貨 60 + 當日急件 250
    expect(res.body.data.subtotal).toBe(subtotal);
    expect(res.body.data.shipping_fee).toBe(expectedShippingFee);
    expect(res.body.data.total_amount).toBe(subtotal + expectedShippingFee);
    expect(res.body.data.delivery_method).toBe('store');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.status).toBe('pending');

    // 庫存正確扣除
    const afterStock = (await request(app).get(`/api/products/${productId}`)).body.data.stock;
    expect(afterStock).toBe(beforeStock - 2);

    // 訂單詳情可查得到，且運費資訊一致
    const orderId = res.body.data.id;
    const detailRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.shipping_fee).toBe(expectedShippingFee);
    expect(detailRes.body.data.total_amount).toBe(subtotal + expectedShippingFee);

    // 建立訂單後購物車應清空
    const cartRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.items).toHaveLength(0);
  });

  it('建立訂單失敗：庫存不足時不建立訂單、不誤扣庫存、購物車不清空', async () => {
    await addToCart(2);

    const adminToken = await getAdminToken();
    const stockRes = await request(app)
      .put(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stock: 1 });
    expect(stockRes.status).toBe(200);

    const beforeOrderCount = (await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)).body.data.orders.length;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientName: '整合測試收件人',
        recipientEmail: 'integration@example.com',
        recipientAddress: '台北市信義區信義路一段 1 號'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('STOCK_INSUFFICIENT');

    // 未建立不完整訂單
    const afterOrderCount = (await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)).body.data.orders.length;
    expect(afterOrderCount).toBe(beforeOrderCount);

    // 庫存未被誤扣
    const productRes = await request(app).get(`/api/products/${productId}`);
    expect(productRes.body.data.stock).toBe(1);

    // 購物車未被清空（失敗時應保留原內容供使用者調整）
    const cartRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.items.length).toBeGreaterThan(0);
  });

  it('建立訂單失敗：購物車為空時回傳 400 且不影響現有資料', async () => {
    const { token: emptyCartToken } = await registerUser();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${emptyCartToken}`)
      .send({
        recipientName: '空車測試',
        recipientEmail: 'empty-cart@example.com',
        recipientAddress: '台北市'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('CART_EMPTY');
  });
});
