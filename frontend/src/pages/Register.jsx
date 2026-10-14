import Field from "../components/ui/Field.jsx";
import GoogleSignIn from "../features/account/GoogleSignIn.jsx";
import Button from "../components/ui/Button.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FadeInput from "../components/ui/FadeInput.jsx";
import { useAuth } from "../context/auth.js";

function limparCep(valor) {
  return String(valor || "").replace(/\D/g, "").slice(0, 8);
}

function formatarCep(valor) {
  const cepLimpo = limparCep(valor);

  if (cepLimpo.length <= 5) {
    return cepLimpo;
  }

  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
}

function Register() {
  const { register, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    cep: "",
    rua: "",
    bairro: "",
    cidade: "",
    estado: "",
    numero: "",
    complemento: "",
    pontoReferencia: "",
  });

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviandoEmail, setReenviandoEmail] = useState(false);
  const [emailCadastroPendente, setEmailCadastroPendente] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [cepFeedback, setCepFeedback] = useState({
    type: "",
    text: "",
    fading: false,
  });

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  function mostrarCepFeedback(type, text) {
    setCepFeedback({
      type,
      text,
      fading: false,
    });

    setTimeout(() => {
      setCepFeedback((prev) => ({
        ...prev,
        fading: true,
      }));
    }, 4200);

    setTimeout(() => {
      setCepFeedback({
        type: "",
        text: "",
        fading: false,
      });
    }, 5000);
  }

  function limparFeedbackCep() {
    setCepFeedback({
      type: "",
      text: "",
      fading: false,
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "cep") {
      setForm((prev) => ({
        ...prev,
        cep: formatarCep(value),
      }));

      limparFeedbackCep();
      return;
    }

    if (name === "estado") {
      setForm((prev) => ({
        ...prev,
        estado: value.toUpperCase().slice(0, 2),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function buscarCep() {
    const cepLimpo = limparCep(form.cep);

    setErro("");
    limparFeedbackCep();

    if (cepLimpo.length !== 8) {
      mostrarCepFeedback("error", "Digite um CEP válido com 8 números.");
      return;
    }

    try {
      setBuscandoCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        mostrarCepFeedback(
          "error",
          "CEP não encontrado. Confira os números digitados."
        );
        return;
      }

      setForm((prev) => ({
        ...prev,
        cep: formatarCep(cepLimpo),
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));

      mostrarCepFeedback(
        "success",
        "Endereço encontrado. Complete número, complemento e referência se necessário."
      );
    } catch {
      mostrarCepFeedback(
        "error",
        "Não foi possível buscar o CEP agora. Preencha manualmente."
      );
    } finally {
      setBuscandoCep(false);
    }
  }

  function validarFormulario() {
    if (!form.nome.trim()) return "Informe seu nome completo.";
    if (!form.email.trim()) return "Informe seu email.";

    if (!form.senha) return "Crie uma senha.";
    if (form.senha.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }

    if (!form.confirmarSenha) return "Confirme sua senha.";

    if (form.senha !== form.confirmarSenha) {
      return "As senhas não coincidem.";
    }

    if (!limparCep(form.cep)) return "Informe o CEP.";

    if (limparCep(form.cep).length !== 8) {
      return "Informe um CEP válido com 8 números.";
    }

    if (!form.rua.trim()) return "Informe a rua ou avenida.";
    if (!form.bairro.trim()) return "Informe o bairro.";
    if (!form.cidade.trim()) return "Informe a cidade.";
    if (!form.estado.trim()) return "Informe o estado.";
    if (!form.numero.trim()) return "Informe o número da residência.";

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setErro("");
    setSucesso("");

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setLoading(true);

    try {
      const dadosCadastro = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        telefone: form.telefone.trim(),
        cep: form.cep.trim(),
        rua: form.rua.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        pontoReferencia: form.pontoReferencia.trim(),
      };

      const resultado = await register(dadosCadastro);

      if (resultado.emailEnviado === false) {
        setEmailCadastroPendente(dadosCadastro.email);
        setErro(
          `Sua conta foi criada, mas o email de confirmação não pôde ser enviado. ${
            resultado.avisoEmail || "Confira a configuração de email do servidor."
          }`
        );
        return;
      }

      setSucesso(
        "Cadastro realizado com sucesso. Verifique seu email para confirmar a conta."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviarConfirmacao() {
    if (!emailCadastroPendente) return;

    setErro("");
    setSucesso("");
    setReenviandoEmail(true);

    try {
      const resultado = await resendConfirmation(emailCadastroPendente);
      setSucesso(resultado.mensagem || "Email de confirmação reenviado com sucesso.");
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

  const cadastroBloqueado =
    loading ||
    buscandoCep ||
    !form.nome ||
    !form.email ||
    !form.senha ||
    !form.confirmarSenha ||
    !form.cep ||
    !form.rua ||
    !form.bairro ||
    !form.cidade ||
    !form.estado ||
    !form.numero ||
    form.senha !== form.confirmarSenha;

  return (
    <main  className="mx-auto max-w-3xl px-5 py-12 sm:py-20 max-w-4xl">
      <div  className="mx-auto max-w-lg max-w-none">
        <div  className="mb-8 space-y-3">
          <span  className="mb-4 inline-flex border-b-2 border-accent pb-2 font-display text-lg">BC</span>
          <h1  className="font-display text-4xl leading-tight sm:text-5xl">Criar cadastro</h1>
          <p>
            Cadastre-se para acessar reservas, compras e aluguéis. Após o
            cadastro, confirme seu email para liberar o login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div  className="mb-8 grid gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Dados pessoais</h2>

            <div  className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2"><Field label={"Nome completo"}><FadeInput type="text" name="nome" placeholder="Digite seu nome" value={form.nome} onChange={handleChange} required/></Field></div>

              <div className="grid gap-2"><Field label={"Email"}><input type="email" name="email" placeholder="Digite seu email" value={form.email} onChange={handleChange} required/></Field></div>

              <div className="grid gap-2"><Field label={"Telefone"}><input type="text" name="telefone" placeholder="Digite seu telefone" value={form.telefone} onChange={handleChange}/></Field></div>
            </div>
          </div>

          <div  className="mb-8 grid gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Segurança da conta</h2>

            <div  className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2"><Field label={"Senha"} trailing={<Button type="button" onClick={() => setMostrarSenha((prev) => !prev)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} variant="ghost" className="px-2 text-xs">
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </Button>}><input type={mostrarSenha ? "text" : "password"} name="senha" placeholder="Crie uma senha" value={form.senha} onChange={handleChange} required/></Field></div>

              <div className="grid gap-2"><Field label={"Confirmar senha"} trailing={<Button type="button" onClick={() => setMostrarConfirmarSenha((prev) => !prev)} aria-label={
                      mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"
                    } variant="ghost" className="px-2 text-xs">
                    {mostrarConfirmarSenha ? "Ocultar" : "Mostrar"}
                  </Button>}><input type={mostrarConfirmarSenha ? "text" : "password"} name="confirmarSenha" placeholder="Digite a senha novamente" value={form.confirmarSenha} onChange={handleChange} required/></Field>{form.confirmarSenha && form.senha !== form.confirmarSenha && (
                  <small  className="text-sm text-red-700 dark:text-red-300">
                    As senhas ainda não coincidem.
                  </small>
                )}</div>
            </div>
          </div>

          <div  className="mb-8 grid gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Endereço completo</h2>

            <div  className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-2"><Field label={"CEP"}><input type="text" name="cep" placeholder="00000-000" value={form.cep} onChange={handleChange} onBlur={buscarCep} required/></Field></div>

              <Button type="button" onClick={buscarCep} disabled={buscandoCep} variant="secondary">
                {buscandoCep ? "Buscando..." : "Buscar CEP"}
              </Button>
            </div>

            {cepFeedback.text && (
              <StatusMessage type={cepFeedback.type}>
                {cepFeedback.text}
              </StatusMessage>
            )}

            <div  className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2"><Field label={"Rua / Avenida"}><input type="text" name="rua" placeholder="Rua, avenida ou travessa" value={form.rua} onChange={handleChange} required/></Field></div>

              <div className="grid gap-2"><Field label={"Bairro"}><input type="text" name="bairro" placeholder="Bairro" value={form.bairro} onChange={handleChange} required/></Field></div>

              <div className="grid gap-2"><Field label={"Cidade"}><input type="text" name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} required/></Field></div>

              <div className="grid gap-2"><Field label={"Estado"}><input type="text" name="estado" placeholder="UF" value={form.estado} onChange={handleChange} maxLength="2" required/></Field></div>

              <div className="grid gap-2"><Field label={"Número"}><input type="text" name="numero" placeholder="Número da residência" value={form.numero} onChange={handleChange} required/></Field></div>

              <div className="grid gap-2"><Field label={"Complemento"}><input type="text" name="complemento" placeholder="Casa, apartamento, bloco..." value={form.complemento} onChange={handleChange}/></Field></div>
            </div>

            <div className="grid gap-2"><Field label={"Ponto de referência"}><input type="text" name="pontoReferencia" placeholder="Ex: próximo à praça, mercado, escola..." value={form.pontoReferencia} onChange={handleChange}/></Field></div>
          </div>

          {erro && <StatusMessage type={"error"}>{erro}</StatusMessage>}
          {sucesso && <StatusMessage type={"info"}>{sucesso}</StatusMessage>}

          {emailCadastroPendente && (
            <Button type="button" onClick={handleReenviarConfirmacao} disabled={reenviandoEmail} variant="secondary" className="w-full">
              {reenviandoEmail ? "Reenviando..." : "Reenviar email de confirmação"}
            </Button>
          )}

          <Button disabled={cadastroBloqueado} type="submit" variant="primary" className="w-full">
            {loading ? "Cadastrando..." : "Criar conta"}
          </Button>
        </form>
        <GoogleSignIn/>

        <p  className="mt-7 text-sm text-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
