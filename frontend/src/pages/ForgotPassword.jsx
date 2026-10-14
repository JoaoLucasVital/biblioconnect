import AuthShell from "../features/account/AuthShell.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Field from "../components/ui/Field.jsx";
import Button from "../components/ui/Button.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setFeedback({ type: "", text: "" });

      const response = await api.post("/esqueci-senha", {
        email,
      });

      setFeedback({
        type: "success",
        text:
          response.data?.mensagem ||
          "Se este email estiver cadastrado, enviaremos um link de redefinição.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.erro ||
          "Erro ao solicitar redefinição de senha.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div  className="mx-auto max-w-lg">
        <div  className="mb-8 space-y-3">
          <span className="text-xs font-medium uppercase tracking-widest text-muted">SUA PRÓXIMA LEITURA COMEÇA AQUI</span>
          <h1  className="font-display text-4xl leading-tight sm:text-5xl">Esqueci minha senha</h1>
          <p>
            Informe o email cadastrado. Se ele existir no sistema, enviaremos um
            link para redefinir sua senha.
          </p>
        </div>

        {feedback.text && (
          <StatusMessage type={feedback.type}>
            {feedback.text}
          </StatusMessage>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2"><Field label={"Email cadastrado"}><input autoComplete="email" type="email" placeholder="Digite seu email" value={email} onChange={(event) => setEmail(event.target.value)} required/></Field></div>

          <Button disabled={loading} type="submit" variant="primary" className="w-full">
            {loading ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
        </form>

        <p  className="mt-7 text-sm text-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">
          Lembrou sua senha? <Link to="/login">Voltar para login</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default ForgotPassword;
