document.addEventListener('DOMContentLoaded', () => {
  const CART_KEY = 'sportstechCart';
  const WISHLIST_KEY = 'sportstechWishlist';

  // State
  let cart = read(CART_KEY);
  let wishlist = read(WISHLIST_KEY);
  let totalCount = 0;
  let totalAmount = 0;

  // Header counts and popups
  const cartCountEl = document.getElementById("cartCount");
  const wishlistCountEl = document.getElementById("wishlistCount");
  const cartCountMobileEl = document.getElementById("cartCountMobile");
  const wishlistCountMobileEl = document.getElementById("wishlistCountMobile");
  const cartCountSidebarEl = document.getElementById("cartCountSidebar");
  const wishlistCountSidebarEl = document.getElementById("wishlistCountSidebar");

  const cartItemsEl = document.getElementById("cartItems");
  const wishlistItemsEl = document.getElementById("wishlistItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const cartPopup = document.getElementById("cartPopup");
  const wishlistPopup = document.getElementById("wishlistPopup");

  const cartIcon = document.getElementById("cartIcon");
  const wishlistIcon = document.getElementById("wishlistIcon");
  const cartIconMobile = document.getElementById("cartIconMobile");
  const wishlistIconMobile = document.getElementById("wishlistIconMobile");
  const cartSidebarBtn = document.getElementById("cartSidebarBtn");
  const wishlistSidebarBtn = document.getElementById("wishlistSidebarBtn");

  // Mobile sidebar
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const closeSidebar = document.getElementById('closeSidebar');

  // Contact form
  const form = document.getElementById('contactForm');
  const successMessage = document.getElementById('successMessage');
  const serviceSelect = document.getElementById('service');

  // Init
  updateTotals();
  updateWishlistCount();
  setupHeaderEvents();
  setupSearch();
  setupFormFloatingLabels();
  setupScrollAnimations();
  setupMap();

  // Live sync across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) { cart = read(CART_KEY); updateTotals(); }
    if (e.key === WISHLIST_KEY) { wishlist = read(WISHLIST_KEY); updateWishlistCount(); }
  });

  // Helpers
  function read(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

  // Header events
  function setupHeaderEvents() {
    // Mobile sidebar
    function toggleMobileSidebar() {
      mobileMenuToggle.classList.toggle('active');
      mobileSidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
      document.body.style.overflow = mobileSidebar.classList.contains('active') ? 'hidden' : '';
    }
    function closeMobileSidebar() {
      mobileMenuToggle.classList.remove('active');
      mobileSidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    mobileMenuToggle?.addEventListener('click', toggleMobileSidebar);
    closeSidebar?.addEventListener('click', closeMobileSidebar);
    sidebarOverlay?.addEventListener('click', closeMobileSidebar);
    window.closeMobileSidebar = closeMobileSidebar;
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeMobileSidebar(); });

    // Popups
    [cartIcon, cartIconMobile, cartSidebarBtn].forEach(btn => btn?.addEventListener('click', () => {
      cartPopup?.classList.toggle('hidden');
      wishlistPopup?.classList.add('hidden');
      closeMobileSidebar();
    }));
    [wishlistIcon, wishlistIconMobile, wishlistSidebarBtn].forEach(btn => btn?.addEventListener('click', () => {
      wishlistPopup?.classList.toggle('hidden');
      cartPopup?.classList.add('hidden');
      closeMobileSidebar();
    }));
    document.addEventListener('click', (e) => {
      const isCartTrigger = e.target.closest('#cartIcon, #cartIconMobile, #cartSidebarBtn, .cart-button');
      const isWishlistTrigger = e.target.closest('#wishlistIcon, #wishlistIconMobile, #wishlistSidebarBtn, .wishlist-button');
      if (cartPopup && !cartPopup.contains(e.target) && !isCartTrigger) cartPopup.classList.add('hidden');
      if (wishlistPopup && !wishlistPopup.contains(e.target) && !isWishlistTrigger) wishlistPopup.classList.add('hidden');
    });

    // Dummy sidebar actions
    document.querySelector('.orders-btn')?.addEventListener('click', () => { alert('Orders functionality would go here'); closeMobileSidebar(); });
    document.querySelector('.profile-btn')?.addEventListener('click', () => { alert('Profile functionality would go here'); closeMobileSidebar(); });
  }

  // Search
  function setupSearch() {
    const sb = document.getElementById('searchBar');
    const msb = document.getElementById('mobileSearchBar');
    function go(q) { if (q.trim()) window.location.href = `product.html?search=${encodeURIComponent(q)}`; }
    sb?.addEventListener('keypress', e => { if (e.key === 'Enter') go(e.target.value); });
    msb?.addEventListener('keypress', e => { if (e.key === 'Enter') go(e.target.value); });
    document.querySelector('.search-btn')?.addEventListener('click', () => go(msb?.value || ''));
  }

  // Cart totals and UI
  function updateTotals() {
    totalCount = 0; totalAmount = 0;
    Object.keys(cart).forEach(name => {
      totalCount += cart[name].qty;
      totalAmount += cart[name].qty * cart[name].price;
    });

    cartCountEl && (cartCountEl.textContent = totalCount);
    cartCountMobileEl && (cartCountMobileEl.textContent = totalCount);
    cartCountSidebarEl && (cartCountSidebarEl.textContent = totalCount);
    cartTotalEl && (cartTotalEl.textContent = fmt(totalAmount));

    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = '';
    if (Object.keys(cart).length === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <div class="cart-empty-text">Your cart is empty</div>
          <div class="cart-empty-subtext">Add some products to get started!</div>
        </div>`;
      return;
    }
    for (const name in cart) {
      const item = cart[name];
      const itemTotal = item.qty * item.price;
      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.innerHTML = `
        <button class="cart-item-remove" onclick="removeItem('${name}')" title="Remove item">×</button>
        <div class="cart-item-content">
          <img src="${item.image}" alt="${name}" class="cart-item-image">
          <div class="cart-item-info">
            <div class="cart-item-name">${name}</div>
            <div class="cart-item-price">₹${fmt(item.price)} each</div>
          </div>
        </div>
        <div class="cart-controls-row">
          <div class="cart-quantity-controls">
            <button onclick="updateQuantity('${name}', -1)">−</button>
            <span class="cart-qty">${item.qty}</span>
            <button onclick="updateQuantity('${name}', 1)">+</button>
          </div>
          <div class="cart-item-total">₹${fmt(itemTotal)}</div>
        </div>`;
      cartItemsEl.appendChild(card);
    }
  }
  function updateWishlistCount() {
    const count = Object.keys(wishlist).length;
    wishlistCountEl && (wishlistCountEl.textContent = count);
    wishlistCountMobileEl && (wishlistCountMobileEl.textContent = count);
    wishlistCountSidebarEl && (wishlistCountSidebarEl.textContent = count);

    if (!wishlistItemsEl) return;
    wishlistItemsEl.innerHTML = '';
    if (count === 0) {
      wishlistItemsEl.innerHTML = `
        <div class="wishlist-empty">
          <div class="wishlist-empty-icon">♥</div>
          <div class="wishlist-empty-text">Your wishlist is empty</div>
          <div class="wishlist-empty-subtext">Add some products you love!</div>
        </div>`;
      return;
    }
    for (const name in wishlist) {
      const item = wishlist[name];
      const card = document.createElement('div');
      card.className = 'wishlist-item-card';
      card.innerHTML = `
        <button class="wishlist-item-remove" onclick="removeFromWishlist('${name}')" title="Remove from wishlist">×</button>
        <div class="wishlist-item-content">
          <img src="${item.image}" alt="${name}" class="wishlist-item-image">
          <div class="wishlist-item-info">
            <div class="wishlist-item-name">${name}</div>
            <div class="wishlist-item-price">₹${fmt(item.price)}</div>
          </div>
        </div>
        <div class="wishlist-controls-row">
          <button class="add-to-cart-btn" onclick="addToCartFromWishlist('${name}')">Add to Cart</button>
        </div>`;
      wishlistItemsEl.appendChild(card);
    }
  }

  // Popup ops exposed
  window.updateQuantity = (name, change) => {
    if (!cart[name]) return;
    cart[name].qty += change;
    if (cart[name].qty <= 0) delete cart[name];
    write(CART_KEY, cart);
    updateTotals();
  };
  window.removeItem = (name) => {
    if (!cart[name]) return;
    delete cart[name];
    write(CART_KEY, cart);
    updateTotals();
  };
  window.removeFromWishlist = (name) => {
    delete wishlist[name];
    write(WISHLIST_KEY, wishlist);
    updateWishlistCount();
  };
  window.addToCartFromWishlist = (name) => {
    const w = wishlist[name]; if (!w) return;
    if (!cart[name]) cart[name] = { qty: 0, price: w.price, image: w.image };
    cart[name].qty += 1;
    write(CART_KEY, cart);
    updateTotals();
  };
  window.clearWishlist = () => {
    wishlist = {}; write(WISHLIST_KEY, wishlist); updateWishlistCount();
  };
  window.closeCart = () => cartPopup?.classList.add('hidden');
  window.closeWishlist = () => wishlistPopup?.classList.add('hidden');

  // Floating labels for inputs/textarea only (not the select-group)
  function setupFormFloatingLabels() {
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => input.parentElement.classList.add('focused'));
      input.addEventListener('blur', () => {
        input.parentElement.classList.remove('focused');
        if (input.value.trim() !== '') input.parentElement.classList.add('filled');
        else input.parentElement.classList.remove('filled');
      });
    });

    // Select group uses static label — no floating needed
    serviceSelect?.addEventListener('change', () => {
      // nothing required; HTML5 will validate required/placeholder
    });
  }

  // Form submit + validation
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!validate(data)) return;

    const submitBtn = form.querySelector('.submit-btn');
    const original = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-text">Sending...</span>';
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.innerHTML = original;
      submitBtn.disabled = false;
      showSuccess();
      form.reset();
      // Clear floating state on inputs
      document.querySelectorAll('.form-group').forEach(g => g.classList.remove('focused','filled'));
    }, 1200);
  });

  function validate(data) {
    let ok = true;
    const need = ['firstName','lastName','email','service','message'];
    need.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const val = (data[id] || '').trim();
      if (!val) { showError(el, `${labelize(id)} is required`); ok = false; }
      else clearError(el);
    });
    if (data.email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const el = document.getElementById('email');
      if (!re.test(data.email)) { showError(el, 'Please enter a valid email address'); ok = false; }
      else clearError(el);
    }
    if (data.phone && data.phone.trim() !== '') {
      const rp = /^[\+]?[\d\s\-KATEX_INLINE_OPENKATEX_INLINE_CLOSE]+$/;
      const el = document.getElementById('phone');
      if (!rp.test(data.phone)) { showError(el, 'Please enter a valid phone number'); ok = false; }
      else clearError(el);
    }
    return ok;
  }
  function labelize(id) { return id.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()); }
  function showError(input, msg) {
    clearError(input);
    const err = document.createElement('span');
    err.className = 'error-message';
    err.textContent = msg;
    err.style.position = 'absolute';
    err.style.bottom = '-20px';
    err.style.left = '0';
    err.style.color = '#d32f2f';
    err.style.fontSize = '.9rem';
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(err);
    if (input.tagName !== 'SELECT') input.style.borderBottomColor = '#d32f2f';
  }
  function clearError(input) {
    const err = input.parentElement.querySelector('.error-message');
    if (err) err.remove();
    if (input.tagName !== 'SELECT') input.style.borderBottomColor = '#e0e0e0';
  }

  function showSuccess() {
    if (successMessage) {
      successMessage.style.display = 'flex';
      successMessage.style.animation = 'fadeIn .5s ease';
    }
  }
  window.closeSuccess = () => { const s = document.getElementById('successMessage'); if (s) s.style.display = 'none'; };

  // Animations on scroll
  function setupScrollAnimations() {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'slideInUp .8s ease forwards';
          o.unobserve(entry.target);
        }
      });
    }, { threshold: .1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.info-card, .contact-form-container, .map-container').forEach(el => {
      el.style.opacity = '0'; el.style.transform = 'translateY(50px)'; obs.observe(el);
    });
  }

  // Map open
  function setupMap() {
    document.querySelector('.map-container')?.addEventListener('click', () => {
      window.open('https://maps.google.com/', '_blank');
    });
  }
});