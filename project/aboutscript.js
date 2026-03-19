document.addEventListener("DOMContentLoaded", () => {
    // --- CART AND WISHLIST STATE MANAGEMENT ---
    let cart = JSON.parse(localStorage.getItem('sportstechCart')) || {};
    let wishlist = JSON.parse(localStorage.getItem('sportstechWishlist')) || {};
    let totalCount = 0;
    let totalAmount = 0;
    let wishlistCount = 0;

    // --- DOM ELEMENTS ---
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

    // Mobile menu elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');

    // --- MOBILE MENU FUNCTIONALITY ---
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

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        // Mobile menu events
        if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
        if (closeSidebar) closeSidebar.addEventListener('click', closeMobileSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

        // Cart icon events
        if (cartIcon) cartIcon.addEventListener("click", toggleCart);
        if (cartIconMobile) cartIconMobile.addEventListener("click", toggleCart);
        if (cartSidebarBtn) cartSidebarBtn.addEventListener("click", () => {
            toggleCart();
            closeMobileSidebar();
        });

        // Wishlist icon events
        if (wishlistIcon) wishlistIcon.addEventListener("click", toggleWishlist);
        if (wishlistIconMobile) wishlistIconMobile.addEventListener("click", toggleWishlist);
        if (wishlistSidebarBtn) wishlistSidebarBtn.addEventListener("click", () => {
            toggleWishlist();
            closeMobileSidebar();
        });

        // Search functionality
        setupSearch();

        // Close popups when clicking outside
        document.addEventListener('click', handleOutsideClick);

        // Window resize handler
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeMobileSidebar();
            }
        });

        // Additional sidebar buttons
        document.querySelector('.orders-btn')?.addEventListener('click', function() {
            alert('Orders functionality would go here');
            closeMobileSidebar();
        });
        
        document.querySelector('.profile-btn')?.addEventListener('click', function() {
            alert('Profile functionality would go here');
            closeMobileSidebar();
        });
    }

    // --- INITIALIZATION ---
    initializeFromStorage();
    setupEventListeners();

    // --- STORAGE SYNC FUNCTIONS ---
    function initializeFromStorage() {
        updateCartDisplay();
        updateWishlistDisplay();
    }

    // --- POPUP FUNCTIONALITY ---
    function toggleCart() {
        if (cartPopup) {
            cartPopup.classList.toggle("hidden");
            if (wishlistPopup && !cartPopup.classList.contains("hidden")) {
                wishlistPopup.classList.add("hidden");
            }
        }
    }

    function toggleWishlist() {
        if (wishlistPopup) {
            wishlistPopup.classList.toggle("hidden");
            if (cartPopup && !wishlistPopup.classList.contains("hidden")) {
                cartPopup.classList.add("hidden");
            }
        }
    }

    function closeCart() {
        if (cartPopup) cartPopup.classList.add("hidden");
    }

    function closeWishlist() {
        if (wishlistPopup) wishlistPopup.classList.add("hidden");
    }

    function handleOutsideClick(event) {
        if (cartPopup && !cartPopup.contains(event.target) && !event.target.closest('.cart-button')) {
            cartPopup.classList.add('hidden');
        }
        
        if (wishlistPopup && !wishlistPopup.contains(event.target) && !event.target.closest('.wishlist-button')) {
            wishlistPopup.classList.add('hidden');
        }
    }

    // --- CART FUNCTIONS ---
    function updateCartQuantity(itemName, change) {
        if (cart[itemName]) {
            cart[itemName].qty += change;
            
            if (cart[itemName].qty <= 0) {
                delete cart[itemName];
            }
            
            localStorage.setItem('sportstechCart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }

    function removeCartItem(itemName) {
        delete cart[itemName];
        localStorage.setItem('sportstechCart', JSON.stringify(cart));
        updateCartDisplay();
    }

    function updateCartDisplay() {
        totalCount = 0;
        totalAmount = 0;

        for (const itemName in cart) {
            totalCount += cart[itemName].qty;
            totalAmount += cart[itemName].qty * cart[itemName].price;
        }

        // Update all cart count displays
        if (cartCountEl) cartCountEl.textContent = totalCount;
        if (cartCountMobileEl) cartCountMobileEl.textContent = totalCount;
        if (cartCountSidebarEl) cartCountSidebarEl.textContent = totalCount;
        if (cartTotalEl) cartTotalEl.textContent = totalAmount.toLocaleString();

        if (!cartItemsEl) return;

        cartItemsEl.innerHTML = "";
        
        if (Object.keys(cart).length === 0) {
            cartItemsEl.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <div class="cart-empty-text">Your cart is empty</div>
                    <div class="cart-empty-subtext">Add some products to get started!</div>
                </div>
            `;
        } else {
            for (let item in cart) {
                const itemTotal = cart[item].qty * cart[item].price;
                
                const cartItemCard = document.createElement("div");
                cartItemCard.className = "cart-item-card";
                
                cartItemCard.innerHTML = `
                    <button class="cart-item-remove" onclick="removeItem('${item}')" title="Remove item">×</button>
                    <div class="cart-item-content">
                        <img src="${cart[item].image}" alt="${item}" class="cart-item-image">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item}</div>
                            <div class="cart-item-price">₹${cart[item].price.toLocaleString()} each</div>
                        </div>
                    </div>
                    <div class="cart-controls-row">
                        <div class="cart-quantity-controls">
                            <button onclick="updateQuantity('${item}', -1)">−</button>
                            <span class="cart-qty">${cart[item].qty}</span>
                            <button onclick="updateQuantity('${item}', 1)">+</button>
                        </div>
                        <div class="cart-item-total">₹${itemTotal.toLocaleString()}</div>
                    </div>
                `;
                
                cartItemsEl.appendChild(cartItemCard);
            }
        }
    }

    // --- WISHLIST FUNCTIONS ---
    function removeFromWishlist(productName) {
        delete wishlist[productName];
        localStorage.setItem('sportstechWishlist', JSON.stringify(wishlist));
        updateWishlistDisplay();
    }

    function addToCartFromWishlist(productName) {
        if (wishlist[productName]) {
            const item = wishlist[productName];
            
            if (!cart[productName]) {
                cart[productName] = { qty: 1, price: item.price, image: item.image };
            } else {
                cart[productName].qty++;
            }
            
            localStorage.setItem('sportstechCart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }

    function clearWishlistItems() {
        wishlist = {};
        localStorage.setItem('sportstechWishlist', JSON.stringify(wishlist));
        updateWishlistDisplay();
    }

    function updateWishlistDisplay() {
        wishlistCount = Object.keys(wishlist).length;
        
        // Update all wishlist count displays
        if (wishlistCountEl) wishlistCountEl.textContent = wishlistCount;
        if (wishlistCountMobileEl) wishlistCountMobileEl.textContent = wishlistCount;
        if (wishlistCountSidebarEl) wishlistCountSidebarEl.textContent = wishlistCount;

        if (!wishlistItemsEl) return;

        wishlistItemsEl.innerHTML = "";
        
        if (Object.keys(wishlist).length === 0) {
            wishlistItemsEl.innerHTML = `
                <div class="wishlist-empty">
                    <div class="wishlist-empty-icon">♥</div>
                    <div class="wishlist-empty-text">Your wishlist is empty</div>
                    <div class="wishlist-empty-subtext">Add some products you love!</div>
                </div>
            `;
        } else {
            for (let item in wishlist) {
                const wishlistItemCard = document.createElement("div");
                wishlistItemCard.className = "wishlist-item-card";
                
                wishlistItemCard.innerHTML = `
                    <button class="wishlist-item-remove" onclick="removeFromWishlist('${item}')" title="Remove from wishlist">×</button>
                    <div class="wishlist-item-content">
                        <img src="${wishlist[item].image}" alt="${item}" class="wishlist-item-image">
                        <div class="wishlist-item-info">
                            <div class="wishlist-item-name">${item}</div>
                            <div class="wishlist-item-price">₹${wishlist[item].price.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="wishlist-controls-row">
                        <button class="add-to-cart-btn" onclick="addToCartFromWishlist('${item}')">Add to Cart</button>
                    </div>
                `;
                
                wishlistItemsEl.appendChild(wishlistItemCard);
            }
        }
    }

    // --- SEARCH FUNCTIONALITY ---
    function setupSearch() {
        const searchInputs = [
            document.getElementById('searchBar'),
            document.getElementById('mobileSearchBar')
        ];

        searchInputs.forEach(input => {
            if (input) {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        performSearch(this.value);
                    }
                });

                input.addEventListener('input', function(e) {
                    const searchTerm = e.target.value.toLowerCase();
                    // For about page, we can redirect to product page with search
                    if (searchTerm.length > 2) {
                        // You can implement search functionality here
                        console.log('Searching for:', searchTerm);
                    }
                });
            }
        });

        // Search button in sidebar
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                const mobileSearchBar = document.getElementById('mobileSearchBar');
                if (mobileSearchBar) {
                    performSearch(mobileSearchBar.value);
                }
            });
        }
    }

    function performSearch(query) {
        if (query.trim()) {
            // Redirect to product page with search query
            window.location.href = `product.html?search=${encodeURIComponent(query)}`;
        }
    }

    // --- STORAGE EVENT LISTENER FOR REAL-TIME SYNC ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'sportstechCart') {
            cart = JSON.parse(e.newValue) || {};
            updateCartDisplay();
        }
        if (e.key === 'sportstechWishlist') {
            wishlist = JSON.parse(e.newValue) || {};
            updateWishlistDisplay();
        }
    });

    // Make functions global for onclick handlers
    window.updateQuantity = (itemName, change) => {
        updateCartQuantity(itemName, change);
    };

    window.removeItem = (itemName) => {
        removeCartItem(itemName);
    };

    window.removeFromWishlist = (productName) => {
        removeFromWishlist(productName);
    };

    window.addToCartFromWishlist = (productName) => {
        addToCartFromWishlist(productName);
    };

    window.clearWishlist = () => {
        clearWishlistItems();
    };

    window.closeCart = () => {
        closeCart();
    };

    window.closeWishlist = () => {
        closeWishlist();
    };

    window.closeMobileSidebar = () => {
        closeMobileSidebar();
    };

    // --- EXISTING ABOUT PAGE ANIMATIONS ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = entry.target.dataset.animation || 'fadeInUp 1s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-count'));
                    const duration = 2500;
                    const step = target / (duration / 16);
                    let current = 0;
                    
                    const timer = setInterval(() => {
                        current += step;
                        counter.textContent = Math.floor(current);
                        
                        if (current >= target) {
                            counter.textContent = target;
                            clearInterval(timer);
                        }
                    }, 16);
                    
                    counterObserver.unobserve(counter);
                }
            });
        }, observerOptions);
        
        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    function initParallax() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const background = document.querySelector('.background-animation');
            if (background) {
                background.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }

    function initCardAnimations() {
        const cards = document.querySelectorAll('.stat-card, .team-card');
        
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.transform = 'translateY(0)';
                        entry.target.style.opacity = '1';
                    }, index * 200);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        cards.forEach(card => {
            cardObserver.observe(card);
        });
    }

    // Initialize existing animations
    animateCounters();
    initParallax();
    initCardAnimations();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Close sidebar when clicking on navigation links
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', closeMobileSidebar);
    });
});