// AdminDashboard.jsx
// Dependencies (add to package.json):
//   npm install firebase @mui/x-data-grid @mui/material @emotion/react @emotion/styled

import React, { useEffect, useState, useCallback } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { getDoc } from "firebase/firestore";

// ─── MUI dark theme tuned to match the dashboard palette ──────────────────────
const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6ee7b7" },       // emerald-300
    background: {
      default: "#0f172a",               // slate-900
      paper: "#1e293b",                 // slate-800
    },
    text: {
      primary: "#f1f5f9",              // slate-100
      secondary: "#94a3b8",            // slate-400
    },
  },
  typography: {
    fontFamily: "'DM Mono', monospace",
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "1px solid #334155",
          borderRadius: "12px",
          backgroundColor: "#1e293b",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#0f172a",
            borderBottom: "1px solid #334155",
            color: "#6ee7b7",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          },
          "& .MuiDataGrid-cell": {
            borderColor: "#334155",
            color: "#e2e8f0",
            fontSize: "0.875rem",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#273549",
          },
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: "#1a3a2e !important",
          },
          "& .editable-cell": {
            cursor: "cell",
            borderLeft: "2px solid #6ee7b7",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #334155",
            backgroundColor: "#0f172a",
          },
        },
      },
    },
  },
});

// ─── Custom Toolbar ────────────────────────────────────────────────────────────
function AdminToolbar({ isAdmin, onAddRow }) {
  return (
    <GridToolbarContainer className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      {isAdmin && (
        <button
          onClick={onAddRow}
          className="ml-auto flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Product
        </button>
      )}
    </GridToolbarContainer>
  );
}

// ─── Login Form ────────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/ \(auth\/.*\)\.?/, ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code !== "auth/cancelled-popup-request" && err.code !== "auth/popup-closed-by-user") {
        setError(err.message.replace("Firebase: ", "").replace(/ \(auth\/.*\)\.?/, ""));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="font-mono text-xl font-bold text-slate-100 tracking-tight">Admin Portal</h1>
          <p className="font-mono text-xs text-slate-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="font-mono text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-900 font-mono font-bold text-sm py-2.5 rounded-lg transition-colors duration-150"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 disabled:bg-white/60 text-slate-800 font-mono font-semibold text-sm py-2.5 rounded-lg transition-colors duration-150"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? "Signing in…" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}

// ─── Toast Notification ────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    error:   "bg-red-500/10 border-red-500/30 text-red-300",
    info:    "bg-blue-500/10 border-blue-500/30 text-blue-300",
  };

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 border rounded-lg px-4 py-3 font-mono text-sm animate-fade-in shadow-2xl backdrop-blur-sm z-50 ${colors[type]}`}>
      {type === "success" && <span>✓</span>}
      {type === "error"   && <span>✕</span>}
      {type === "info"    && <span>ℹ</span>}
      {message}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [user, setUser]             = useState(null);        // Firebase Auth user
  const [isAdmin, setIsAdmin]       = useState(false);       // Firestore role check
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts]     = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast]           = useState(null);         // { message, type }
  const [deleteId, setDeleteId]     = useState(null);         // confirm-delete modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // ── Auth listener ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch the user's Firestore document to check their role
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          setIsAdmin(userDoc.exists() && userDoc.data().role === "admin");
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // ── Realtime products listener ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const unsubSnap = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({
          id: d.id,          // DataGrid requires an 'id' field
          firestoreId: d.id,
          name: d.data().name ?? "",
          price: d.data().price ?? 0,
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

  // ── processRowUpdate — auto-save on cell commit ──────────────────────────────
  const processRowUpdate = useCallback(
    async (newRow, oldRow) => {
      // Nothing changed — skip the write
      if (newRow.name === oldRow.name && newRow.price === oldRow.price) {
        return oldRow;
      }
      const priceVal = parseFloat(newRow.price);
      if (isNaN(priceVal) || priceVal < 0) {
        showToast("Price must be a non-negative number.", "error");
        return oldRow; // Reject the update
      }
      try {
        await updateDoc(doc(db, "products", newRow.firestoreId), {
          name:      newRow.name.trim(),
          price:     priceVal,
          updatedAt: serverTimestamp(),
        });
        showToast(`"${newRow.name}" saved.`, "success");
        return { ...newRow, price: priceVal };
      } catch (err) {
        showToast("Save failed: " + err.message, "error");
        return oldRow; // Roll back
      }
    },
    [showToast]
  );

  const handleProcessRowUpdateError = useCallback(
    (err) => showToast("Update error: " + err.message, "error"),
    [showToast]
  );

  // ── Add Product Modal ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setAddName("");
    setAddPrice("");
    setShowAddModal(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const priceVal = parseFloat(addPrice);
    if (!addName.trim()) {
      showToast("Product name is required.", "error");
      return;
    }
    if (isNaN(priceVal) || priceVal < 0) {
      showToast("Price must be a non-negative number.", "error");
      return;
    }
    setAddLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name:      addName.trim(),
        price:     priceVal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`"${addName.trim()}" added.`, "success");
      setShowAddModal(false);
    } catch (err) {
      showToast("Could not add product: " + err.message, "error");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Delete a product ─────────────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "products", deleteId));
      showToast("Product deleted.", "info");
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Column definitions ───────────────────────────────────────────────────────
  const columns = [
    {
      field: "firestoreId",
      headerName: "Product ID",
      flex: 1,
      minWidth: 220,
      editable: false,
      cellClassName: "font-mono text-slate-500 text-xs",
      renderCell: (params) => (
        <span className="font-mono text-xs text-slate-500 truncate">{params.value}</span>
      ),
    },
    {
      field: "name",
      headerName: "Product Name",
      flex: 1.5,
      minWidth: 200,
      editable: isAdmin,
      cellClassName: isAdmin ? "editable-cell" : "",
    },
    {
      field: "price",
      headerName: "Price (USD)",
      flex: 0.8,
      minWidth: 130,
      editable: isAdmin,
      type: "number",
      cellClassName: isAdmin ? "editable-cell" : "",
      valueFormatter: (value) =>
        value != null
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
          : "—",
    },
    // Delete column — admin only
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: "",
            width: 60,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
              <button
                onClick={() => setDeleteId(params.row.firestoreId)}
                className="text-slate-600 hover:text-red-400 transition-colors duration-150 p-1 rounded"
                title="Delete product"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ),
          },
        ]
      : []),
  ];

  // ─── Render states ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-slate-500">Authenticating…</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginForm />;

  // ─── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={muiTheme}>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-mono">

        {/* ── Header ── */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-100">Products Admin</span>
              {/* Role badge */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-widest ${
                isAdmin
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-700/50 border-slate-600 text-slate-400"
              }`}>
                {isAdmin ? "Admin" : "Read-only"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 hidden sm:block">{user.email}</span>
              <button
                onClick={() => signOut(auth)}
                className="text-xs text-slate-500 hover:text-slate-200 transition-colors duration-150 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

          {/* Info banner for non-admins */}
          {!isAdmin && (
            <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-amber-400">
                You have <strong>read-only</strong> access. Contact an administrator to request edit permissions.
              </p>
            </div>
          )}

          {/* Add Product button */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Product
              </button>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total Products",
                value: products.length,
                icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
              },
              {
                label: "Avg. Price",
                value: products.length
                  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                      products.reduce((s, p) => s + p.price, 0) / products.length
                    )
                  : "—",
                icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                label: "Access Level",
                value: isAdmin ? "Admin" : "Viewer",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                  </svg>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-slate-100">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
            />
          </div>

          {/* Data Grid */}
          <div className="rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
            {/* Admin hint */}
            {isAdmin && (
              <div className="bg-slate-800/40 border-b border-slate-700/60 px-4 py-2 flex items-center gap-2">
                <span className="text-[10px] text-emerald-500 uppercase tracking-widest">● Live edit</span>
                <span className="text-[10px] text-slate-500">Double-click any highlighted cell to edit. Changes auto-save to Firestore.</span>
              </div>
            )}

            <div style={{ height: 520 }}>
              <DataGrid
                rows={searchQuery
                  ? products.filter((p) =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : products}
                columns={columns}
                loading={dataLoading}
                editMode="cell"
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={handleProcessRowUpdateError}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                slots={{
                  toolbar: () => <AdminToolbar isAdmin={isAdmin} onAddRow={openAddModal} />,
                }}
                slotProps={{
                  loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" },
                }}
                sx={{ border: "none" }}
              />
            </div>
          </div>
        </main>

        {/* ── Delete Confirm Modal ── */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Delete Product</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-5 font-mono bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700 break-all">
                ID: {deleteId}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Product Modal ── */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Add Product</h3>
                  <p className="text-xs text-slate-500">Enter the product details below.</p>
                </div>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">Product Name</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                    placeholder="e.g. Widget Pro"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-slate-400 mb-1.5 uppercase tracking-widest">Price (USD)</label>
                  <input
                    type="number"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
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
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-900 text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    {addLoading ? "Adding…" : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Toast ── */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
