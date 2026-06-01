import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { logEvent } from "firebase/analytics";
import { auth, analytics } from "./firebase";
import Toast from "./components/Toast";
import useProductList from "./hooks/useProductList";
import { formatRupees } from "./utils/currency";

function buildWhatsAppMessage(cartItems) {
  const lines = ["*Delivery Order:*", ""];

  cartItems.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} - *${item.quantity} item${item.quantity !== 1 ? "s" : ""}*`
    );
  });

  lines.push(
    "",
    `*Total: ${cartItems.reduce((s, i) => s + i.quantity, 0)} items*`
  );
  return lines.join("\n");
}

function createWhatsAppLink(message) {
  return `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}&type=custom_url&app_absent=0`;
}

export default function ProductStorefront({ user }) {
  const [toast, setToast] = useState(null);
  const [cart, setCart] = useState({});

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const { products, dataLoading } = useProductList(user, showToast);

  useEffect(() => {
    document.title = "Product Store";
    logEvent(analytics, "page_view", {
      page_title: "Product Storefront",
      page_location: window.location.href,
    });
  }, []);

  const productsById = products.reduce((map, product) => {
    map[product.firestoreId] = product;
    return map;
  }, {});

  const cartItems = Object.values(cart)
    .map((item) => {
      const product = productsById[item.firestoreId];
      return product ? { ...item, price: product.price } : item;
    })
    .filter((item) => item.quantity > 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const changeQuantity = (product, nextQuantity) => {
    const maxQuantity = Math.max(0, Number(product.totalStocks) || 0);
    const quantity = Math.max(0, Math.min(nextQuantity, maxQuantity));

    setCart((current) => {
      const next = { ...current };
      if (quantity === 0) {
        delete next[product.firestoreId];
      } else {
        next[product.firestoreId] = {
          firestoreId: product.firestoreId,
          name: product.name,
          quantity,
        };
      }
      return next;
    });
  };

  const addToCart = (product) => {
    const currentQuantity = cart[product.firestoreId]?.quantity ?? 0;
    const maxQuantity = Number(product.totalStocks) || 0;
    if (maxQuantity <= 0 || currentQuantity >= maxQuantity) {
      showToast("No more stock available for this product.", "info");
      return;
    }

    changeQuantity(product, currentQuantity + 1);
  };

  const handleSendWhatsApp = () => {
    if (cartItems.length === 0) {
      showToast("Add products to cart before sending to WhatsApp.", "info");
      return;
    }

    const message = buildWhatsAppMessage(cartItems);
    window.open(createWhatsAppLink(message), "_blank", "noopener,noreferrer");
    logEvent(analytics, "send_whatsapp_order", {
      item_count: cartItems.length,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-3 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] text-emerald-400 uppercase tracking-[0.28em]">
              Product Store
            </p>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 truncate">
              Select products to order
            </h1>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              to="/admin"
              className="text-xs text-slate-500 hover:text-emerald-400 transition-colors duration-150 shrink-0"
            >
              Admin
            </Link>
            <div className="hidden sm:flex items-center gap-2.5">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-7 h-7 rounded-full ring-2 ring-slate-700"
                />
              )}
              <span className="text-xs text-slate-300">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={() => {
                logEvent(analytics, "logout");
                signOut(auth);
              }}
              className="text-xs text-slate-500 hover:text-slate-200 transition-colors duration-150 shrink-0"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8">
        <section className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="space-y-5">
            <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-slate-900 p-6 sm:p-8 shadow-2xl shadow-emerald-500/5">
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-500/20 blur-[80px]" />
              <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-emerald-400/10 blur-[60px]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                  <span className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] font-semibold">
                    WhatsApp Order
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
                  Build a product list,<br />
                  <span className="text-emerald-300">send on WhatsApp.</span>
                </h2>
                <p className="text-sm text-slate-400 leading-6 max-w-xl">
                  Add available products to your cart. The message contains only
                  the product name and quantity, ready to share on WhatsApp with
                  your team or supplier.
                </p>
              </div>
            </div>

            {dataLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 rounded-2xl border border-slate-800 bg-slate-900/70 animate-pulse"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-8 text-center">
                <p className="text-sm text-slate-400">No products available.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => {
                  const quantity = cart[product.firestoreId]?.quantity ?? 0;
                  const totalStocks = Number(product.totalStocks) || 0;
                  const outOfStock = totalStocks <= 0;

                  return (
                    <article
                      key={product.firestoreId}
                      className="group relative rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-900/50 overflow-hidden shadow-xl shadow-black/20 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-emerald-500/5 hover:-translate-y-0.5"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/60 pointer-events-none" />
                      <div className="h-44 bg-slate-800/50 relative overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <svg
                              className="w-9 h-9 mb-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                        <span
                          className={`absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest backdrop-blur-sm ${
                            outOfStock
                              ? "bg-red-500/10 border-red-500/30 text-red-300"
                              : "bg-slate-950/60 border-emerald-500/30 text-emerald-300"
                          }`}
                        >
                          {outOfStock ? "Out" : `${totalStocks} left`}
                        </span>
                      </div>

                      <div className="relative p-4 space-y-4">
                        <div>
                          <h3 className="font-bold text-slate-100 line-clamp-2 min-h-12">
                            {product.name || "Untitled product"}
                          </h3>
                          <p className="text-sm text-emerald-300/90 mt-1">
                            {formatRupees(product.price)} per stock
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center rounded-lg border border-slate-700/80 bg-slate-950 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(product, quantity - 1)
                              }
                              disabled={quantity === 0}
                              className="w-9 h-9 text-slate-400 hover:text-white disabled:text-slate-700 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm text-slate-200">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(product, quantity + 1)
                              }
                              disabled={quantity >= totalStocks}
                              className="w-9 h-9 text-slate-400 hover:text-white disabled:text-slate-700 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={
                              outOfStock || quantity >= totalStocks
                            }
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20"
                          >
                            {quantity > 0 ? "Add More" : "Add to Cart"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900/90 to-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
            <div className="p-5 border-b border-slate-800/60">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="font-bold text-slate-100">Cart</h2>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 uppercase tracking-widest">
                  {cartCount} items
                </span>
              </div>
              <p className="text-xs text-slate-500">
                WhatsApp message includes product name and quantity.
              </p>
            </div>

            <div className="p-5 space-y-3 max-h-[420px] overflow-auto">
              {cartItems.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">
                  Your cart is empty.
                </p>
              ) : (
                cartItems.map((item) => {
                  const product = productsById[item.firestoreId];
                  return (
                    <div
                      key={item.firestoreId}
                      className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-3"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm text-slate-200 font-semibold">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Qty {item.quantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            product && changeQuantity(product, 0)
                          }
                          className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      {product && (
                        <div className="flex items-center rounded-lg border border-slate-800/60 bg-slate-900 w-fit overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(product, item.quantity - 1)
                            }
                            className="w-8 h-8 text-slate-400 hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="w-9 text-center text-xs text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(product, item.quantity + 1)
                            }
                            disabled={
                              item.quantity >=
                              (Number(product.totalStocks) || 0)
                            }
                            className="w-8 h-8 text-slate-400 hover:text-white disabled:text-slate-700 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-5 border-t border-slate-800/60 space-y-4">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={cartItems.length === 0}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-sm py-3 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 disabled:shadow-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Send to WhatsApp
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
              </button>
            </div>
          </aside>
        </section>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
