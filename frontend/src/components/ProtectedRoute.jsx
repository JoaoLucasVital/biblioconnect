import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth } = useAuth();

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

  return children;
}

export default ProtectedRoute;
