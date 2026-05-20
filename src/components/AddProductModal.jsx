import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { logEvent } from "firebase/analytics";
import { db, analytics } from "../firebase";

export default function AddProductModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const priceVal = parseFloat(price);
    if (!name.trim()) {
      onSuccess?.("Product name is required.", "error");
      return;
    }
    if (isNaN(priceVal) || priceVal < 0) {
      onSuccess?.("Price must be a non-negative number.", "error");
      return;
    }
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "products"), {
        name: name.trim(),
        price: priceVal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logEvent(analytics, "add_product", {
        product_id: docRef.id,
        product_name: name.trim(),
        product_price: priceVal,
      });
      onSuccess?.(`"${name.trim()}" added.`, "success");
      setName("");
      setPrice("");
      onClose();
    } catch (err) {
      onSuccess?.("Could not add product: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Add Product</h3>
            <p className="text-xs text-slate-500">
              Enter the product details below.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              placeholder="e.g. Widget Pro"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">
              Price (USD)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              placeholder="0.00"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-900 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              {loading ? "Adding…" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
