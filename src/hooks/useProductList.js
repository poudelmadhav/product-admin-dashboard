import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function useProductList(user, showToast) {
  const [products, setProducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      return;
    }

    setDataLoading(true);
    const unsubSnap = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({
          id: d.id,
          firestoreId: d.id,
          name: d.data().name ?? "",
          price: d.data().price ?? 0,
          totalStocks: d.data().totalStocks ?? 0,
          imageUrl: d.data().imageUrl ?? "",
        }));
        setProducts(rows);
        setDataLoading(false);
      },
      (err) => {
        showToast?.("Failed to load products: " + err.message, "error");
        setDataLoading(false);
      }
    );

    return () => unsubSnap();
  }, [user, showToast]);

  return { products, dataLoading };
}
