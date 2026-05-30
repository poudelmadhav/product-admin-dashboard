import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { logEvent } from "firebase/analytics";
import { db, analytics } from "../firebase";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function AddProductModal({ open, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [totalStocks, setTotalStocks] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Upload failed");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const priceVal = parseFloat(price);
    const totalStocksVal = Number(totalStocks);
    if (!name.trim()) {
      onSuccess?.("Product name is required.", "error");
      return;
    }
    if (isNaN(priceVal) || priceVal < 0) {
      onSuccess?.("Price must be a non-negative number.", "error");
      return;
    }
    if (
      totalStocks.trim() === "" ||
      !Number.isInteger(totalStocksVal) ||
      totalStocksVal < 0
    ) {
      onSuccess?.("Total stocks must be a non-negative whole number.", "error");
      return;
    }
    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const docRef = await addDoc(collection(db, "products"), {
        name: name.trim(),
        price: priceVal,
        totalStocks: totalStocksVal,
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logEvent(analytics, "add_product", {
        product_id: docRef.id,
        product_name: name.trim(),
        product_price: priceVal,
        total_stocks: totalStocksVal,
      });
      onSuccess?.(`"${name.trim()}" added.`, "success");
      setName("");
      setPrice("");
      setTotalStocks("");
      removeImage();
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
              Image
            </label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-700">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-500/80 text-slate-300 hover:text-white text-xs px-2 py-1 rounded-md transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 bg-slate-900 border border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors group">
                <svg
                  className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 mb-1 transition-colors"
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
                <span className="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">
                  Click to choose image
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">
              Price Per Stock (USD)
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
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">
              Total Stocks
            </label>
            <input
              type="number"
              value={totalStocks}
              onChange={(e) => setTotalStocks(e.target.value)}
              min="0"
              step="1"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              placeholder="0"
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
              {loading ? "Adding\u2026" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
