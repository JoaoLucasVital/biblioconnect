import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import StatusMessage from "../components/ui/StatusMessage.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useState } from "react";
import DashboardOverview from "../features/admin/dashboard-overview.jsx";
import api from "../api/api.js";
import BookLoader from "../components/ui/BookLoader.jsx";

function AdminDashboard() {
  const [stats, setStats] = useState({
    reservas: 0,
    vendas: 0,
    alugueis: 0,
    usuarios: 0,
    usuariosBloqueados: 0,
    livros: 0,
    atrasos: 0,
    multasPendentes: 0,
    livrosMaisVendidos: [],
    generosMaisVendidos: [],
    livroMaisVendido: null,
    generoMaisVendido: null,
  });

  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState("");

  const carregarDashboard = useCallback(async () => {
    setLoading(true);
    setErroCarga("");
    try {

      const response = await api.get("/admin/dashboard");

      setStats({
        reservas: response.data.reservas || 0,
        vendas: response.data.vendas || 0,
        alugueis: response.data.alugueis || 0,
        usuarios: response.data.usuarios || 0,
        usuariosBloqueados: response.data.usuariosBloqueados || 0,
        livros: response.data.livros || 0,
        atrasos: response.data.atrasos || 0,
        multasPendentes: response.data.multasPendentes || 0,
        livrosMaisVendidos: response.data.livrosMaisVendidos || [],
        generosMaisVendidos: response.data.generosMaisVendidos || [],
        livroMaisVendido: response.data.livroMaisVendido || null,
        generoMaisVendido: response.data.generoMaisVendido || null,
      });
    } catch (error) {
      setErroCarga(
        error.response?.data?.erro ||
          "Erro ao carregar dados do painel administrativo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useInitialLoad(carregarDashboard);

  if (loading) {
    return <main className="bc-dashboard"><BookLoader label="Carregando painel administrativo…" /></main>;
  }
  if(erroCarga){
    return <main className="bc-dashboard"><header className="dashboard-header"><div><p className="dashboard-breadcrumb">Administração / Painel</p><AnimatedHeading>Visão geral da biblioteca.</AnimatedHeading><p className="dashboard-intro">Os indicadores estarão disponíveis após a conexão ser restabelecida.</p></div></header><StatusMessage type="error" onRetry={carregarDashboard}>{erroCarga}</StatusMessage></main>;
  }

  return <main className="bc-dashboard"><DashboardOverview stats={stats}/></main>;
}

export default AdminDashboard;
