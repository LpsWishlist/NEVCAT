const WHATSAPP_PHONE = '+56952005962';
const STORAGE_KEY = 'nevcat_cart';

let cart = [];

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
    cartBadge.textContent = cart.length;

    if (cart.length === 0) {
        cartContent.innerHTML = '<p class="empty-msg">Tu carrito está vacío</p>';
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

        msg += `${name}\n`;
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

loadCart();

const track = document.getElementById('productsScroll');
const prevBtn = document.getElementById('scrollPrev');
const nextBtn = document.getElementById('scrollNext');
const productItems = track.querySelectorAll('.product-item');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let scrollFrame = null;
let updateQueued = false;
let dragState = null;
let suppressClick = false;

function maxScroll() {
    return track.scrollWidth - track.clientWidth;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function cancelScrollFrame() {
    if (scrollFrame !== null) {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = null;
    }
}

function interruptScroll() {
    cancelScrollFrame();
    track.classList.remove('is-moving');
}

function animateScrollTo(target, duration) {
    cancelScrollFrame();
    const start = track.scrollLeft;
    const end = Math.min(Math.max(target, 0), maxScroll());
    const distance = end - start;

    if (Math.abs(distance) < 1 || reduceMotion.matches) {
        track.scrollLeft = end;
        track.classList.remove('is-moving');
        return;
    }

    track.classList.add('is-moving');
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min(Math.max((now - startTime) / duration, 0), 1);
        track.scrollLeft = start + distance * easeInOutCubic(progress);

        if (progress < 1) {
            scrollFrame = requestAnimationFrame(step);
        } else {
            scrollFrame = null;
            track.classList.remove('is-moving');
        }
    }

    scrollFrame = requestAnimationFrame(step);
}

function snapPositions() {
    const padding = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const max = maxScroll();
    const positions = Array.from(productItems, item => Math.min(Math.max(item.offsetLeft - padding, 0), max));
    return positions.filter((position, index) => positions.indexOf(position) === index);
}

function scrollByStep(direction) {
    const current = track.scrollLeft;
    const positions = snapPositions();
    const target = direction > 0
        ? positions.find(position => position > current + 2)
        : positions.filter(position => position < current - 2).pop();

    if (target !== undefined) animateScrollTo(target, 700);
}

function updateCarousel() {
    updateQueued = false;
    const viewWidth = track.clientWidth;
    const scrollLeft = track.scrollLeft;

    const ratios = Array.from(productItems, item => {
        const left = item.offsetLeft - scrollLeft;
        const width = item.offsetWidth;
        const visible = Math.min(left + width, viewWidth) - Math.max(left, 0);
        return Math.min(Math.max(visible / width, 0), 1);
    });

    productItems.forEach((item, index) => {
        item.style.setProperty('--visible', ratios[index].toFixed(3));
    });

    prevBtn.disabled = scrollLeft <= 2;
    nextBtn.disabled = scrollLeft >= maxScroll() - 2;
}

function queueUpdate() {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(updateCarousel);
}

function onPointerDown(e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    interruptScroll();
    dragState = {
        startX: e.clientX,
        startScroll: track.scrollLeft,
        lastX: e.clientX,
        lastTime: performance.now(),
        velocity: 0,
        active: false
    };
}

function onPointerMove(e) {
    if (!dragState) return;
    const deltaX = e.clientX - dragState.startX;

    if (!dragState.active) {
        if (Math.abs(deltaX) < 6) return;
        dragState.active = true;
        track.classList.add('is-dragging', 'is-moving');
        track.setPointerCapture(e.pointerId);
    }

    const now = performance.now();
    const elapsed = now - dragState.lastTime;
    if (elapsed > 0) {
        const instant = (dragState.lastX - e.clientX) / elapsed;
        dragState.velocity = dragState.velocity * 0.6 + instant * 0.4;
    }
    dragState.lastX = e.clientX;
    dragState.lastTime = now;
    track.scrollLeft = dragState.startScroll - deltaX;
}

function onPointerUp() {
    if (!dragState) return;
    const state = dragState;
    dragState = null;
    if (!state.active) return;

    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    track.classList.remove('is-dragging');

    const idle = performance.now() - state.lastTime;
    const velocity = idle > 80 ? 0 : state.velocity;
    const projected = track.scrollLeft + velocity * 320;
    const positions = snapPositions();
    const target = positions.reduce((best, position) => {
        return Math.abs(position - projected) < Math.abs(best - projected) ? position : best;
    }, positions[0]);

    animateScrollTo(target, 650);
}

prevBtn.addEventListener('click', () => scrollByStep(-1));
nextBtn.addEventListener('click', () => scrollByStep(1));

track.addEventListener('scroll', queueUpdate, { passive: true });
track.addEventListener('wheel', interruptScroll, { passive: true });
track.addEventListener('touchstart', interruptScroll, { passive: true });
track.addEventListener('pointerdown', onPointerDown);
track.addEventListener('pointermove', onPointerMove);
track.addEventListener('pointerup', onPointerUp);
track.addEventListener('pointercancel', onPointerUp);
track.addEventListener('dragstart', (e) => e.preventDefault());
track.addEventListener('click', (e) => {
    if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
    }
}, true);

window.addEventListener('resize', queueUpdate);

updateCarousel();

const previewOverlay = document.getElementById('previewOverlay');
const previewFrame = document.getElementById('previewFrame');
const previewTitle = document.getElementById('previewTitle');
const closePreviewBtn = document.getElementById('closePreview');

function openPreview(plan, name) {
    previewTitle.textContent = `Vista previa: ${name}`;
    previewFrame.src = `vista-previa/index.html?plan=${encodeURIComponent(plan)}`;
    previewOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    previewOverlay.classList.remove('active');
    previewFrame.src = 'about:blank';
    document.body.style.overflow = 'auto';
}

document.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        openPreview(btn.dataset.plan, btn.closest('.card').querySelector('h3').textContent);
    });
});

closePreviewBtn.addEventListener('click', closePreview);

previewOverlay.addEventListener('click', (e) => {
    if (e.target === previewOverlay) closePreview();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && previewOverlay.classList.contains('active')) closePreview();
});
