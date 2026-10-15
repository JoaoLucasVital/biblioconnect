import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import Dialog from "../components/ui/Dialog.jsx";
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
  const [erro, setErro] = useState("");
  const [erroCarga, setErroCarga] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [mostrarResetRestrito, setMostrarResetRestrito] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [confirmacaoReset, setConfirmacaoReset] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetando, setResetando] = useState(false);

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

  async function resetarSistema() {
    if (resetando) return;
    try {
      setResetando(true);
      setErro("");
      setMensagem("");

      const response = await api.post("/admin/resetar-sistema", {
        senhaAdmin,
        confirmacao: confirmacaoReset,
      });

      setMensagem(response.data?.mensagem || "Sistema resetado com sucesso.");
      setShowResetConfirm(false);
      setSenhaAdmin("");
      setConfirmacaoReset("");
      setMostrarResetRestrito(false);

      await carregarDashboard();
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao resetar sistema.");
      setShowResetConfirm(false);
    } finally {
      setResetando(false);
    }
  }

  function abrirConfirmacaoReset(event) {
    event.preventDefault();

    if (!senhaAdmin) {
      setErro("Digite a senha do administrador para continuar.");
      return;
    }

    if (confirmacaoReset !== "RESETAR") {
      setErro('Digite exatamente "RESETAR" para liberar a ação.');
      return;
    }

    setErro("");
    setShowResetConfirm(true);
  }

  useInitialLoad(carregarDashboard);

  if (loading) {
    return <main className="bc-dashboard"><BookLoader label="Carregando painel administrativo…" /></main>;
  }
  if(erroCarga){
    return <main className="bc-dashboard"><header className="dashboard-header"><div><p className="dashboard-breadcrumb">Administração / Painel</p><AnimatedHeading>Visão geral da biblioteca.</AnimatedHeading><p className="dashboard-intro">Os indicadores estarão disponíveis após a conexão ser restabelecida.</p></div></header><StatusMessage type="error" onRetry={carregarDashboard}>{erroCarga}</StatusMessage></main>;
  }

  return (
    <main className="bc-dashboard">
      {erro && <StatusMessage type="error">{erro}</StatusMessage>}
      {mensagem && <StatusMessage type="info">{mensagem}</StatusMessage>}
      <DashboardOverview stats={stats} />
      <div>
        <section className="dashboard-reset">
          <div className="dashboard-reset-heading">
            <div>
              <span className="dashboard-eyebrow">Área restrita</span>
              <h2>Resetar dados para apresentação</h2>
              <p>
                Esta opção apaga usuários clientes, livros, pedidos, vendas,
                aluguéis, reservas, multas e capas cadastradas. O administrador
                padrão será mantido.
              </p>
            </div>

            <Button onClick={() => setMostrarResetRestrito((prev) => !prev)} type="button" variant="secondary">
              {mostrarResetRestrito ? "Ocultar área" : "Abrir área restrita"}
            </Button>
          </div>

          {mostrarResetRestrito && (
            <form onSubmit={abrirConfirmacaoReset} className="grid max-w-xl gap-5">
              <div className="grid gap-2"><Field label={"Senha do administrador"}><input type="password" placeholder="Digite a senha do admin" value={senhaAdmin} onChange={(event) => setSenhaAdmin(event.target.value)} required /></Field></div>

              <div className="grid gap-2"><Field label={"Confirmação textual"}><input type="text" placeholder='Digite exatamente "RESETAR"' value={confirmacaoReset} onChange={(event) =>
                    setConfirmacaoReset(event.target.value)
                  } required /></Field></div>

              <Button disabled={resetando} type="submit" variant="danger">
                Preparar reset
              </Button>
            </form>
          )}
        </section>
      </div>

      {showResetConfirm && (
        <Dialog open title={<>Confirmar reset geral</>} onClose={() => setShowResetConfirm(false)} busy={resetando} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={() => setShowResetConfirm(false)} disabled={resetando} type="button" variant="secondary">
                Cancelar
              </Button>

              <Button onClick={resetarSistema} disabled={resetando} type="button" variant="danger">
                {resetando ? "Resetando..." : "Confirmar reset geral"}
              </Button>
            </div>}>
            

            <p>
              Esta ação vai apagar os dados operacionais do sistema para deixar
              o projeto pronto para uma nova apresentação.
            </p>

            <div  className="grid gap-2 text-sm text-muted">
              <span>Todos os usuários clientes serão excluídos.</span>
              <span>Todos os livros cadastrados serão excluídos.</span>
              <span>Todos os pedidos, compras, reservas e aluguéis serão apagados.</span>
              <span>Todos os valores, gráficos, multas e rankings serão zerados.</span>
              <span>As capas enviadas dos livros serão removidas da pasta uploads.</span>
              <span>O administrador padrão será mantido.</span>
            </div>

            <p  className="text-sm text-red-700 dark:text-red-300">
              Essa ação não pode ser desfeita. Use apenas antes da apresentação
              ou quando quiser limpar completamente o ambiente.
            </p>

            
          {erro && <StatusMessage type="error">{erro}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default AdminDashboard;
