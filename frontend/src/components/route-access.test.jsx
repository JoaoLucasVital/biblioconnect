import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { AuthContext } from "../context/auth.js";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";
import { renderWithRouter } from "../test/renderWithRouter.jsx";

function show(auth, Guard) {
  renderWithRouter(<AuthContext.Provider value={auth}><Routes>
    <Route path="/private" element={<Guard><h1>Conteúdo protegido</h1></Guard>} />
    <Route path="/login" element={<h1>Entrar na biblioteca</h1>} />
  </Routes></AuthContext.Provider>, { route: "/private" });
}

describe("proteção de acesso existente", () => {
  it("leva visitante ao login antes de mostrar conteúdo privado", async () => {
    show({ isAuthenticated: false, isAdmin: false, loadingAuth: false }, ProtectedRoute);
    expect(await screen.findByRole("heading", { name: "Entrar na biblioteca" })).toBeVisible();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });
  it("recusa conteúdo administrativo para um cliente autenticado", () => {
    show({ isAuthenticated: true, isAdmin: false, loadingAuth: false }, AdminRoute);
    expect(screen.getByRole("heading", { name: "Acesso negado" })).toBeVisible();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });
  it("aguarda a autenticação sem mostrar a área protegida", () => {
    show({ isAuthenticated: false, isAdmin: false, loadingAuth: true }, AdminRoute);
    expect(screen.getByText("Verificando autenticação...")).toBeVisible();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });
});
