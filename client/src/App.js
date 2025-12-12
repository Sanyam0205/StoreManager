import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

const PRODUCT_BASE = process.env.REACT_APP_PRODUCT_BASE || "http://localhost:3002";
const ORDER_BASE = process.env.REACT_APP_ORDER_BASE || "http://localhost:3003";
const INVENTORY_BASE = process.env.REACT_APP_INVENTORY_BASE || "http://localhost:3004";

function formatMoney(cents = 0, currency = "USD") {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

function Toast({ message, kind = "info", onClose }) {
  if (!message) return null;
  return (
    <div className={`toast toast-${kind}`}>
      <div style={{ flex: 1 }}>{message}</div>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState(null);
  const [inventoryMap, setInventoryMap] = useState({});
  const [cart, setCart] = useState([]);
  const [msg, setMsg] = useState(null);
  const [msgKind, setMsgKind] = useState("info");
  const [placing, setPlacing] = useState(false);
  const [orders, setOrders] = useState(null);

  const USER_ID = "demo-user";

  // -----------------------------
  // Fetch PRODUCTS + INVENTORY
  // -----------------------------
  async function fetchProductsAndInventory() {
    setProducts(null);
    try {
      const res = await fetch(`${PRODUCT_BASE}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);

      const ids = (Array.isArray(data) ? data : []).map(p => p._id);

      const invProm = ids.map(id =>
        fetch(`${INVENTORY_BASE}/inventory/${encodeURIComponent(id)}`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      );
      const invs = await Promise.all(invProm);

      const map = {};
      ids.forEach((id, i) => (map[id] = invs[i]));
      setInventoryMap(map);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setMsg("Failed to load products.");
      setMsgKind("error");
    }
  }

  useEffect(() => {
    fetchProductsAndInventory();
  }, []);

  // -----------------------------
  // Fetch ORDERS (stable function)
  // -----------------------------
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${ORDER_BASE}/orders`);
      let data = await res.json();
      if (!Array.isArray(data)) data = [];

      // Enrich orders with product names
      const productMap = {};
      if (Array.isArray(products)) {
        products.forEach(p => {
          productMap[p._id] = p.name;
        });
      }

      const enriched = data.map(order => ({
        ...order,
        items: order.items?.map(it => ({
          ...it,
          productName: productMap[it.productId] || it.productId
        }))
      }));

      setOrders(enriched);
    } catch (err) {
      console.error(err);
      setOrders([]);
    }
  }, [products]);

  // Fetch orders whenever products load/change
  useEffect(() => {
    if (products !== null) {
      fetchOrders();
    }
  }, [products, fetchOrders]);

  // -----------------------------
  // CART LOGIC
  // -----------------------------
  function addToCart(product, qty = 1) {
    setCart(prev => {
      const idx = prev.findIndex(it => it.product._id === product._id);
      if (idx === -1) return [...prev, { product, qty: Number(qty) }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + Number(qty) };
      return copy;
    });
    setMsg("Added to cart");
    setMsgKind("success");
  }

  function updateQty(productId, qty) {
    setCart(prev =>
      prev.map(it =>
        it.product._id === productId
          ? { ...it, qty: Math.max(1, Number(qty) || 1) }
          : it
      )
    );
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(it => it.product._id !== productId));
  }

  function cartTotalCents() {
    return cart.reduce((s, it) => s + (it.product.price_cents || 0) * it.qty, 0);
  }

  // -----------------------------
  // PLACE ORDER
  // -----------------------------
  async function placeOrder() {
    if (cart.length === 0) {
      setMsg("Cart is empty");
      setMsgKind("error");
      return;
    }

    // Validate inventory locally
    for (const it of cart) {
      const inv = inventoryMap[it.product._id];
      if (inv && inv.available_qty < it.qty) {
        setMsg(`Not enough stock for ${it.product.name}`);
        setMsgKind("error");
        return;
      }
    }

    const payload = {
      userId: USER_ID,
      items: cart.map(it => ({
        productId: it.product._id,
        qty: it.qty,
        price_cents: it.product.price_cents
      }))
    };

    setPlacing(true);
    setMsg("Placing order…");
    setMsgKind("info");

    try {
      const res = await fetch(`${ORDER_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg("Order failed: " + (data?.error || JSON.stringify(data)));
        setMsgKind("error");
      } else {
        setMsg("Order placed ✓");
        setMsgKind("success");

        // Optimistic UI inventory update
        setInventoryMap(m => {
          const copy = { ...m };
          cart.forEach(it => {
            if (copy[it.product._id]) {
              copy[it.product._id] = {
                ...copy[it.product._id],
                available_qty: Math.max(
                  0,
                  copy[it.product._id].available_qty - it.qty
                )
              };
            }
          });
          return copy;
        });

        setCart([]);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      setMsg("Order error (see console)");
      setMsgKind("error");
    } finally {
      setPlacing(false);
    }
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="app">
      <Toast message={msg} kind={msgKind} onClose={() => setMsg(null)} />

      <header className="app-header">
        <h1>Mini E-commerce • Demo</h1>
        <div className="header-actions">
          <small>
            cart: {cart.length} • orders:{" "}
            {Array.isArray(orders) ? orders.length : "…"}
          </small>
        </div>
      </header>

      <main className="container">
        {/* --------------------- PRODUCTS --------------------- */}
        <section className="catalog">
          {products === null && <div className="empty">Loading products…</div>}
          {Array.isArray(products) && products.length === 0 && (
            <div className="empty">No products. Use API to seed.</div>
          )}

          <div className="grid">
            {Array.isArray(products) &&
              products.map(p => {
                const inv = inventoryMap[p._id];
                const available = inv ? inv.available_qty : null;

                return (
                  <article key={p._id} className="card">
                    <div className="card-media">
                      <img
                        src={
                          p.image_url ||
                          `https://picsum.photos/seed/${p._id}/400/240`
                        }
                        alt={p.name}
                      />
                    </div>

                    <div className="card-body">
                      <h3>{p.name}</h3>
                      <div className="desc">{p.description}</div>

                      <div className="meta">
                        <span className="price">
                          {formatMoney(p.price_cents, p.currency)}
                        </span>
                        <span className="stock">
                          {available === null
                            ? "—"
                            : `${available} in stock`}
                        </span>
                      </div>

                      <div className="card-actions">
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center"
                          }}
                        >
                          <input
                            type="number"
                            min="1"
                            defaultValue={1}
                            id={`qty-${p._id}`}
                            className="small-input"
                          />
                          <button
                            className="btn"
                            onClick={() => {
                              const elem = document.getElementById(
                                `qty-${p._id}`
                              );
                              const qty = elem
                                ? Math.max(1, Number(elem.value || 1))
                                : 1;
                              addToCart(p, qty);
                            }}
                          >
                            Add
                          </button>
                        </div>

                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            navigator.clipboard?.writeText(p._id);
                            setMsg("Product id copied");
                            setMsgKind("info");
                          }}
                        >
                          Copy id
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        {/* --------------------- CART + ORDERS --------------------- */}
        <aside className="sidebar">
          <div className="order-panel">
            <h2>Your Cart</h2>

            {cart.length === 0 && <div style={{ color: "#666" }}>No items.</div>}

            {cart.map(it => (
              <div
                key={it.product._id}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  margin: "8px 0"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{it.product.name}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {formatMoney(it.product.price_cents)}
                  </div>
                </div>

                <input
                  type="number"
                  value={it.qty}
                  min="1"
                  className="small-input"
                  onChange={e => updateQty(it.product._id, e.target.value)}
                />

                <button
                  className="btn btn-ghost"
                  onClick={() => removeFromCart(it.product._id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <div style={{ marginTop: 10, fontWeight: 700 }}>
              Total: {formatMoney(cartTotalCents())}
            </div>

            <button
              onClick={placeOrder}
              disabled={placing || cart.length === 0}
              className="btn btn-primary"
              style={{ marginTop: 12 }}
            >
              {placing ? "Placing…" : "Place Order"}
            </button>

            <hr style={{ margin: "14px 0" }} />

            <h3>Order History</h3>

            {orders === null && <div>Loading orders…</div>}

            {Array.isArray(orders) && orders.length === 0 && (
              <div style={{ color: "#666" }}>No orders yet.</div>
            )}

            {Array.isArray(orders) &&
              orders.slice(0, 6).map(o => (
                <div
                  key={o._id}
                  style={{
                    borderTop: "1px solid #eee",
                    paddingTop: 8,
                    marginTop: 8
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{o._id}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </div>

                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    {o.items?.map(x => (
                      <div key={x.productId}>
                        {x.qty} × {x.productName}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 6, fontWeight: 700 }}>
                    {formatMoney(o.total_cents)}
                  </div>
                </div>
              ))}

            <button
              onClick={fetchOrders}
              className="btn btn-ghost"
              style={{ marginTop: 10 }}
            >
              Refresh Orders
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
