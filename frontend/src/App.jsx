import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./AppRoutes.jsx";
import "./styles/global.css";
export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes/></BrowserRouter></AuthProvider>;
}
