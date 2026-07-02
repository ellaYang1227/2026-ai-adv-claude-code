document.addEventListener('DOMContentLoaded', function () {
  const authNav = document.getElementById('auth-nav');
  const cartBadge = document.getElementById('cart-badge');
  const ordersLink = document.getElementById('orders-link');

  if (authNav) {
    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      let html = '';
      if (Auth.isAdmin()) {
        html += '<a href="/admin/products" class="text-white/85 hover:text-white transition-colors text-[15px] font-medium">後台管理</a>';
      }
      html += '<span class="text-white/60 text-[15px]">' + (user?.name || '') + '</span>';
      html += '<button onclick="Auth.logout()" class="text-white/85 hover:text-white transition-colors text-[15px] font-medium">登出</button>';
      authNav.innerHTML = html;
    } else {
      authNav.innerHTML = '<a href="/login" class="border text-white font-medium hover:bg-white/10 transition-colors" style="border-color:rgba(255,255,255,0.55);border-radius:4px;padding:9px 22px;font-size:14px;">登入</a>';
    }
  }

  if (ordersLink) {
    ordersLink.style.display = Auth.isLoggedIn() ? '' : 'none';
  }

  if (cartBadge) {
    apiFetch('/api/cart').then(function (res) {
      if (res && res.data && res.data.items && res.data.items.length > 0) {
        cartBadge.textContent = res.data.items.length;
        cartBadge.style.display = 'flex';
      }
    }).catch(function () {});
  }
});
