import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {it,expect,vi} from "vitest";
import {Routes,Route} from "react-router-dom";
import Login from "../../pages/Login.jsx";
import Register from "../../pages/Register.jsx";
import ForgotPassword from "../../pages/ForgotPassword.jsx";
import ResetPassword from "../../pages/ResetPassword.jsx";
import {AuthContext} from "../../context/auth.js";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
import api from "../../api/api.js";
vi.mock("../../api/api.js",()=>({default:{post:vi.fn(),patch:vi.fn(),get:vi.fn().mockResolvedValue({data:{googleEnabled:false}})}}));
it("login inválido preserva email e reenvia confirmação pelo contrato atual",async()=>{
  const login=vi.fn().mockRejectedValue({response:{data:{erro:"Confirme seu email",precisaConfirmarEmail:true}}});
  const resendConfirmation=vi.fn().mockResolvedValue({mensagem:"Confirmação reenviada"});
  renderWithRouter(<AuthContext.Provider value={{login,resendConfirmation}}><Login/></AuthContext.Provider>);
  const user=userEvent.setup();
  await user.type(screen.getByLabelText(/^Email$/i),"leitor@example.test");
  await user.type(screen.getByLabelText(/^Senha$/i),"SenhaTeste123!");
  await user.click(screen.getByRole("button",{name:"Entrar",exact:true}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Confirme seu email");
  expect(screen.getByLabelText(/^Email$/i)).toHaveValue("leitor@example.test");
  await user.click(screen.getByRole("button",{name:"Reenviar email de confirmação"}));
  expect(resendConfirmation).toHaveBeenCalledExactlyOnceWith("leitor@example.test");
});
it("recuperação mantém email quando servidor falha",async()=>{
  api.post.mockRejectedValueOnce({response:{data:{erro:"Tente mais tarde"}}});
  renderWithRouter(<ForgotPassword/>);const user=userEvent.setup();
  await user.type(screen.getByLabelText("Email cadastrado"),"leitor@example.test");
  await user.click(screen.getByRole("button",{name:"Enviar link de redefinição"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Tente mais tarde");
  expect(api.post).toHaveBeenCalledWith("/esqueci-senha",{email:"leitor@example.test"});
  expect(screen.getByLabelText("Email cadastrado")).toHaveValue("leitor@example.test");
});
it("lembrar de mim respeita escolha explícita no login",async()=>{
  const login=vi.fn().mockResolvedValue({nome:"Leitor"});
  renderWithRouter(<AuthContext.Provider value={{login}}><Login/></AuthContext.Provider>);
  const user=userEvent.setup();await user.type(screen.getByLabelText(/^Email$/i),"leitor@example.test");await user.type(screen.getByLabelText(/^Senha$/i),"SenhaTeste123!");
  expect(screen.getByRole("checkbox",{name:"Lembrar de mim"})).not.toBeChecked();
  await user.click(screen.getByRole("checkbox",{name:"Lembrar de mim"}));await user.click(screen.getByRole("button",{name:"Entrar",exact:true}));
  expect(login).toHaveBeenCalledWith("leitor@example.test","SenhaTeste123!",true);
});
it("reset usa token da URL e mantém senha no erro",async()=>{
  api.patch.mockRejectedValueOnce({response:{data:{erro:"Token inválido"}}});
  renderWithRouter(<Routes><Route path="/redefinir-senha/:token" element={<ResetPassword/>}/></Routes>,{route:"/redefinir-senha/token-teste"});
  const user=userEvent.setup();
  await user.type(screen.getByLabelText("Nova senha"),"SenhaNova123!");
  await user.type(screen.getByLabelText("Confirmar nova senha"),"SenhaNova123!");
  await user.click(screen.getByRole("button",{name:"Redefinir senha",exact:true}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Token inválido");
  expect(api.patch).toHaveBeenCalledWith("/redefinir-senha/token-teste",{novaSenha:"SenhaNova123!"});
});
it("cadastro mantém todos os campos e não envia sem dados obrigatórios",()=>{
  const register=vi.fn();
  renderWithRouter(<AuthContext.Provider value={{register}}><Register/></AuthContext.Provider>);
  for(const label of ["Nome completo","Email","Telefone","Senha","Confirmar senha","CEP","Rua / Avenida","Bairro","Cidade","Estado","Número","Complemento","Ponto de referência"])expect(screen.getByLabelText(label,{exact:true})).toBeVisible();
  expect(screen.getByRole("button",{name:"Criar conta",exact:true})).toBeDisabled();
  expect(register).not.toHaveBeenCalled();
});
