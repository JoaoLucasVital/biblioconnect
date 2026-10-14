import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useMemo, useState } from "react";
import api from "../api/api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleDateString("pt-BR");
}

function montarEnderecoResumo(usuario) {
  const partes = [
    usuario.rua,
    usuario.numero ? `nº ${usuario.numero}` : "",
    usuario.bairro,
    usuario.cidade,
    usuario.estado,
  ].filter(Boolean);

  if (partes.length > 0) {
    return partes.join(", ");
  }

  return usuario.endereco || "Não informado";
}

function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [usuarioAcao, setUsuarioAcao] = useState(null);
  const [tipoAcao, setTipoAcao] = useState("");
  const [processando, setProcessando] = useState(false);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const carregarUsuarios = useCallback(async () => {
    try {

      const response = await api.get("/admin/usuarios");
      setUsuarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao carregar usuários.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  function abrirConfirmacao(usuario, tipo) {
    setUsuarioAcao(usuario);
    setTipoAcao(tipo);
  }

  function fecharConfirmacao() {
    setUsuarioAcao(null);
    setTipoAcao("");
  }

  async function confirmarAcao() {
    if (!usuarioAcao || !tipoAcao || processando) return;

    try {
      setProcessando(true);
      setFeedback({ type: "", text: "" });

      if (tipoAcao === "bloquear") {
        await api.patch(`/admin/usuarios/${usuarioAcao.id}/bloqueio`, {
          bloqueado: !usuarioAcao.bloqueado,
        });

        setFeedback({
          type: usuarioAcao.bloqueado ? "success" : "danger",
          text: usuarioAcao.bloqueado
            ? "Usuário descongelado com sucesso."
            : "Usuário congelado com sucesso.",
        });
      }

      if (tipoAcao === "remover") {
        await api.delete(`/admin/usuarios/${usuarioAcao.id}`);

        setFeedback({
          type: "danger",
          text: "Usuário removido com sucesso.",
        });
      }

      fecharConfirmacao();
      carregarUsuarios();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao executar ação.",
      });
    } finally {
      setProcessando(false);
    }
  }

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("todos");
  }

  useInitialLoad(carregarUsuarios);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const textoBusca = [
        usuario.nome,
        usuario.email,
        usuario.telefone,
        usuario.endereco,
        usuario.cep,
        usuario.rua,
        usuario.bairro,
        usuario.cidade,
        usuario.estado,
        usuario.numero,
        usuario.complemento,
        usuario.pontoReferencia,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const buscaValida = !termo || textoBusca.includes(termo);

      const statusValido =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && !usuario.bloqueado) ||
        (filtroStatus === "congelados" && usuario.bloqueado) ||
        (filtroStatus === "comMulta" && Number(usuario.multaTotal || 0) > 0) ||
        (filtroStatus === "emailConfirmado" && usuario.emailConfirmado) ||
        (filtroStatus === "emailPendente" && !usuario.emailConfirmado);

      return buscaValida && statusValido;
    });
  }, [usuarios, busca, filtroStatus]);

  const totalUsuarios = usuarios.length;
  const totalAtivos = usuarios.filter((usuario) => !usuario.bloqueado).length;
  const totalCongelados = usuarios.filter((usuario) => usuario.bloqueado).length;
  const totalComMulta = usuarios.filter(
    (usuario) => Number(usuario.multaTotal || 0) > 0
  ).length;

  const totalMultas = usuariosFiltrados.reduce((total, usuario) => {
    return total + Number(usuario.multaTotal || 0);
  }, 0);

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando usuários...</p>
        </div>
      </main>
    );
  }

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <h1  className="font-display text-4xl leading-tight sm:text-5xl">Usuários Cadastrados</h1>

        <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
          Visualize clientes, endereço completo, pendências, dados de contato e
          controle de congelamento.
        </p>

        {feedback.text && (
          <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>
        )}

        <section  className="my-8 border-y border-stroke py-6">
          <div  className="mb-5 flex flex-wrap items-center justify-between gap-4 [&_h2]:font-display [&_h2]:text-2xl [&_p]:text-sm [&_p]:text-muted">
            <div>
              <h2  className="font-display text-2xl leading-snug">Filtros de usuários</h2>
              <p>
                Busque clientes por dados pessoais, endereço, CEP ou status
                operacional.
              </p>
            </div>

            <Button onClick={limparFiltros} type="button" variant="secondary">
              Limpar filtros
            </Button>
          </div>

          <div  className="grid items-end gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Field label={"Buscar usuário"}><input type="text" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome, email, telefone, CEP, rua, bairro ou cidade" /></Field></div>

            <div className="grid gap-2"><Field label={"Status"}><select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="congelados">Congelados</option>
                <option value="comMulta">Com multa</option>
                <option value="emailConfirmado">Email confirmado</option>
                <option value="emailPendente">Email pendente</option>
              </select></Field></div>
          </div>
        </section>

        <section  className="mb-8 grid grid-cols-2 gap-5 xl:grid-cols-4 [&>div]:grid [&>div]:gap-2 [&_span]:text-xs [&_span]:text-muted [&_strong]:font-display [&_strong]:text-2xl">
          <div>
            <span>Total de usuários</span>
            <strong>{totalUsuarios}</strong>
          </div>

          <div>
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
          </div>

          <div>
            <span>Congelados</span>
            <strong>{totalCongelados}</strong>
          </div>

          <div>
            <span>Com multa</span>
            <strong>{totalComMulta}</strong>
          </div>

          <div>
            <span>Exibidos</span>
            <strong>{usuariosFiltrados.length}</strong>
          </div>

          <div>
            <span>Multas exibidas</span>
            <strong>{formatarMoeda(totalMultas)}</strong>
          </div>
        </section>

        {usuariosFiltrados.length === 0 ? (
          <div  className="my-8 border-y border-stroke py-12 text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
            <h2  className="font-display text-2xl leading-snug">Nenhum usuário encontrado</h2>
            <p>
              Ajuste os filtros ou aguarde clientes criarem conta na plataforma.
            </p>
          </div>
        ) : (
          <div  className="grid gap-7">
            {usuariosFiltrados.map((usuario) => (
              <article key={usuario.id} className="min-w-0 border-t border-stroke py-6">
                <div  className="flex min-w-0 items-start gap-4">
                  <div  className="grid h-11 w-11 shrink-0 place-items-center bg-soft text-lg">
                    {usuario.nome?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div>
                    <h2  className="font-display text-2xl leading-snug">{usuario.nome}</h2>
                    <p>{usuario.email}</p>
                  </div>

                  <span  className="rounded bg-soft px-2 py-1 text-xs">
                    {usuario.bloqueado ? "Congelado" : "Ativo"}
                  </span>
                </div>

                <div  className="min-w-0 [&_h2]:wrap-anywhere [&_h2]:font-display [&_h2]:text-2xl [&_p]:wrap-anywhere [&_p]:text-sm [&_p]:text-muted">
                  <div>
                    <span>Telefone</span>
                    <strong>{usuario.telefone || "Não informado"}</strong>
                  </div>

                  <div>
                    <span>Cadastro</span>
                    <strong>{formatarData(usuario.createdAt)}</strong>
                  </div>

                  <div>
                    <span>Pedidos</span>
                    <strong>{usuario.totalPedidos}</strong>
                  </div>

                  <div>
                    <span>Multa total</span>
                    <strong>{formatarMoeda(usuario.multaTotal)}</strong>
                  </div>

                  <div>
                    <span>Email confirmado</span>
                    <strong>{usuario.emailConfirmado ? "Sim" : "Não"}</strong>
                  </div>

                  <div>
                    <span>CEP</span>
                    <strong>{usuario.cep || "Não informado"}</strong>
                  </div>
                </div>

                <div  className="my-6 border-l-2 border-stroke pl-5 text-sm">
                  <div  className="mb-4 grid gap-2 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-medium">
                    <span>Endereço completo</span>
                    <strong>{montarEnderecoResumo(usuario)}</strong>
                  </div>

                  <div  className="grid grid-cols-2 gap-4 lg:grid-cols-3 [&>div]:grid [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-medium">
                    <div>
                      <span>Rua / Avenida</span>
                      <strong>{usuario.rua || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Número</span>
                      <strong>{usuario.numero || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Bairro</span>
                      <strong>{usuario.bairro || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Cidade</span>
                      <strong>{usuario.cidade || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Estado</span>
                      <strong>{usuario.estado || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Complemento</span>
                      <strong>{usuario.complemento || "Não informado"}</strong>
                    </div>

                    <div  className="col-span-full">
                      <span>Ponto de referência</span>
                      <strong>
                        {usuario.pontoReferencia || "Não informado"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div  className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => abrirConfirmacao(usuario, "bloquear")} type="button" variant={usuario.bloqueado ? "primary" : "secondary"}>
                    {usuario.bloqueado ? "Descongelar" : "Congelar"}
                  </Button>

                  <Button onClick={() => abrirConfirmacao(usuario, "remover")} type="button" variant="danger">
                    Remover
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {usuarioAcao && (
        <Dialog open title={<>
              {tipoAcao === "remover"
                ? "Remover usuário"
                : usuarioAcao.bloqueado
                ? "Descongelar usuário"
                : "Congelar usuário"}
            </>} onClose={fecharConfirmacao} busy={processando} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={fecharConfirmacao} disabled={processando} type="button" variant="secondary">
                Voltar
              </Button>

              <Button onClick={confirmarAcao} disabled={processando} type="button" variant={tipoAcao==="remover" ? "danger" : "primary"}>
                {processando ? "Processando..." : "Confirmar"}
              </Button>
            </div>}>
            

            <p>
              {tipoAcao === "remover"
                ? "Tem certeza que deseja remover este usuário? Usuários com pedidos vinculados não poderão ser removidos."
                : usuarioAcao.bloqueado
                ? "Este usuário voltará a poder comprar, alugar e reservar livros."
                : "Este usuário ficará impedido de comprar, alugar e reservar novos livros até ser descongelado."}
            </p>

            <div  className="grid gap-2 text-sm text-muted">
              <span>Nome: {usuarioAcao.nome}</span>
              <span>Email: {usuarioAcao.email}</span>
              <span>Telefone: {usuarioAcao.telefone || "Não informado"}</span>
              <span>Endereço: {montarEnderecoResumo(usuarioAcao)}</span>
              <span>Multa total: {formatarMoeda(usuarioAcao.multaTotal)}</span>
            </div>

            
          {feedback.type==="error" && feedback.text && <StatusMessage type="error">{feedback.text}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default AdminUsers;
