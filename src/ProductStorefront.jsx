import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { logEvent } from "firebase/analytics";
import { auth, analytics } from "./firebase";
import Toast from "./components/Toast";
import useProductList from "./hooks/useProductList";
import { formatRupees } from "./utils/currency";

function escapeCsvValue(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

function downloadCsv(cartItems) {
  const rows = ["name,quantity"];
  cartItems.forEach((item) => {
    rows.push(`${escapeCsvValue(item.name)},${item.quantity}`);
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "products-cart.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ProductStorefront({ user }) {
  const [toast, setToast] = useState(null);
  const [cart, setCart] = useState({});

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const { products, dataLoading } = useProductList(user, showToast);

  useEffect(() => {
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
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.quantity,
    0
  );

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

  const handleDownload = () => {
    if (cartItems.length === 0) {
      showToast("Add products to cart before downloading CSV.", "info");
      return;
    }

    downloadCsv(cartItems);
    logEvent(analytics, "download_cart_csv", { item_count: cartItems.length });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      <header className="border-b border-slate-800 bg-slate-950/85 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-3 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] text-emerald-400 uppercase tracking-[0.28em]">
              Product Store
            </p>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 truncate">
              Select products for export
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
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6 overflow-hidden relative">
              <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative max-w-2xl">
                <p className="text-[10px] text-emerald-400 uppercase tracking-[0.3em] mb-2">
                  Cart CSV
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                  Build a product list, then download quantities.
                </h2>
                <p className="text-sm text-slate-400 leading-6">
                  Add available products to your cart. The export contains only
                  the product name and quantity, ready for sharing or processing.
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
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
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
                      className="group rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl shadow-black/20"
                    >
                      <div className="h-44 bg-slate-800 relative overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                          className={`absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full border uppercase tracking-widest ${
                            outOfStock
                              ? "bg-red-500/10 border-red-500/30 text-red-300"
                              : "bg-slate-950/80 border-emerald-500/30 text-emerald-300"
                          }`}
                        >
                          {outOfStock ? "Out" : `${totalStocks} left`}
                        </span>
                      </div>

                      <div className="p-4 space-y-4">
                        <div>
                          <h3 className="font-bold text-slate-100 line-clamp-2 min-h-12">
                            {product.name || "Untitled product"}
                          </h3>
                          <p className="text-sm text-emerald-300 mt-1">
                            {formatRupees(product.price)} per stock
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => changeQuantity(product, quantity - 1)}
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
                              onClick={() => changeQuantity(product, quantity + 1)}
                              disabled={quantity >= totalStocks}
                              className="w-9 h-9 text-slate-400 hover:text-white disabled:text-slate-700 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={outOfStock || quantity >= totalStocks}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition-colors"
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

          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/30 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="font-bold text-slate-100">Cart</h2>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 uppercase tracking-widest">
                  {cartCount} items
                </span>
              </div>
              <p className="text-xs text-slate-500">
                CSV export includes product name and quantity.
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
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3"
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
                          onClick={() => product && changeQuantity(product, 0)}
                          className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      {product && (
                        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 w-fit overflow-hidden">
                          <button
                            type="button"
                            onClick={() => changeQuantity(product, item.quantity - 1)}
                            className="w-8 h-8 text-slate-400 hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="w-9 text-center text-xs text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(product, item.quantity + 1)}
                            disabled={item.quantity >= (Number(product.totalStocks) || 0)}
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

            <div className="p-5 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Estimated total</span>
                <span className="text-slate-100 font-bold">
                  {formatRupees(cartTotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={cartItems.length === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold text-sm py-3 rounded-xl transition-colors"
              >
                Download CSV
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
