// =============================================
// CONFIGURACIÓN
// =============================================

const WHATSAPP_PHONE = '+56952005962';
const STORAGE_KEY = 'nevcat_cart';

let cart = [];

// =============================================
// ELEMENTOS DEL DOM
// =============================================

const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartCount');
const cartOverlay = document.getElementById('cartOverlay');
const cartPanel = document.getElementById('cartPanel');
const closeCartBtn = document.getElementById('closeCart');
const cartContent = document.getElementById('cartContent');
const cartCheckout = document.getElementById('cartCheckout');
const checkoutBtn = document.getElementById('checkoutBtn');
const totalPrice = document.getElementById('totalPrice');

const buyBtns = document.querySelectorAll('.buy-btn');

// =============================================
// CARRITO - FUNCIONES PRINCIPALES
// =============================================

function loadCart() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            cart = [];
        }
    }
    updateUI();
}

function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(id, name, price) {
    cart.push({
        id: id,
        name: name,
        price: price,
        timestamp: Date.now()
    });
    saveCart();
    updateUI();
}

function removeFromCart(timestamp) {
    cart = cart.filter(item => item.timestamp !== timestamp);
    saveCart();
    updateUI();
}

function updateUI() {
    // Actualizar badge
    cartBadge.textContent = cart.length;
    
    // Actualizar contenido
    if (cart.length === 0) {
        cartContent.innerHTML = '<p class="empty-msg">Tu carrito está vacío 💔</p>';
        cartCheckout.style.display = 'none';
    } else {
        renderCartItems();
        cartCheckout.style.display = 'block';
        updateTotal();
    }
}

function renderCartItems() {
    cartContent.innerHTML = '';
    
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        
        const priceDisplay = item.price === 'LPS' 
            ? '1 de 2 LPS' 
            : `$${item.price.toLocaleString('es-CL')}`;
        
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${priceDisplay}</p>
            </div>
            <button class="cart-item-remove" data-timestamp="${item.timestamp}">
                ✕
            </button>
        `;
        
        cartContent.appendChild(div);
    });
    
    // Event listeners
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            removeFromCart(parseInt(e.currentTarget.dataset.timestamp));
        });
    });
}

function updateTotal() {
    const total = cart.reduce((sum, item) => {
        return item.price === 'LPS' ? sum : sum + item.price;
    }, 0);
    
    totalPrice.textContent = total > 0 ? `$${total.toLocaleString('es-CL')}` : 'Consultar';
}

// =============================================
// MODAL DEL CARRITO
// =============================================

function openCart() {
    cartOverlay.classList.add('active');
    cartPanel.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartOverlay.classList.remove('active');
    cartPanel.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =============================================
// WHATSAPP
// =============================================

function generateMessage() {
    let msg = '*¡Hola! Quiero comprar:*\n\n';
    
    const grouped = {};
    cart.forEach(item => {
        if (!grouped[item.name]) {
            grouped[item.name] = { count: 0, price: item.price };
        }
        grouped[item.name].count++;
    });
    
    Object.entries(grouped).forEach(([name, data]) => {
        const priceText = data.price === 'LPS' 
            ? '(1 de 2 LPS)' 
            : `$${data.price.toLocaleString('es-CL')}`;
        
        msg += `📦 ${name}\n`;
        msg += `   x${data.count} - ${priceText}\n\n`;
    });
    
    const total = cart.reduce((sum, item) => {
        return item.price === 'LPS' ? sum : sum + item.price;
    }, 0);
    
    if (total > 0 || cart.some(item => item.price === 'LPS')) {
        msg += '---\n*Total:* ';
        if (total > 0) msg += `$${total.toLocaleString('es-CL')}`;
        if (cart.some(item => item.price === 'LPS')) {
            msg += (total > 0 ? ' + ' : '') + '1 de 2 LPS';
        }
    }
    
    return msg;
}

function sendToWhatsApp() {
    if (cart.length === 0) return;
    
    const message = generateMessage();
    const encoded = encodeURIComponent(message);
    const phone = WHATSAPP_PHONE.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encoded}`;
    
    window.open(url, '_blank');
}

// =============================================
// EVENT LISTENERS
// =============================================

cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
checkoutBtn.addEventListener('click', sendToWhatsApp);

buyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = btn.dataset.price === 'LPS' ? 'LPS' : parseInt(btn.dataset.price);
        
        addToCart(id, name, price);
        openCart();
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
});

// =============================================
// INICIALIZACIÓN
// =============================================

loadCart();
