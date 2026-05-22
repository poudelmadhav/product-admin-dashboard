import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { logEvent } from "firebase/analytics";
import { db, analytics } from "../firebase";

export default function useProducts(user, showToast) {
  const [products, setProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const unsubSnap = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({
          id: d.id,
          firestoreId: d.id,
          name: d.data().name ?? "",
          price: d.data().price ?? 0,
          imageUrl: d.data().imageUrl ?? "",
        }));
        setProducts(rows);
        setDataLoading(false);
      },
      (err) => {
        showToast("Failed to load products: " + err.message, "error");
        setDataLoading(false);
      }
    );
    return () => unsubSnap();
  }, [user, showToast]);

  const updateProduct = async (newRow, oldRow) => {
    if (newRow.name === oldRow.name && newRow.price === oldRow.price) {
      return oldRow;
    }
    const priceVal = parseFloat(newRow.price);
    if (isNaN(priceVal) || priceVal < 0) {
      showToast("Price must be a non-negative number.", "error");
      return oldRow;
    }
    try {
      await updateDoc(doc(db, "products", newRow.firestoreId), {
        name: newRow.name.trim(),
        price: priceVal,
        updatedAt: serverTimestamp(),
      });
      logEvent(analytics, "update_product", {
        product_id: newRow.firestoreId,
        product_name: newRow.name.trim(),
      });
      showToast(`"${newRow.name}" saved.`, "success");
      return { ...newRow, price: priceVal };
    } catch (err) {
      showToast("Save failed: " + err.message, "error");
      return oldRow;
    }
  };

  const deleteProduct = async (id) => {
    const deleted = products.find((p) => p.firestoreId === id);
    try {
      await deleteDoc(doc(db, "products", id));
      logEvent(analytics, "delete_product", {
        product_id: id,
        product_name: deleted?.name ?? "unknown",
      });
      showToast("Product deleted.", "info");
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  };

  return { products, dataLoading, updateProduct, deleteProduct };
}
