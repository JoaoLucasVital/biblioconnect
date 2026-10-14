import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import api from "../api/api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

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
  const [mensagem, setMensagem] = useState("");

  const [mostrarResetRestrito, setMostrarResetRestrito] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [confirmacaoReset, setConfirmacaoReset] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetando, setResetando] = useState(false);

  const carregarDashboard = useCallback(async () => {
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
      setErro(
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

  const barData = useMemo(
    () => [
      { nome: "Reservas", valor: stats.reservas },
      { nome: "Vendas", valor: stats.vendas },
      { nome: "Aluguéis", valor: stats.alugueis },
      { nome: "Atrasos", valor: stats.atrasos },
    ],
    [stats]
  );

  const pieData = useMemo(
    () => [
      {
        name: "Usuários ativos",
        value: Math.max(stats.usuarios - stats.usuariosBloqueados, 0),
      },
      { name: "Usuários congelados", value: stats.usuariosBloqueados },
    ],
    [stats]
  );

  const generosData = useMemo(
    () =>
      stats.generosMaisVendidos.map((item) => ({
        nome: item.genero,
        vendas: item.quantidadeVendas,
      })),
    [stats.generosMaisVendidos]
  );

  const livrosData = useMemo(
    () =>
      stats.livrosMaisVendidos.map((item) => ({
        nome:
          item.titulo.length > 16
            ? `${item.titulo.slice(0, 16)}...`
            : item.titulo,
        vendas: item.quantidadeVendas,
      })),
    [stats.livrosMaisVendidos]
  );

  const pieColors = ["#1E3A5F", "#E67E00"];

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando painel administrativo...</p>
        </div>
      </main>
    );
  }

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <section  className="mb-8 flex flex-wrap items-start justify-between gap-6 border-b border-stroke pb-8">
          <div  className="min-w-0 [&_h1]:font-display [&_h1]:text-4xl [&_p]:mt-3 [&_p]:text-muted [&_p]:text-sm">
            <span  className="mb-3 block text-xs uppercase tracking-[0.15em] text-muted">Área administrativa</span>
            <h1  className="font-display text-4xl leading-tight sm:text-5xl">Painel do BiblioConnect</h1>
            <p>
              Controle pedidos, usuários, livros, vendas, gêneros, atrasos e
              multas com visão operacional clara.
            </p>
          </div>

          <div  className="grid gap-2 border-l-2 border-accent pl-5 text-sm [&_strong]:font-display [&_strong]:text-2xl [&_small]:text-muted">
            <span  className="text-xs uppercase tracking-[0.15em] text-muted">Pendências</span>
            <strong>{stats.atrasos} atrasos ativos</strong>
            <small>{formatarMoeda(stats.multasPendentes)} em multas</small>
          </div>
        </section>

        {erro && <StatusMessage type={"error"}>{erro}</StatusMessage>}
        {mensagem && <StatusMessage type={"info"}>{mensagem}</StatusMessage>}

        <section  className="my-6 flex flex-wrap gap-3 text-sm">
          <div>
            <span  className="bg-soft px-3 py-2 text-sm">🔥 Livro mais vendido</span>

            <strong>
              {stats.livroMaisVendido
                ? stats.livroMaisVendido.titulo
                : "Sem vendas registradas"}
            </strong>

            {stats.livroMaisVendido && (
              <small>
                {stats.livroMaisVendido.quantidadeVendas} venda
                {stats.livroMaisVendido.quantidadeVendas !== 1 ? "s" : ""}
              </small>
            )}
          </div>

          <div>
            <span  className="bg-soft px-3 py-2 text-sm">🔥 Gênero mais vendido</span>

            <strong>
              {stats.generoMaisVendido
                ? stats.generoMaisVendido.genero
                : "Sem gêneros ranqueados"}
            </strong>

            {stats.generoMaisVendido && (
              <small>
                {stats.generoMaisVendido.quantidadeVendas} venda
                {stats.generoMaisVendido.quantidadeVendas !== 1 ? "s" : ""}
              </small>
            )}
          </div>
        </section>

        {stats.atrasos > 0 && (
          <section  className="mb-7 flex flex-wrap items-center justify-between gap-4 border-l-2 border-red-700 bg-red-50 p-5 text-red-900 dark:bg-red-950 dark:text-red-100">
            <div  className="grid gap-2 text-sm">
              <h2  className="font-display text-2xl leading-snug">Existem pendências operacionais em aberto</h2>
              <p>
                Há reservas ou aluguéis em atraso. Acesse a área de atrasos
                para acompanhar multas e agir sobre usuários inadimplentes.
              </p>
            </div>

            <Link to="/admin/atrasos" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">
              Ver atrasos
            </Link>
          </section>
        )}

        <section  className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/admin/pedidos" className="grid gap-2 border-t border-stroke py-5 text-sm [&_strong]:font-display [&_strong]:text-xl [&_span]:text-muted [&_small]:text-muted border-accent">
            <span  className="text-xs uppercase tracking-wider">Operação</span>
            <strong>Gerenciar pedidos</strong>
            <small>Concluir, devolver ou cancelar pedidos em andamento.</small>
          </Link>

          <Link to="/admin/livros" className="grid gap-2 border-t border-stroke py-5 text-sm [&_strong]:font-display [&_strong]:text-xl [&_span]:text-muted [&_small]:text-muted">
            <span  className="text-xs uppercase tracking-wider">Catálogo</span>
            <strong>Gerenciar livros</strong>
            <small>Editar, pausar, destacar e organizar o acervo.</small>
          </Link>

          <Link to="/admin/usuarios" className="grid gap-2 border-t border-stroke py-5 text-sm [&_strong]:font-display [&_strong]:text-xl [&_span]:text-muted [&_small]:text-muted">
            <span  className="text-xs uppercase tracking-wider">Clientes</span>
            <strong>Usuários</strong>
            <small>Visualizar clientes, multas e status de bloqueio.</small>
          </Link>

          <Link to="/admin/atrasos" className="grid gap-2 border-t border-stroke py-5 text-sm [&_strong]:font-display [&_strong]:text-xl [&_span]:text-muted [&_small]:text-muted text-red-700 dark:text-red-300">
            <span  className="text-xs uppercase tracking-wider">Financeiro</span>
            <strong>Atrasos e multas</strong>
            <small>Monitorar inadimplência e resolver pendências.</small>
          </Link>
        </section>

        <section  className="mb-10 grid grid-cols-2 gap-x-6 gap-y-5 xl:grid-cols-4">
          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Reservas</span>
            <strong>{stats.reservas}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Vendas</span>
            <strong>{stats.vendas}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Aluguéis</span>
            <strong>{stats.alugueis}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Atrasos</span>
            <strong>{stats.atrasos}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Usuários</span>
            <strong>{stats.usuarios}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Congelados</span>
            <strong>{stats.usuariosBloqueados}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Livros</span>
            <strong>{stats.livros}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-3xl">
            <span>Multas pendentes</span>
            <strong>{formatarMoeda(stats.multasPendentes)}</strong>
          </div>
        </section>

        <section  className="my-8 grid min-w-0 gap-7 xl:grid-cols-2">
          <div  className="min-w-0 border-t border-stroke pt-6">
            <div  className="mb-5 [&_h2]:font-display [&_h2]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
              <div>
                <h2  className="font-display text-2xl leading-snug">Movimentações da biblioteca</h2>
                <p>Reservas, vendas, aluguéis e atrasos atuais.</p>
              </div>
            </div>

            <div  className="h-72 min-w-0 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6dde7"/>
                  <XAxis dataKey="nome" tick={{ fill: "#5b6676", fontSize: 12 }}/>
                  <YAxis tick={{ fill: "#5b6676", fontSize: 12 }}/>
                  <Tooltip/>
                  <Bar dataKey="valor" fill="#1E3A5F" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div  className="min-w-0 border-t border-stroke pt-6">
            <div  className="mb-5 [&_h2]:font-display [&_h2]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
              <div>
                <h2  className="font-display text-2xl leading-snug">Status de usuários</h2>
                <p>Distribuição entre usuários ativos e congelados.</p>
              </div>
            </div>

            <div  className="h-72 min-w-0 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]}/>
                    ))}
                  </Pie>
                  <Tooltip/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section  className="my-8 grid min-w-0 gap-7 xl:grid-cols-2">
          <div  className="min-w-0 border-t border-stroke pt-6">
            <div  className="mb-5 [&_h2]:font-display [&_h2]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
              <div>
                <h2  className="font-display text-2xl leading-snug">Livros mais vendidos</h2>
                <p>Ranking automático baseado em compras registradas.</p>
              </div>
            </div>

            {livrosData.length > 0 ? (
              <div  className="h-72 min-w-0 w-full">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={livrosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d6dde7"/>
                    <XAxis dataKey="nome" tick={{ fill: "#5b6676", fontSize: 12 }}/>
                    <YAxis tick={{ fill: "#5b6676", fontSize: 12 }}/>
                    <Tooltip/>
                    <Bar dataKey="vendas" fill="#E67E00" radius={[8, 8, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div  className="py-8 text-sm text-muted">
                <h4>Sem vendas registradas</h4>
                <p>O gráfico será preenchido quando houver compras.</p>
              </div>
            )}
          </div>

          <div  className="min-w-0 border-t border-stroke pt-6">
            <div  className="mb-5 [&_h2]:font-display [&_h2]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
              <div>
                <h2  className="font-display text-2xl leading-snug">Gêneros mais vendidos</h2>
                <p>Preferência dos leitores por categoria.</p>
              </div>
            </div>

            {generosData.length > 0 ? (
              <div  className="h-72 min-w-0 w-full">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={generosData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d6dde7"/>
                    <XAxis dataKey="nome" tick={{ fill: "#5b6676", fontSize: 12 }}/>
                    <YAxis tick={{ fill: "#5b6676", fontSize: 12 }}/>
                    <Tooltip/>
                    <Bar dataKey="vendas" fill="#1E3A5F" radius={[8, 8, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div  className="py-8 text-sm text-muted">
                <h4>Sem gêneros ranqueados</h4>
                <p>O gráfico será preenchido quando houver compras.</p>
              </div>
            )}
          </div>
        </section>

        <section  className="mt-12 border-t border-stroke pt-6">
          <div  className="mb-6 flex flex-wrap justify-between gap-4 [&_h2]:font-display [&_h2]:text-2xl [&_p]:mt-3 [&_p]:max-w-xl [&_p]:text-sm [&_p]:text-muted">
            <div>
              <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Área restrita</span>
              <h2  className="font-display text-2xl leading-snug">Resetar dados para apresentação</h2>
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