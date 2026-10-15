import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";
import BookLoader from './ui/BookLoader.jsx';
import {AnimatedHeading} from './motion/TextAnimations.jsx';

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loadingAuth } = useAuth();

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

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20">
        <div>
          <div className="border-l-2 border-accent pl-6">
            <AnimatedHeading className="mb-3 font-display text-4xl">Acesso negado</AnimatedHeading>
            <p className="text-muted">Esta área é exclusiva para administradores.</p>
          </div>
        </div>
      </main>
    );
  }

  return children;
}

export default AdminRoute;
