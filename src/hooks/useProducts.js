import useProductList from "./useProductList";
import {
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { logEvent } from "firebase/analytics";
import { db, analytics } from "../firebase";

export default function useProducts(user, showToast) {
  const { products, dataLoading } = useProductList(user, showToast);

  const updateProduct = async (newRow, oldRow) => {
    if (
      newRow.name === oldRow.name &&
      newRow.price === oldRow.price &&
      newRow.totalStocks === oldRow.totalStocks
    ) {
      return oldRow;
    }
    const priceVal = parseFloat(newRow.price);
    const totalStocksVal = Number(newRow.totalStocks);
    if (isNaN(priceVal) || priceVal < 0) {
      showToast("Price must be a non-negative number.", "error");
      return oldRow;
    }
    if (
      newRow.totalStocks === "" ||
      !Number.isInteger(totalStocksVal) ||
      totalStocksVal < 0
    ) {
      showToast("Total stocks must be a non-negative whole number.", "error");
      return oldRow;
    }
    try {
      await updateDoc(doc(db, "products", newRow.firestoreId), {
        name: newRow.name.trim(),
        price: priceVal,
        totalStocks: totalStocksVal,
        updatedAt: serverTimestamp(),
      });
      logEvent(analytics, "update_product", {
        product_id: newRow.firestoreId,
        product_name: newRow.name.trim(),
      });
      showToast(`"${newRow.name}" saved.`, "success");
      return { ...newRow, price: priceVal, totalStocks: totalStocksVal };
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
