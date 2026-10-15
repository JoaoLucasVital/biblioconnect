import {fireEvent,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,expect,it,vi} from "vitest";
import Register from "../../pages/Register.jsx";
import {AuthContext} from "../../context/auth.js";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
vi.mock("./AuthShell.jsx",()=>({default:({children})=><main>{children}</main>}));
vi.mock("./GoogleSignIn.jsx",()=>({default:()=>null}));
const register=vi.fn(),resendConfirmation=vi.fn();
beforeEach(()=>vi.clearAllMocks());
function renderRegistration(){
  renderWithRouter(<AuthContext.Provider value={{register,resendConfirmation}}><Register/></AuthContext.Provider>);
  for(const [label,value] of Object.entries({"Nome completo":"Leitor","Email":"reader@example.test","Senha":"Password123!","Confirmar senha":"Password123!","CEP":"57075000","Rua / Avenida":"Avenida de teste","Bairro":"Centro","Cidade":"Maceió","Estado":"AL","Número":"10"})){
    fireEvent.change(screen.getByLabelText(label,{exact:true}),{target:{value}});
  }
}
it("não expõe diagnóstico do servidor nem permite repetir um cadastro já criado",async()=>{
  register.mockResolvedValueOnce({emailEnviado:false,avisoEmail:"EMAIL_USER ou EMAIL_PASS não configurados no .env"});
  renderRegistration();await userEvent.click(screen.getByRole("button",{name:"Criar conta",exact:true}));
  const alert=await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Sua conta foi criada");
  expect(alert).not.toHaveTextContent(/EMAIL_USER|EMAIL_PASS|\.env/);
  const created=screen.getByRole("button",{name:"Conta criada",exact:true});
  expect(created).toBeDisabled();expect(screen.getByLabelText("Email",{exact:true})).toBeDisabled();
  fireEvent.submit(created.closest("form"));expect(register).toHaveBeenCalledOnce();
  expect(screen.getByRole("button",{name:"Reenviar email de confirmação"})).toBeEnabled();
});
it("reenviar confirmação não mostra detalhes internos do provedor",async()=>{
  register.mockResolvedValueOnce({emailEnviado:false});
  resendConfirmation.mockRejectedValueOnce({response:{data:{erro:"Não foi possível reenviar o email agora. Tente novamente.",detalhe:"EMAIL_PASS: segredo interno"}}});
  renderRegistration();await userEvent.click(screen.getByRole("button",{name:"Criar conta",exact:true}));
  await userEvent.click(await screen.findByRole("button",{name:"Reenviar email de confirmação"}));
  await waitFor(()=>expect(resendConfirmation).toHaveBeenCalledWith("reader@example.test"));
  const alert=await screen.findByRole("alert");
  expect(alert).not.toHaveTextContent(/EMAIL_PASS|segredo interno/);
  expect(alert).toHaveTextContent("Não foi possível reenviar");
});
