import { useState, useRef } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = "firebase-react-admin";

export default function ImageEditModal({ productId, currentImageUrl, onClose, showToast }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentImageUrl || "");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
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

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageUrl = currentImageUrl;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      await updateDoc(doc(db, "products", productId), {
        imageUrl,
        updatedAt: serverTimestamp(),
      });
      showToast?.("Image updated.", "success");
      onClose();
    } catch (err) {
      showToast?.("Save failed: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "products", productId), {
        imageUrl: "",
        updatedAt: serverTimestamp(),
      });
      showToast?.("Image removed.", "info");
      onClose();
    } catch (err) {
      showToast?.("Remove failed: " + err.message, "error");
    } finally {
      setSaving(false);
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Edit Image</h3>
            <p className="text-xs text-slate-500">
              Upload or remove the product image.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Product"
                className="w-full h-36 object-cover"
              />
            ) : (
              <div className="h-36 flex flex-col items-center justify-center text-slate-600">
                <svg
                  className="w-8 h-8 mb-1"
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
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors text-center cursor-pointer">
              {imagePreview ? "Change Image" : "Upload Image"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving}
                className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                Remove
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (!imageFile && !currentImageUrl)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-900 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving\u2026" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
