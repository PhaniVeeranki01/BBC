const state = {
  cart: [],
  favorites: new Set(),
};

const body = document.body;
const backdrop = document.querySelector(".drawer-backdrop");
const cartDrawer = document.querySelector(".cart-drawer");
const mobileMenu = document.querySelector(".mobile-menu");
const searchOverlay = document.querySelector(".search-overlay");
const consultationModal = document.querySelector(".consultation-modal");
const toast = document.querySelector(".toast");

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function lockPage(locked) {
  body.classList.toggle("no-scroll", locked);
}

function closeDrawers() {
  cartDrawer.classList.remove("open");
  mobileMenu.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  mobileMenu.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("open");
  lockPage(false);
}

function openDrawer(drawer) {
  closeDrawers();
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.classList.add("open");
  lockPage(true);
}

function openOverlay(overlay, focusSelector) {
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  lockPage(true);
  window.setTimeout(() => overlay.querySelector(focusSelector)?.focus(), 180);
}

function closeOverlay(overlay) {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  lockPage(false);
}

function updateCount(selector, count) {
  const element = document.querySelector(selector);
  element.textContent = count;
  element.hidden = count === 0;
}

function renderCart() {
  const cartItems = document.querySelector(".cart-items");
  const emptyCart = document.querySelector(".empty-cart");
  const summary = document.querySelector(".cart-summary");

  cartItems.innerHTML = state.cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.image}" alt="">
      <div>
        <h3>${item.name}</h3>
        <p>Fresh &middot; Made to order</p>
        <button class="remove-item" data-index="${index}">Remove</button>
      </div>
      <span class="cart-item__price">$${item.price}</span>
    </div>
  `).join("");

  const hasItems = state.cart.length > 0;
  emptyCart.hidden = hasItems;
  summary.hidden = !hasItems;

  if (hasItems) {
    const total = state.cart.reduce((sum, item) => sum + item.price, 0);
    document.querySelector(".cart-subtotal").textContent = `$${total}`;
  }

  updateCount(".cart-count", state.cart.length);

  cartItems.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => {
      const [removed] = state.cart.splice(Number(button.dataset.index), 1);
      renderCart();
      showToast(`${removed.name} removed from your bag`);
    });
  });
}

function setFilter(filter) {
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.filter === filter);
  });

  let visible = 0;
  document.querySelectorAll(".product-card").forEach((card) => {
    const show = filter === "All" || card.dataset.category === filter;
    card.hidden = !show;
    if (show) visible += 1;
  });

  document.querySelector(".product-total").textContent = `${visible} arrangement${visible === 1 ? "" : "s"}`;
}

document.querySelector(".announcement__close").addEventListener("click", (event) => {
  event.currentTarget.parentElement.remove();
});

document.querySelector(".cart-trigger").addEventListener("click", () => openDrawer(cartDrawer));
document.querySelector(".menu-trigger").addEventListener("click", () => openDrawer(mobileMenu));
backdrop.addEventListener("click", closeDrawers);
document.querySelectorAll(".drawer-close").forEach((button) => button.addEventListener("click", closeDrawers));
document.querySelector(".drawer-shop").addEventListener("click", closeDrawers);

document.querySelectorAll(".mobile-menu a").forEach((link) => link.addEventListener("click", closeDrawers));

document.querySelector(".search-trigger").addEventListener("click", () => openOverlay(searchOverlay, "input"));
document.querySelector(".search-close").addEventListener("click", () => closeOverlay(searchOverlay));

document.querySelector(".search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = new FormData(event.currentTarget).get("query") || document.querySelector("#site-search").value;
  const normalized = query.trim().toLowerCase();
  let filter = "All";
  if (normalized.includes("wedding") || normalized.includes("jaimala") || normalized.includes("jasmine")) filter = "Wedding";
  if (normalized.includes("celebration") || normalized.includes("marigold") || normalized.includes("birthday")) filter = "Celebration";
  if (normalized.includes("welcome") || normalized.includes("honor") || normalized.includes("blush")) filter = "Welcome";
  setFilter(filter);
  closeOverlay(searchOverlay);
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
  showToast(filter === "All" ? `Showing all flowers for “${query.trim()}”` : `Showing ${filter.toLowerCase()} garlands`);
});

document.querySelectorAll(".planner-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    closeDrawers();
    openOverlay(consultationModal, "input");
  });
});

document.querySelector(".modal-close").addEventListener("click", () => closeOverlay(consultationModal));
document.querySelector(".modal-close-success").addEventListener("click", () => closeOverlay(consultationModal));
consultationModal.addEventListener("click", (event) => {
  if (event.target === consultationModal) closeOverlay(consultationModal);
});

document.querySelector(".consultation-form").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.hidden = true;
  document.querySelector(".consultation-intro").hidden = true;
  document.querySelector(".consultation-success").hidden = false;
  refreshIcons();
});

document.querySelectorAll(".filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => setFilter(tab.dataset.filter));
});

document.querySelectorAll(".filter-jump").forEach((card) => {
  card.addEventListener("click", () => {
    setFilter(card.dataset.filter);
    document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll(".quick-add").forEach((button) => {
  button.addEventListener("click", () => {
    state.cart.push({
      name: button.dataset.product,
      price: Number(button.dataset.price),
      image: button.dataset.image,
    });
    renderCart();
    showToast(`${button.dataset.product} added to your bag`);
  });
});

document.querySelectorAll(".favorite-button").forEach((button) => {
  button.addEventListener("click", () => {
    const product = button.closest(".product-card").dataset.name;
    const isFavorite = state.favorites.has(product);
    if (isFavorite) {
      state.favorites.delete(product);
    } else {
      state.favorites.add(product);
    }
    button.classList.toggle("active", !isFavorite);
    button.setAttribute("aria-pressed", String(!isFavorite));
    updateCount(".favorite-count", state.favorites.size);
    showToast(isFavorite ? `${product} removed from favorites` : `${product} saved to favorites`);
  });
});

document.querySelector(".favorites-trigger").addEventListener("click", () => {
  if (state.favorites.size === 0) {
    showToast("Tap the heart on any garland to save it");
    return;
  }
  showToast(`${state.favorites.size} saved favorite${state.favorites.size === 1 ? "" : "s"}`);
});

document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.hidden = true;
  document.querySelector(".newsletter-success").hidden = false;
});

document.querySelector(".checkout-button").addEventListener("click", () => {
  showToast("Checkout is ready for payment integration");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeDrawers();
  closeOverlay(searchOverlay);
  closeOverlay(consultationModal);
});

window.addEventListener("load", refreshIcons);
