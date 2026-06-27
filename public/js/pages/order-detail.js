const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    if (!Auth.requireAuth()) return {};

    const el = document.getElementById('app');
    const orderId = el.dataset.orderId;
    const paymentResult = ref(el.dataset.paymentResult || null);

    const order = ref(null);
    const loading = ref(true);
    const paying = ref(false);
    const ecpayEnabled = ref(true);

    const statusMap = {
      pending: { label: '待付款', cls: 'bg-apricot/20 text-apricot' },
      paid: { label: '已付款', cls: 'bg-sage/20 text-sage' },
      failed: { label: '付款失敗', cls: 'bg-red-100 text-red-600' },
    };

    const paymentMessages = {
      success: { text: '付款成功！感謝您的購買。', cls: 'bg-sage/10 text-sage border border-sage/20' },
      failed: { text: '付款失敗，請重試。', cls: 'bg-red-50 text-red-600 border border-red-100' },
      cancel: { text: '付款已取消。', cls: 'bg-apricot/10 text-apricot border border-apricot/20' },
      pending: { text: '付款尚未完成，請稍後再查詢或重新付款。', cls: 'bg-apricot/10 text-apricot border border-apricot/20' },
      checking: { text: '正在查詢付款狀態...', cls: 'bg-blue-50 text-blue-600 border border-blue-100' },
    };

    async function goToEcpay() {
      if (!order.value || paying.value) return;
      paying.value = true;
      try {
        var res = await apiFetch('/api/orders/' + order.value.id + '/payment', {
          method: 'POST'
        });
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = res.data.actionUrl;
        var params = res.data.params;
        for (var key in params) {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(params[key]);
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
      } catch (e) {
        if (e.data && e.data.error === 'PAYMENT_NOT_CONFIGURED') {
          ecpayEnabled.value = false;
        } else {
          Notification.show('無法前往付款頁面', 'error');
        }
        paying.value = false;
      }
    }

    async function checkPayment() {
      paymentResult.value = 'checking';
      paying.value = true;
      try {
        var res = await apiFetch('/api/orders/' + orderId + '/check-payment', {
          method: 'POST'
        });
        order.value = res.data;
        if (res.data.status === 'paid') {
          paymentResult.value = 'success';
        } else if (res.data.status === 'failed') {
          paymentResult.value = 'failed';
        } else {
          paymentResult.value = 'pending';
        }
      } catch (e) {
        Notification.show('查詢付款狀態失敗', 'error');
        paymentResult.value = null;
      } finally {
        paying.value = false;
      }
    }

    // 模擬付款（fallback）
    async function simulatePay(action) {
      if (!order.value || paying.value) return;
      paying.value = true;
      try {
        var res = await apiFetch('/api/orders/' + order.value.id + '/pay', {
          method: 'PATCH',
          body: JSON.stringify({ action: action })
        });
        order.value = res.data;
        paymentResult.value = action === 'success' ? 'success' : 'failed';
      } catch (e) {
        Notification.show('付款處理失敗', 'error');
      } finally {
        paying.value = false;
      }
    }

    function handlePaySuccess() { simulatePay('success'); }
    function handlePayFail() { simulatePay('fail'); }

    onMounted(async function () {
      try {
        var res = await apiFetch('/api/orders/' + orderId);
        order.value = res.data;

        // 從 ECPay 回導後，自動查詢付款狀態
        if (paymentResult.value === 'check' && order.value.status === 'pending') {
          checkPayment();
        }
      } catch (e) {
        Notification.show('載入訂單失敗', 'error');
      } finally {
        loading.value = false;
      }
    });

    return {
      order, loading, paying, paymentResult, ecpayEnabled,
      statusMap, paymentMessages,
      goToEcpay, checkPayment,
      handlePaySuccess, handlePayFail
    };
  }
}).mount('#app');
