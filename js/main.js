const CART_KEY = 'chashiCart';
const currencyFormatter = new Intl.NumberFormat('ru-RU');

document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    initMobileMenu();
    updateCartCount();
    initAddToCartButtons();
    initEventQuickSelect();
    initCatalogFilters();
    initForms();
    initProductGallery();
    renderCart();
    initCheckout();
});

function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a:not(.cart-link)').forEach((link) => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === currentPath);
    });
}

function initMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (!toggleBtn || !navMenu) return;

    const closeMenu = () => {
        navMenu.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
    };

    toggleBtn.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('menu-open', isOpen);
    });

    navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
        if (!navMenu.classList.contains('active')) return;
        const isInsideMenu = navMenu.contains(event.target);
        const isToggle = toggleBtn.contains(event.target);
        if (!isInsideMenu && !isToggle) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });
}

function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = Number.parseInt(btn.dataset.price, 10);

            if (!id || !name || Number.isNaN(price)) return;
            addToCart({ id, name, price, quantity: 1 });
            showToast(`Добавили «${name}» в корзину`);
        });
    });
}

function initEventQuickSelect() {
    document.querySelectorAll('.register-event').forEach((btn) => {
        btn.addEventListener('click', () => {
            const eventName = btn.dataset.event;
            const select = document.getElementById('event-select');
            if (!select || !eventName) return;

            [...select.options].forEach((option) => {
                if (option.textContent.includes(eventName)) {
                    option.selected = true;
                }
            });

            document.querySelector('.registration-form')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            showToast('Событие выбрано в форме');
        });
    });
}

function initCatalogFilters() {
    const catalogGrid = document.getElementById('catalog-grid');
    const resultsElement = document.getElementById('catalog-results');
    const priceRange = document.getElementById('price-range');
    const priceOutput = document.getElementById('price-output');

    if (!catalogGrid || !resultsElement || !priceRange || !priceOutput) return;

    const cards = [...catalogGrid.querySelectorAll('.card')];
    const typeInputs = [...document.querySelectorAll('input[name="type"]')];
    const countryInputs = [...document.querySelectorAll('input[name="country"]')];
    const totalItems = cards.length;

    const applyFilters = () => {
        const selectedTypes = typeInputs.filter((input) => input.checked).map((input) => input.value);
        const selectedCountries = countryInputs.filter((input) => input.checked).map((input) => input.value);
        const maxPrice = Number.parseInt(priceRange.value, 10);

        priceOutput.textContent = `до ${formatPrice(maxPrice)} ₽`;

        let visibleCount = 0;
        cards.forEach((card) => {
            const cardType = card.dataset.type;
            const cardCountry = card.dataset.country;
            const cardPrice = Number.parseInt(card.dataset.price || '0', 10);

            const typeMatches = selectedTypes.length === 0 || selectedTypes.includes(cardType);
            const countryMatches = selectedCountries.length === 0 || selectedCountries.includes(cardCountry);
            const priceMatches = cardPrice <= maxPrice;

            const isVisible = typeMatches && countryMatches && priceMatches;
            card.classList.toggle('hidden', !isVisible);
            if (isVisible) visibleCount += 1;
        });

        resultsElement.textContent = `Показано ${visibleCount} из ${totalItems} позиций`;
    };

    [...typeInputs, ...countryInputs, priceRange].forEach((input) => {
        input.addEventListener('input', applyFilters);
        input.addEventListener('change', applyFilters);
    });

    applyFilters();
}

function initForms() {
    const subscriptionForm = document.getElementById('subscription-form');
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', (event) => {
            event.preventDefault();
            showToast('Подписка оформлена. Спасибо!');
            subscriptionForm.reset();
        });
    }

    const eventForm = document.getElementById('event-registration-form');
    if (eventForm) {
        eventForm.addEventListener('submit', (event) => {
            event.preventDefault();
            showToast('Заявка на дегустацию отправлена');
            eventForm.reset();
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            showToast('Сообщение отправлено. Ответим в ближайшее время');
            contactForm.reset();
        });
    }
}

function initProductGallery() {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = [...document.querySelectorAll('.thumbnail-btn[data-image-class]')];
    if (!mainImage || thumbnails.length === 0) return;

    thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener('click', () => {
            const imageClass = thumbnail.dataset.imageClass;
            if (!imageClass) return;

            mainImage.className = `main-image ${imageClass}`;
            thumbnails.forEach((item) => item.classList.remove('active'));
            thumbnail.classList.add('active');
        });
    });
}

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatPrice(value) {
    return currencyFormatter.format(Number(value) || 0);
}

function addToCart(item) {
    const cart = getCart();
    const existing = cart.find((entry) => entry.id === item.id);

    if (existing) {
        existing.quantity += item.quantity;
    } else {
        cart.push(item);
    }

    saveCart(cart);
    updateCartCount();
    renderCart();
}

function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach((element) => {
        element.textContent = String(total);
    });
}

function updateItemQuantity(id, delta) {
    const cart = getCart();
    const target = cart.find((item) => item.id === id);
    if (!target) return;

    target.quantity += delta;
    const normalized = cart.filter((item) => item.quantity > 0);
    saveCart(normalized);
}

function removeFromCart(id) {
    const updated = getCart().filter((item) => item.id !== id);
    saveCart(updated);
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    attachCartActions(container);
    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <p>Корзина пока пуста. Добавь пару сортов, и мы быстро подготовим заказ.</p>
                <a href="catalog.html" class="btn-outline" style="margin-top:0.8rem;">Перейти в каталог</a>
            </div>
        `;
        const totalElement = document.getElementById('cart-total');
        if (totalElement) totalElement.textContent = '0';
        return;
    }

    const rows = cart.map((item) => {
        const subtotal = item.price * item.quantity;
        return `
            <tr>
                <td>${item.name}</td>
                <td>${formatPrice(item.price)} ₽</td>
                <td>
                    <div class="qty-control">
                        <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Уменьшить">-</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-action="increase" data-id="${item.id}" aria-label="Увеличить">+</button>
                    </div>
                </td>
                <td>${formatPrice(subtotal)} ₽</td>
                <td><button type="button" class="cart-action" data-action="remove" data-id="${item.id}">Удалить</button></td>
            </tr>
        `;
    }).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    container.innerHTML = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Товар</th>
                    <th>Цена</th>
                    <th>Количество</th>
                    <th>Сумма</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }
}

function attachCartActions(container) {
    if (container.dataset.bound === 'true') return;

    container.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action][data-id]');
        if (!button) return;

        const { action, id } = button.dataset;
        if (!action || !id) return;

        if (action === 'increase') {
            updateItemQuantity(id, 1);
        }

        if (action === 'decrease') {
            updateItemQuantity(id, -1);
        }

        if (action === 'remove') {
            removeFromCart(id);
        }

        updateCartCount();
        renderCart();
    });

    container.dataset.bound = 'true';
}

function initCheckout() {
    const checkoutButton = document.getElementById('checkout-btn');
    if (!checkoutButton) return;

    checkoutButton.addEventListener('click', () => {
        const cart = getCart();
        if (cart.length === 0) {
            showToast('Корзина пуста, добавь позиции перед оформлением');
            return;
        }

        localStorage.removeItem(CART_KEY);
        updateCartCount();
        renderCart();
        showToast('Заказ оформлен. Спасибо!');
    });
}

function showToast(message) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.className = 'toast-stack';
        document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    stack.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
        if (stack && stack.children.length === 0) {
            stack.remove();
        }
    }, 2800);
}
