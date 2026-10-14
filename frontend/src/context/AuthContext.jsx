import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useState } from "react";
import api from "../api/api.js";

import { AuthContext } from "./auth.js";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const updateUser = useCallback(next => setUsuario(current => current?.id === next.id ? next : current), []);
  const acceptSession = useCallback(({usuario,csrfToken}) => {
    api.setCsrfToken(csrfToken);
    setUsuario(usuario);
  }, []);

  const carregarUsuarioLogado = useCallback(async () => {
    localStorage.removeItem("@biblioconnect:token");
    localStorage.removeItem("@biblioconnect:usuario");
    try {
      const {data} = await api.get("/auth/session");
      api.setCsrfToken(data.csrfToken);
      setUsuario(data.usuario);
    } catch {
      localStorage.removeItem("@biblioconnect:token");
      localStorage.removeItem("@biblioconnect:usuario");
      api.setCsrfToken(null);
      setUsuario(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  async function login(email, senha, lembrar = false) {
    const response = await api.post("/login", {
      email,
      senha,
      lembrar,
    });

    const { usuario, csrfToken } = response.data;
    api.setCsrfToken(csrfToken);
    setUsuario(usuario);
    return usuario;
  }

  async function register(dados) {
    const response = await api.post("/usuarios", dados);
    return response.data;
  }

  async function resendConfirmation(email) {
    const response = await api.post("/reenviar-confirmacao", { email });
    return response.data;
  }

  async function logout() {
    await api.post("/auth/logout");
    api.setCsrfToken(null);
    localStorage.removeItem("@biblioconnect:token");
    localStorage.removeItem("@biblioconnect:usuario");
    setUsuario(null);
  }

  useInitialLoad(carregarUsuarioLogado);

  const isAuthenticated = !!usuario;
  const isAdmin = usuario?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated,
        isAdmin,
        loadingAuth,
        login,
        register,
        resendConfirmation,
        logout,
        acceptSession,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
