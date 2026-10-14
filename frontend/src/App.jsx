import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./AppRoutes.jsx";
import FavoritesProvider from "./features/community/FavoritesProvider.jsx";
import "./styles/global.css";
export default function App() {
  return <AuthProvider><FavoritesProvider><BrowserRouter><AppRoutes/></BrowserRouter></FavoritesProvider></AuthProvider>;
}
