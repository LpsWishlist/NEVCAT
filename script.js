// =============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// =============================================

const WHATSAPP_PHONE = '+56952005962';
const STORAGE_KEY = 'nevcat_cart';

let cart = [];

// =============================================
// ELEMENTOS DEL DOM
// =============================================

const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCartBtn');
const modalOverlay = document.getElementById('modalOverlay');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartSummary = document.getElementById('cartSummary');
const cartTotal = document.getElementById('cartTotal');
const buyBtn = document.getElementById('buyBtn');

const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
const infoBtns = document.querySelectorAll('.info-btn');
const infoDescriptions = document.querySelectorAll('.info-description');

// =============================================
// FUNCIONES DEL CARRITO
// =============================================

// Cargar carrito del localStorage
function loadCart() {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartUI();
        } catch (e) {
            cart = [];
        }
    }
}

// Guardar carrito en localStorage
function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

// Agregar producto al carrito
function addToCart(id, name, price) {
    const product = {
        id: id,
        name: name,
        price: price,
        timestamp: Date.now()
    };
    
    cart.push(product);
    saveCart();
    updateCartUI();
    
    // Efecto visual al agregar
    showAddedNotification();
}

// Eliminar producto del carrito
function removeFromCart(timestamp) {
    cart = cart.filter(item => item.timestamp !== timestamp);
    saveCart();
    updateCartUI();
}

// Actualizar UI del carrito
function updateCartUI() {
    // Actualizar contador
    cartCount.textContent = cart.length;
    
    // Actualizar contenedor de items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío</p>';
        cartSummary.style.display = 'none';
    } else {
        renderCartItems();
        cartSummary.style.display = 'block';
        updateCartTotal();
    }
}

// Renderizar items del carrito
function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        const priceDisplay = item.price === 'LPS' 
            ? '1 de 2 LPS específicos' 
            : `$${item.price.toLocaleString('es-CL')}`;
        
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${priceDisplay}</div>
            </div>
            <button class="cart-item-remove" data-timestamp="${item.timestamp}">
                ✕
            </button>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Agregar event listeners a botones de eliminar
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const timestamp = parseInt(e.currentTarget.dataset.timestamp);
            removeFromCart(timestamp);
        });
    });
}

// Actualizar total del carrito
function updateCartTotal() {
    const total = cart.reduce((sum, item) => {
        if (item.price !== 'LPS') {
            return sum + item.price;
        }
        return sum;
    }, 0);
    
    if (total > 0) {
        cartTotal.textContent = `$${total.toLocaleString('es-CL')}`;
    } else {
        // Si hay items pero todos son LPS
        cartTotal.textContent = 'Consultar precio';
    }
}

// Mostrar notificación de producto agregado
function showAddedNotification() {
    // Animación visual del botón del carrito
    cartBtn.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cartBtn.style.transform = 'scale(1)';
    }, 200);
}

// =============================================
// FUNCIONES DEL MODAL
// =============================================

function openCart() {
    cartModal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartModal.classList.remove('active');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// =============================================
// INTEGRACIÓN CON WHATSAPP
// =============================================

function generateWhatsAppMessage() {
    let message = '*¡Hola! Quiero comprar estos productos de NevCat:*\n\n';
    
    let totalPrice = 0;
    let hasLPS = false;
    
    // Agrupar productos por tipo
    const groupedCart = {};
    
    cart.forEach(item => {
        if (!groupedCart[item.name]) {
            groupedCart[item.name] = {
                count: 0,
                price: item.price
            };
        }
        groupedCart[item.name].count++;
    });
    
    // Construir mensaje
    Object.entries(groupedCart).forEach(([name, data]) => {
        const priceText = data.price === 'LPS' 
            ? '(1 de 2 LPS específicos)'
            : `$${data.price.toLocaleString('es-CL')}`;
        
        message += `📦 ${name}\n`;
        message += `   Cantidad: ${data.count}x\n`;
        message += `   Precio: ${priceText}\n\n`;
        
        if (data.price !== 'LPS') {
            totalPrice += data.price * data.count;
        } else {
            hasLPS = true;
        }
    });
    
    message += '*---*\n\n';
    
    if (totalPrice > 0) {
        message += `*Total:* $${totalPrice.toLocaleString('es-CL')}`;
        if (hasLPS) {
            message += ` + 1 de 2 LPS específicos`;
        }
    } else if (hasLPS) {
        message += `*Total:* 1 de 2 LPS específicos`;
    }
    
    message += '\n\n¿Podemos proceder con la compra?';
    
    return message;
}

function sendToWhatsApp() {
    if (cart.length === 0) {
        alert('Por favor, agrega productos al carrito antes de comprar');
        return;
    }
    
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_PHONE.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

// =============================================
// FUNCIONES DE INFORMACIÓN INTERACTIVA
// =============================================

function setupInfoCategories() {
    infoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            // Actualizar botones activos
            infoBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Actualizar descripciones
            infoDescriptions.forEach(desc => {
                desc.classList.remove('active');
            });
            
            const activeDesc = document.querySelector(
                `.info-description[data-category="${category}"]`
            );
            if (activeDesc) {
                activeDesc.classList.add('active');
            }
        });
    });
}

// =============================================
// EVENT LISTENERS
// =============================================

// Botón del carrito
cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
modalOverlay.addEventListener('click', closeCart);

// Botón comprar
buyBtn.addEventListener('click', sendToWhatsApp);

// Botones agregar al carrito
addToCartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = btn.dataset.price === 'LPS' ? 'LPS' : parseInt(btn.dataset.price);
        
        addToCart(id, name, price);
    });
});

// Cierre de modal al presionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartModal.classList.contains('active')) {
        closeCart();
    }
});

// Scroll horizontal suave en móviles
const productsScroll = document.getElementById('productsScroll');
let isDown = false;
let startX;
let scrollLeft;

productsScroll.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - productsScroll.offsetLeft;
    scrollLeft = productsScroll.scrollLeft;
});

productsScroll.addEventListener('mouseleave', () => {
    isDown = false;
});

productsScroll.addEventListener('mouseup', () => {
    isDown = false;
});

productsScroll.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - productsScroll.offsetLeft;
    const walk = (x - startX) * 1;
    productsScroll.scrollLeft = scrollLeft - walk;
});

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    setupInfoCategories();
});

// Cerrar carrito si se hace click fuera del modal
document.addEventListener('click', (e) => {
    if (cartModal.classList.contains('active') && 
        !cartModal.contains(e.target) && 
        e.target !== cartBtn &&
        !cartBtn.contains(e.target)) {
        // No cerrar si está dentro del modal
    }
});
