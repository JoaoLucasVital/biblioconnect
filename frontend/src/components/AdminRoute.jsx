import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-16">
        <div role="status">
          <p className="text-muted">Verificando autenticação...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20">
        <div>
          <div className="border-l-2 border-accent pl-6">
            <h1 className="mb-3 font-display text-4xl">Acesso negado</h1>
            <p className="text-muted">Esta área é exclusiva para administradores.</p>
          </div>
        </div>
      </main>
    );
  }

  return children;
}

export default AdminRoute;
