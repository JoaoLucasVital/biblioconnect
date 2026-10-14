import { Suspense } from "react";
import { Link, Routes, Route } from "react-router-dom";
import AdminRoute from "./components/AdminRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import ClientLayout from "./layouts/ClientLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import { publicRoutes, clientRoutes, adminRoutes } from "./routes.js";
function routeElements(items) {
  return items.map(({path,Component})=><Route key={path} path={path} element={<Component/>}/>);
}
export default function AppRoutes() {
  return <Suspense fallback={<main className="mx-auto max-w-7xl px-5 py-16" role="status">Carregando página...</main>}>
    <Routes>
      <Route element={<PublicLayout/>}>
        {routeElements(publicRoutes)}
        <Route path="*" element={<main className="mx-auto max-w-7xl px-5 py-20"><p className="mb-3 text-sm text-muted">404</p><h1 className="font-display text-4xl">Página não encontrada</h1><Link to="/" className="mt-6 inline-flex min-h-11 items-center text-ink underline underline-offset-4">Voltar ao início</Link></main>}/>
      </Route>
      <Route element={<ProtectedRoute><ClientLayout/></ProtectedRoute>}>{routeElements(clientRoutes)}</Route>
      <Route element={<AdminRoute><AdminLayout/></AdminRoute>}>{routeElements(adminRoutes)}</Route>
    </Routes>
  </Suspense>;
}

