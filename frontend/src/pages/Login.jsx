import Field from "../components/ui/Field.jsx";
import GoogleSignIn from "../features/account/GoogleSignIn.jsx";
import AuthShell from "../features/account/AuthShell.jsx";
import Button from "../components/ui/Button.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.js";

function Login() {
  const { login, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar,setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [precisaConfirmarEmail, setPrecisaConfirmarEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reenviandoEmail, setReenviandoEmail] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setErro("");
    setMensagem("");
    setPrecisaConfirmarEmail(false);
    setLoading(true);

    try {
      await login(email, senha, lembrar);
      navigate("/");
    } catch (error) {
      const dadosErro = error.response?.data || {};
      setErro(dadosErro.erro || (error.response
        ? "Não foi possível entrar. Tente novamente."
        : "Não foi possível conectar ao servidor. Confira sua conexão e tente novamente."));
      setPrecisaConfirmarEmail(Boolean(dadosErro.precisaConfirmarEmail));
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviarConfirmacao() {
    if (reenviandoEmail) return;
    if (!email.trim()) {
      setErro("Digite o email da conta antes de reenviar a confirmação.");
      return;
    }

    setErro("");
    setMensagem("");
    setReenviandoEmail(true);

    try {
      const resultado = await resendConfirmation(email.trim());
      setMensagem(resultado.mensagem || "Email de confirmação reenviado com sucesso.");
    } catch (error) {
      setErro(
        error.response?.data?.detalhe ||
          error.response?.data?.erro ||
          "Não foi possível reenviar o email de confirmação."
      );
    } finally {
      setReenviandoEmail(false);
    }
  }

  return (
    <AuthShell>
      <div  className="mx-auto max-w-lg">
        <div  className="mb-8 space-y-3">
          <span className="text-xs font-medium uppercase tracking-widest text-muted">BEM-VINDO DE VOLTA</span>
          <h1  className="font-display text-4xl leading-tight sm:text-5xl">Entrar na plataforma</h1>
          <p>Acesse sua conta para reservar, alugar ou comprar livros.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2"><Field label={"Email"}><input autoComplete="username" type="email" placeholder="Digite seu email" value={email} onChange={(event) => setEmail(event.target.value)} required/></Field></div>

          <div className="grid gap-2"><Field label={"Senha"} trailing={<Button type="button" onClick={() => setMostrarSenha((prev) => !prev)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} variant="ghost" className="px-2 text-xs">
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </Button>}><input type={mostrarSenha ? "text" : "password"} placeholder="Digite sua senha" autoComplete="current-password" value={senha} onChange={(event) => setSenha(event.target.value)} required/></Field><Link to="/esqueci-senha" className="text-sm underline underline-offset-4">
                Esqueci minha senha
              </Link></div>

          {erro && <StatusMessage type={"error"}>{erro}</StatusMessage>}
          {mensagem && <StatusMessage type={"info"}>{mensagem}</StatusMessage>}

          {precisaConfirmarEmail && (
            <Button type="button" onClick={handleReenviarConfirmacao} disabled={reenviandoEmail} variant="secondary" className="w-full">
              {reenviandoEmail ? "Reenviando..." : "Reenviar email de confirmação"}
            </Button>
          )}

          <label className="bc-auth-remember"><input type="checkbox" checked={lembrar} onChange={event=>setLembrar(event.target.checked)}/>Lembrar de mim</label>
          <Button disabled={loading} type="submit" variant="primary" className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <GoogleSignIn lembrar={lembrar}/>

        {import.meta.env.DEV && <div  className="mt-7 grid gap-1 border-l-2 border-stroke pl-4 text-xs text-muted">
          <strong>Acesso administrativo de teste</strong>
          <span>admin@biblioconnect.com</span>
          <span>admin123</span>
        </div>}

        <p  className="mt-7 text-sm text-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">
          Ainda não tem conta? <Link to="/cadastro">Criar cadastro</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default Login;
