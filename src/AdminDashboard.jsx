import { useEffect, useState, useCallback } from "react";
import {
  DataGrid,
} from "@mui/x-data-grid";
import { ThemeProvider } from "@mui/material/styles";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { logEvent } from "firebase/analytics";
import { auth, db, analytics } from "./firebase";
import muiTheme from "./theme";
import LoginForm from "./components/LoginForm";
import Toast from "./components/Toast";
import AdminToolbar from "./components/AdminToolbar";
import AddProductModal from "./components/AddProductModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import ImageEditModal from "./components/ImageEditModal";
import ImageLightbox from "./components/ImageLightbox";
import StatsCards from "./components/StatsCards";
import useProducts from "./hooks/useProducts";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editImageId, setEditImageId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const { products, dataLoading, updateProduct, deleteProduct } =
    useProducts(user, showToast);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
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
        }
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      logEvent(analytics, "page_view", {
        page_title: "Admin Dashboard",
        page_location: window.location.href,
      });
    }
  }, [user, authLoading]);

  const handleProcessRowUpdateError = useCallback(
    (err) => showToast("Update error: " + err.message, "error"),
    [showToast]
  );

  const handleDeleteConfirmed = async (id) => {
    await deleteProduct(id);
    setDeleteId(null);
  };

  const filteredProducts = searchQuery
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const columns = [
    {
      field: "firestoreId",
      headerName: "Product ID",
      flex: 1,
      minWidth: 220,
      editable: false,
      cellClassName: "font-mono text-slate-500 text-xs",
      renderCell: (params) => (
        <span className="font-mono text-xs text-slate-500 truncate">
          {params.value}
        </span>
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
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(value)
          : "—",
    },
    {
      field: "imageUrl",
      headerName: "Image",
      width: 80,
      editable: false,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) =>
        params.value ? (
          <div className="flex items-center gap-1 h-full w-full">
            <img
              src={params.value}
              alt=""
              className="w-9 h-9 rounded-lg object-cover cursor-pointer ring-1 ring-slate-600 hover:ring-emerald-500 transition-all shrink-0"
              onClick={() => setLightboxUrl(params.value)}
            />
            {isAdmin && (
              <button
                onClick={() => setEditImageId(params.row.firestoreId)}
                className="text-slate-600 hover:text-emerald-400 transition-colors p-0.5"
                title="Edit image"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        ) : isAdmin ? (
          <button
            onClick={() => setEditImageId(params.row.firestoreId)}
            className="text-slate-600 hover:text-emerald-400 transition-colors text-xs"
            title="Add image"
          >
            + Add
          </button>
        ) : (
          <span className="text-slate-600">{"\u2014"}</span>
        ),
    },
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            ),
          },
        ]
      : []),
  ];

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

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-mono">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-100">
                Products Admin
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-widest ${
                  isAdmin
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-700/50 border-slate-600 text-slate-400"
                }`}
              >
                {isAdmin ? "Admin" : "Read-only"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-7 h-7 rounded-full ring-2 ring-slate-700"
                  />
                )}
                <span className="text-xs text-slate-300 hidden sm:block">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={() => {
                  logEvent(analytics, "logout");
                  signOut(auth);
                }}
                className="text-xs text-slate-500 hover:text-slate-200 transition-colors duration-150 flex items-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {!isAdmin && (
            <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 text-amber-400 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-amber-400">
                You have <strong>read-only</strong> access. Contact an
                administrator to request edit permissions.
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors duration-150"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Product
              </button>
            </div>
          )}

          <StatsCards products={products} isAdmin={isAdmin} />

          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
            />
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl">
            {isAdmin && (
              <div className="bg-slate-800/40 border-b border-slate-700/60 px-4 py-2 flex items-center gap-2">
                <span className="text-[10px] text-emerald-500 uppercase tracking-widest">
                  ● Live edit
                </span>
                <span className="text-[10px] text-slate-500">
                  Double-click any highlighted cell to edit. Changes auto-save
                  to Firestore.
                </span>
              </div>
            )}

            <div style={{ height: 520 }}>
              <DataGrid
                rows={filteredProducts}
                columns={columns}
                loading={dataLoading}
                editMode="cell"
                processRowUpdate={updateProduct}
                onProcessRowUpdateError={handleProcessRowUpdateError}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                slots={{
                  toolbar: () => (
                    <AdminToolbar
                      isAdmin={isAdmin}
                      onAddRow={() => setShowAddModal(true)}
                    />
                  ),
                }}
                slotProps={{
                  loadingOverlay: {
                    variant: "skeleton",
                    noRowsVariant: "skeleton",
                  },
                }}
                sx={{ border: "none" }}
              />
            </div>
          </div>
        </main>

        <ConfirmDeleteModal
          deleteId={deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirmed}
        />

        <AddProductModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={showToast}
        />

        {editImageId && (
          <ImageEditModal
            productId={editImageId}
            currentImageUrl={products.find((p) => p.firestoreId === editImageId)?.imageUrl ?? ""}
            onClose={() => setEditImageId(null)}
            showToast={showToast}
          />
        )}

        {lightboxUrl && (
          <ImageLightbox
            imageUrl={lightboxUrl}
            onClose={() => setLightboxUrl(null)}
          />
        )}

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
