// Satyabhama Decors — Cart module
// Stores cart in localStorage. Supports two item types:
//   'direct'       -> fixed price, quantity-based (mosquito mesh, ready curtains, etc.)
//   'quote_deposit'-> customer pays a booking deposit now; final price set after home visit

const CART_KEY = "sd_cart_v1";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: items }));
}

export function getCart() {
  return readCart();
}

/**
 * Add a product to the cart.
 * @param {Object} product - { id, name, fulfillment_type, price, deposit_amount, unit, image }
 * @param {Object} options - { quantity, measurementNotes }
 */
export function addToCart(product, options = {}) {
  const items = readCart();
  const quantity = options.quantity || 1;

  const existing = items.find(i => i.product_id === product.id && i.fulfillment_type === product.fulfillment_type);

  if (product.fulfillment_type === "direct") {
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        product_id: product.id,
        name: product.name,
        fulfillment_type: "direct",
        unit_price: product.price,
        quantity,
        unit: product.unit || "piece",
        image: product.image || null
      });
    }
  } else {
    // quote_deposit — each booking is its own line item (measurements differ per booking)
    items.push({
      product_id: product.id,
      name: product.name,
      fulfillment_type: "quote_deposit",
      deposit_amount: product.deposit_amount,
      quantity: 1,
      measurement_notes: options.measurementNotes || "",
      image: product.image || null
    });
  }

  writeCart(items);
}

export function removeFromCart(index) {
  const items = readCart();
  items.splice(index, 1);
  writeCart(items);
}

export function updateQuantity(index, quantity) {
  const items = readCart();
  if (items[index] && items[index].fulfillment_type === "direct") {
    items[index].quantity = Math.max(1, quantity);
    writeCart(items);
  }
}

export function clearCart() {
  writeCart([]);
}

/**
 * Totals: what's charged NOW vs what remains due later (for quote items).
 */
export function getCartTotals() {
  const items = readCart();
  let payNow = 0;
  let dueLater = 0;
  let itemCount = 0;

  for (const item of items) {
    itemCount += item.quantity;
    if (item.fulfillment_type === "direct") {
      payNow += item.unit_price * item.quantity;
    } else {
      payNow += item.deposit_amount * item.quantity;
      // dueLater is unknown until measurement — shown as "TBD after home visit"
    }
  }

  return { payNow: Math.round(payNow * 100) / 100, dueLater, itemCount };
}

export function updateCartBadge() {
  const badge = document.querySelector("[data-cart-badge]");
  if (!badge) return;
  const { itemCount } = getCartTotals();
  badge.textContent = itemCount;
  badge.style.display = itemCount > 0 ? "inline-flex" : "none";
}

// Run on load if this script is included on any page
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", updateCartBadge);
}
