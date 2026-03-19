document.addEventListener("DOMContentLoaded", () => {
    // --- STATE MANAGEMENT WITH LOCALSTORAGE SYNC ---
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

    // Cart and wishlist buttons
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

    // --- INITIALIZATION ---
    initializeFromStorage();
    setupEventListeners();

    // --- STORAGE SYNC FUNCTIONS ---
    function saveToStorage() {
        localStorage.setItem('sportstechCart', JSON.stringify(cart));
        localStorage.setItem('sportstechWishlist', JSON.stringify(wishlist));
    }

    function initializeFromStorage() {
        // Initialize product cards based on stored data
        document.querySelectorAll(".product-card").forEach(card => {
            const name = card.dataset.name;
            
            // Initialize cart state
            if (cart[name]) {
                const addBtn = card.querySelector(".add-btn");
                const quantityControl = card.querySelector(".quantity-control");
                const qtyDisplay = card.querySelector(".qty");
                
                if (addBtn && quantityControl && qtyDisplay) {
                    addBtn.classList.add("hidden");
                    quantityControl.classList.remove("hidden");
                    qtyDisplay.textContent = cart[name].qty;
                }
            }
            
            // Initialize wishlist state
            if (wishlist[name]) {
                const heartBtn = card.querySelector('.wishlist-heart');
                if (heartBtn) {
                    heartBtn.textContent = '♥';
                    heartBtn.classList.add('active');
                }
            }
        });
        
        updateTotals();
        updateWishlistCount();
    }

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

        // Setup product cards
        setupProductCards();

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
    }

    // --- PRODUCT CARD FUNCTIONALITY ---
    function setupProductCards() {
        document.querySelectorAll(".product-card").forEach(card => {
            const name = card.dataset.name;
            const price = parseInt(card.dataset.price);
            const image = card.dataset.image;

            // Get button and display elements for this card
            const addBtn = card.querySelector(".add-btn");
            const quantityControl = card.querySelector(".quantity-control");
            const lessBtn = card.querySelector(".less");
            const addMoreBtn = card.querySelector(".add");
            const qtyDisplay = card.querySelector(".qty");

            if (!addBtn || !quantityControl || !lessBtn || !addMoreBtn || !qtyDisplay) return;

            // Click on the initial "ADD" button
            addBtn.addEventListener("click", () => {
                if (!cart[name]) {
                    cart[name] = { qty: 1, price: price, image: image };
                } else {
                    cart[name].qty++;
                }
                
                addBtn.classList.add("hidden");
                quantityControl.classList.remove("hidden");
                qtyDisplay.textContent = cart[name].qty;
                
                saveToStorage();
                updateTotals();
            });

            // Click on the "+" button in the quantity control
            addMoreBtn.addEventListener("click", () => {
                cart[name].qty++;
                qtyDisplay.textContent = cart[name].qty;
                saveToStorage();
                updateTotals();
            });

            // Click on the "-" button in the quantity control
            lessBtn.addEventListener("click", () => {
                if (cart[name].qty > 1) {
                    cart[name].qty--;
                    qtyDisplay.textContent = cart[name].qty;
                } else {
                    delete cart[name];
                    addBtn.classList.remove("hidden");
                    quantityControl.classList.add("hidden");
                }
                saveToStorage();
                updateTotals();
            });
        });
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

    // --- WISHLIST FUNCTIONALITY ---
    function toggleWishlistHeart(productName) {
        const productCard = document.querySelector(`[data-name="${productName}"]`);
        if (!productCard) return;

        const heartBtn = productCard.querySelector('.wishlist-heart');
        if (!heartBtn) return;
        
        if (wishlist[productName]) {
            // Remove from wishlist
            delete wishlist[productName];
            heartBtn.textContent = '♡';
            heartBtn.classList.remove('active');
        } else {
            // Add to wishlist
            const price = parseInt(productCard.dataset.price);
            const image = productCard.dataset.image;
            wishlist[productName] = { price: price, image: image };
            heartBtn.textContent = '♥';
            heartBtn.classList.add('active');
        }
        
        saveToStorage();
        updateWishlistCount();
    }

    function updateWishlistCount() {
        wishlistCount = Object.keys(wishlist).length;
        
        // Update all wishlist count displays
        if (wishlistCountEl) wishlistCountEl.textContent = wishlistCount;
        if (wishlistCountMobileEl) wishlistCountMobileEl.textContent = wishlistCount;
        if (wishlistCountSidebarEl) wishlistCountSidebarEl.textContent = wishlistCount;
        
        updateWishlistDisplay();
    }

    function updateWishlistDisplay() {
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

    function removeFromWishlist(productName) {
        delete wishlist[productName];
        
        // Update the heart icon
        const productCard = document.querySelector(`[data-name="${productName}"]`);
        if (productCard) {
            const heartBtn = productCard.querySelector('.wishlist-heart');
            if (heartBtn) {
                heartBtn.textContent = '♡';
                heartBtn.classList.remove('active');
            }
        }
        
        saveToStorage();
        updateWishlistCount();
    }

    function addToCartFromWishlist(productName) {
        if (wishlist[productName]) {
            const item = wishlist[productName];
            
            if (!cart[productName]) {
                cart[productName] = { qty: 1, price: item.price, image: item.image };
            } else {
                cart[productName].qty++;
            }
            
            // Update product card display
            const productCard = document.querySelector(`[data-name="${productName}"]`);
            if (productCard) {
                const addBtn = productCard.querySelector(".add-btn");
                const quantityControl = productCard.querySelector(".quantity-control");
                const qtyDisplay = productCard.querySelector(".qty");
                
                if (addBtn && quantityControl && qtyDisplay) {
                    addBtn.classList.add("hidden");
                    quantityControl.classList.remove("hidden");
                    qtyDisplay.textContent = cart[productName].qty;
                }
            }
            
            saveToStorage();
            updateTotals();
        }
    }

    function clearWishlistItems() {
        // Reset all heart icons
        document.querySelectorAll('.wishlist-heart').forEach(heart => {
            heart.textContent = '♡';
            heart.classList.remove('active');
        });
        
        wishlist = {};
        saveToStorage();
        updateWishlistCount();
    }

    // --- CART CONTROL FUNCTIONS ---
    function updateCartQuantity(itemName, change) {
        if (cart[itemName]) {
            cart[itemName].qty += change;
            
            if (cart[itemName].qty <= 0) {
                delete cart[itemName];
                
                // Update the main product card display
                const productCard = document.querySelector(`[data-name="${itemName}"]`);
                if (productCard) {
                    const addBtn = productCard.querySelector(".add-btn");
                    const quantityControl = productCard.querySelector(".quantity-control");
                    if (addBtn && quantityControl) {
                        addBtn.classList.remove("hidden");
                        quantityControl.classList.add("hidden");
                    }
                }
            } else {
                // Update the main product card display
                const productCard = document.querySelector(`[data-name="${itemName}"]`);
                if (productCard) {
                    const qtyDisplay = productCard.querySelector(".qty");
                    if (qtyDisplay) {
                        qtyDisplay.textContent = cart[itemName].qty;
                    }
                }
            }
            
            saveToStorage();
            updateTotals();
        }
    }

    function removeCartItem(itemName) {
        delete cart[itemName];
        
        // Update the main product card display
        const productCard = document.querySelector(`[data-name="${itemName}"]`);
        if (productCard) {
            const addBtn = productCard.querySelector(".add-btn");
            const quantityControl = productCard.querySelector(".quantity-control");
            if (addBtn && quantityControl) {
                addBtn.classList.remove("hidden");
                quantityControl.classList.add("hidden");
            }
        }
        
        saveToStorage();
        updateTotals();
    }

    // --- CORE FUNCTIONS ---
    function updateTotals() {
        totalCount = 0;
        totalAmount = 0;

        for (const itemName in cart) {
            totalCount += cart[itemName].qty;
            totalAmount += cart[itemName].qty * cart[itemName].price;
        }

        updateCartDisplay();
    }

    function updateCartDisplay() {
        // Update navbar cart counts
        if (cartCountEl) cartCountEl.textContent = totalCount;
        if (cartCountMobileEl) cartCountMobileEl.textContent = totalCount;
        if (cartCountSidebarEl) cartCountSidebarEl.textContent = totalCount;

        // Update total amount in popup
        if (cartTotalEl) cartTotalEl.textContent = totalAmount.toLocaleString();

        // Clear and rebuild the cart items
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
                    filterProducts(searchTerm);
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
            filterProducts(query.toLowerCase());
        }
    }

    function filterProducts(searchTerm) {
        const allProductCards = document.querySelectorAll(".product-card");
        
        allProductCards.forEach(card => {
            const productName = card.dataset.name.toLowerCase();
            
            if (productName.includes(searchTerm)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    }

    // --- STORAGE EVENT LISTENERS ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'sportstechCart') {
            cart = JSON.parse(e.newValue) || {};
            initializeFromStorage();
        }
        if (e.key === 'sportstechWishlist') {
            wishlist = JSON.parse(e.newValue) || {};
            initializeFromStorage();
        }
    });

    // --- GLOBAL FUNCTIONS FOR ONCLICK HANDLERS ---
    window.updateQuantity = (itemName, change) => {
        updateCartQuantity(itemName, change);
    };

    window.removeItem = (itemName) => {
        removeCartItem(itemName);
    };

    window.toggleWishlist = (productName) => {
        toggleWishlistHeart(productName);
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

    // --- ADDITIONAL FUNCTIONALITY ---
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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

    // Add functionality for sidebar buttons
    document.querySelector('.orders-btn')?.addEventListener('click', function() {
        alert('Orders functionality would go here');
        closeMobileSidebar();
    });
    
    document.querySelector('.profile-btn')?.addEventListener('click', function() {
        alert('Profile functionality would go here');
        closeMobileSidebar();
    });
});