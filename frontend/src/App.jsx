import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./AppRoutes.jsx";
import FavoritesProvider from "./features/community/FavoritesProvider.jsx";
import GlobalClickSpark from "./components/motion/GlobalClickSpark.jsx";
import ScrollReset from "./components/motion/ScrollReset.jsx";
import LoadingProvider from "./components/ui/LoadingProvider.jsx";
import WelcomeGate from "./features/account/WelcomeGate.jsx";
import "./styles/global.css";
export default function App() {
  return <AuthProvider><FavoritesProvider><BrowserRouter><ScrollReset/><LoadingProvider><AppRoutes/></LoadingProvider><WelcomeGate/><GlobalClickSpark/></BrowserRouter></FavoritesProvider></AuthProvider>;
}
