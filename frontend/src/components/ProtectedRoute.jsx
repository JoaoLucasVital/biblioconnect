import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import BookLoader from './ui/BookLoader.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-16">
        <BookLoader label="Verificando autenticação..."/>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
