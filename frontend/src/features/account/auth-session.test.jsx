import {useContext} from "react";
import {screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {it,expect,vi,beforeEach} from "vitest";
import {AuthProvider} from "../../context/AuthContext.jsx";
import {AuthContext} from "../../context/auth.js";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
import api from "../../api/api.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn(),post:vi.fn(),setCsrfToken:vi.fn()}}));
const reader={id:7,nome:"Leitor",role:"CLIENTE",email:"reader@example.test"};
function Controls(){const auth=useContext(AuthContext);return <><p>{auth.loadingAuth?"Carregando":auth.usuario?.nome||"Visitante"}</p><button onClick={()=>auth.login(reader.email,"password",true)}>Login teste</button><button onClick={()=>auth.logout().catch(()=>{})}>Sair teste</button></>;}
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();api.get.mockResolvedValue({data:{usuario:null,csrfToken:null}});});
it("recupera sessão no servidor, remove token legado e mantém CSRF somente em memória",async()=>{
  localStorage.setItem("@biblioconnect:token","old-token");localStorage.setItem("@biblioconnect:usuario","old-profile");
  api.get.mockResolvedValue({data:{usuario:reader,csrfToken:"csrf-session"}});
  renderWithRouter(<AuthProvider><Controls/></AuthProvider>);
  expect(await screen.findByText("Leitor")).toBeVisible();expect(api.get).toHaveBeenCalledWith("/auth/session");
  expect(localStorage.getItem("@biblioconnect:token")).toBeNull();expect(localStorage.getItem("@biblioconnect:usuario")).toBeNull();
  expect(api.setCsrfToken).toHaveBeenCalledWith("csrf-session");
});
it("login usa lembrar e logout aguarda revogação sem perder sessão se a rede falhar",async()=>{
  renderWithRouter(<AuthProvider><Controls/></AuthProvider>);await screen.findByText("Visitante");
  api.post.mockResolvedValueOnce({data:{usuario:reader,csrfToken:"csrf-login"}});
  await userEvent.click(screen.getByRole("button",{name:"Login teste"}));await screen.findByText("Leitor");
  expect(api.post).toHaveBeenCalledWith("/login",{email:reader.email,senha:"password",lembrar:true});expect(localStorage.length).toBe(0);
  api.post.mockRejectedValueOnce(new Error("offline"));await userEvent.click(screen.getByRole("button",{name:"Sair teste"}));
  await waitFor(()=>expect(api.post).toHaveBeenCalledWith("/auth/logout"));expect(screen.getByText("Leitor")).toBeVisible();
  api.post.mockResolvedValueOnce({data:{}});await userEvent.click(screen.getByRole("button",{name:"Sair teste"}));await screen.findByText("Visitante");expect(api.setCsrfToken).toHaveBeenLastCalledWith(null);
});
