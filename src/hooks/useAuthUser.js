import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function useAuthUser() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        await setDoc(
          userRef,
          {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || null,
            photoURL: firebaseUser.photoURL || null,
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
        const userDoc = await getDoc(userRef);
        setIsAdmin(userDoc.data()?.role === "admin");
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  return { user, isAdmin, authLoading };
}
