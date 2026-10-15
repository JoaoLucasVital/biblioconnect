import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import AuthShell from "../features/account/AuthShell.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api.js";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    if (novaSenha.length < 8) {
      setFeedback({
        type: "error",
        text: "A senha deve ter pelo menos 8 caracteres.",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setFeedback({
        type: "error",
        text: "As senhas não coincidem.",
      });
      return;
    }

    try {
      setLoading(true);
      setFeedback({ type: "", text: "" });

      const response = await api.patch(`/redefinir-senha/${token}`, {
        novaSenha,
      });

      setFeedback({
        type: "success",
        text: response.data?.mensagem || "Senha redefinida com sucesso.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1300);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao redefinir senha.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <section  className="mx-auto max-w-lg">
        <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Nova senha</span>

        <AnimatedHeading  className="font-display text-4xl leading-tight sm:text-5xl">Redefinir senha</AnimatedHeading>

        <p>Crie uma nova senha para acessar sua conta no BiblioConnect.</p>

        {feedback.text && (
          <StatusMessage type={feedback.type}>
            {feedback.text}
          </StatusMessage>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2"><Field label={"Nova senha"} trailing={<Button type="button" onClick={() => setMostrarNovaSenha((prev) => !prev)} aria-label={
                  mostrarNovaSenha ? "Ocultar nova senha" : "Mostrar nova senha"
                } variant="ghost" className="px-2 text-xs">
                {mostrarNovaSenha ? "Ocultar" : "Mostrar"}
              </Button>}><input type={mostrarNovaSenha ? "text" : "password"} autoComplete="new-password" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} placeholder="Mínimo de 8 caracteres" required/></Field></div>

          <div className="grid gap-2"><Field label={"Confirmar nova senha"} trailing={<Button type="button" onClick={() => setMostrarConfirmarSenha((prev) => !prev)} aria-label={
                  mostrarConfirmarSenha
                    ? "Ocultar confirmação de senha"
                    : "Mostrar confirmação de senha"
                } variant="ghost" className="px-2 text-xs">
                {mostrarConfirmarSenha ? "Ocultar" : "Mostrar"}
              </Button>}><input type={mostrarConfirmarSenha ? "text" : "password"} autoComplete="new-password" value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)} placeholder="Digite a senha novamente" required/></Field>{confirmarSenha && novaSenha !== confirmarSenha && (
              <small  className="text-sm text-red-700 dark:text-red-300">
                As senhas ainda não coincidem.
              </small>
            )}</div>

          <Button disabled={loading} type="submit" variant="primary" className="w-full">
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>

        <div  className="mt-6 text-sm underline underline-offset-4">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </section>
    </AuthShell>
  );
}

export default ResetPassword;
