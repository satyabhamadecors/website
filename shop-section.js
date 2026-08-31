/* ============================================================
   Satyabhama Decors — Shop Section Renderer
   Drop this on any category page. Fetches priced products for
   a category from Supabase and renders purchasable cards,
   matching the site's existing card/design tokens.
   ============================================================ */
(function () {
  const SB_URL = "https://pzgvfrtrxwuhjilzhdax.supabase.co";
  const SB_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Z3ZmcnRyeHd1aGppbHpoZGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MTE2NjEsImV4cCI6MjA5NjM4NzY2MX0.8ZDIhIhXGy9YeDyrzV3jykdJozreKc5WCpRgIXKe6ao";

  async function fetchProducts(categorySlug) {
    const url = SB_URL + "/rest/v1/products"
      + "?select=id,slug,name,description,fulfillment_type,price,deposit_amount,unit,is_active,product_images(url,sort_order),categories!inner(slug)"
      + "&categories.slug=eq." + encodeURIComponent(categorySlug)
      + "&is_active=eq.true";
    const res = await fetch(url, {
      headers: { apikey: SB_ANON_KEY, Authorization: "Bearer " + SB_ANON_KEY },
    });
    if (!res.ok) {
      console.error("shop fetch failed", await res.text());
      return [];
    }
    return res.json();
  }

  function cartRead() {
    try { return JSON.parse(localStorage.getItem("sd_cart_v1")) || []; }
    catch { return []; }
  }
  function cartWrite(items) {
    localStorage.setItem("sd_cart_v1", JSON.stringify(items));
    updateCartBadge();
  }
  function addToCart(product) {
    const items = cartRead();
    if (product.fulfillment_type === "direct") {
      const existing = items.find(i => i.product_id === product.id && i.fulfillment_type === "direct");
      if (existing) existing.quantity += 1;
      else items.push({
        product_id: product.id, name: product.name, fulfillment_type: "direct",
        unit_price: product.price, quantity: 1, unit: product.unit || "piece",
      });
    } else {
      items.push({
        product_id: product.id, name: product.name, fulfillment_type: "quote_deposit",
        deposit_amount: product.deposit_amount, quantity: 1, measurement_notes: "",
      });
    }
    cartWrite(items);
  }
  function updateCartBadge() {
    const badge = document.querySelector("[data-cart-badge]");
    if (!badge) return;
    const items = cartRead();
    const count = items.reduce((n, i) => n + i.quantity, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }

  function money(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function renderCard(product) {
    const img = (product.product_images || []).sort((a, b) => a.sort_order - b.sort_order)[0];
    const imgUrl = img ? img.url : "";
    const isDirect = product.fulfillment_type === "direct";
    const priceLabel = isDirect
      ? money(product.price) + " / " + (product.unit || "piece")
      : "From " + money(product.deposit_amount) + " booking";
    const btnLabel = isDirect ? "Add to Cart" : "Book Free Measurement";

    const wrap = document.createElement("div");
    wrap.className = "shop-card";
    wrap.innerHTML = `
      <div class="shop-card-img" style="background-image:url('${imgUrl}')"></div>
      <div class="shop-card-body">
        <div class="shop-card-name">${product.name}</div>
        ${product.description ? `<div class="shop-card-desc">${product.description}</div>` : ""}
        <div class="shop-card-price">${priceLabel}</div>
        <button type="button" class="shop-card-btn">${btnLabel}</button>
      </div>
    `;
    wrap.querySelector(".shop-card-btn").addEventListener("click", () => {
      addToCart(product);
      const btn = wrap.querySelector(".shop-card-btn");
      const original = btn.textContent;
      btn.textContent = "Added ✓";
      setTimeout(() => (btn.textContent = original), 1200);
    });
    return wrap;
  }

  async function renderShopSection(categorySlug, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const products = await fetchProducts(categorySlug);
    if (products.length === 0) {
      container.innerHTML = '<p style="opacity:.5;font-size:13px;">Products coming soon.</p>';
      return;
    }
    container.innerHTML = "";
    products.forEach(p => container.appendChild(renderCard(p)));
  }

  window.SDShop = { renderShopSection, updateCartBadge, getCartCount: () => cartRead().reduce((n, i) => n + i.quantity, 0) };
  document.addEventListener("DOMContentLoaded", updateCartBadge);
})();
