import AdminDashboard from "./AdminDashboard";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import ProductStorefront from "./ProductStorefront";
import useAuthUser from "./hooks/useAuthUser";

export default function App() {
  const auth = useAuthUser();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthGate
            authLoading={auth.authLoading}
            user={auth.user}
            title="Products Store"
          >
            <ProductStorefront user={auth.user} />
          </AuthGate>
        }
      />
      <Route
        path="/admin"
        element={
          <AuthGate
            authLoading={auth.authLoading}
            user={auth.user}
            title="Admin Portal"
          >
            <AdminDashboard user={auth.user} isAdmin={auth.isAdmin} />
          </AuthGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
