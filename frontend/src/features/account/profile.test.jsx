import {screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {it,expect,vi,beforeEach} from "vitest";
import Profile from "../../pages/Profile.jsx";
import {AuthContext} from "../../context/auth.js";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
import api from "../../api/api.js";
import {processPortrait} from "./portrait-processing.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn(),patch:vi.fn(),post:vi.fn(),delete:vi.fn()}}));
vi.mock("./portrait-processing.js",()=>({processPortrait:vi.fn(),cropPortrait:vi.fn()}));
vi.mock("./vendor/ProfileCard.jsx",()=>({default:({name})=><p>{name}</p>}));
const user={id:7,nome:"Leitor original",email:"reader@example.test",telefone:"",role:"CLIENTE",avatarUrl:null};
beforeEach(()=>{vi.clearAllMocks();api.get.mockImplementation(path=>Promise.resolve({data:path==="/auth/config"?{googleEnabled:false}:user}));});
function renderProfile(){return renderWithRouter(<AuthContext.Provider value={{usuario:user,updateUser:vi.fn()}}><Profile/></AuthContext.Provider>);}
it("edita dados próprios e falha mantém rascunho sem alterar cartão",async()=>{
  renderProfile();const input=await screen.findByLabelText("Nome completo");await userEvent.clear(input);await userEvent.type(input,"Nome novo");
  api.patch.mockRejectedValueOnce({response:{data:{erro:"Não foi possível salvar"}}});await userEvent.click(screen.getByRole("button",{name:"Salvar alterações"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar");expect(input).toHaveValue("Nome novo");expect(screen.getByText("Leitor original")).toBeVisible();
  expect(api.patch.mock.calls[0][1]).not.toHaveProperty("role");expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");expect(screen.getByRole("button",{name:"Importar foto"})).toBeVisible();
});
it("cancelar processamento não envia foto nem troca o retrato salvo",async()=>{
  let finish;processPortrait.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));renderProfile();await screen.findByLabelText("Nome completo");
  await userEvent.click(screen.getByRole("button",{name:"Importar foto"}));
  await userEvent.upload(await screen.findByLabelText("Escolher foto"),new File(["image"],"photo.png",{type:"image/png"}));await waitFor(()=>expect(processPortrait).toHaveBeenCalled());
  await userEvent.click(screen.getByRole("button",{name:"Cancelar"}));finish({blob:new Blob(["result"],{type:"image/webp"})});
  await waitFor(()=>expect(screen.queryByRole("dialog")).not.toBeInTheDocument());expect(api.post).not.toHaveBeenCalled();expect(screen.getByText("Leitor original")).toBeVisible();
});
it("importação mantém foto inteira com fundo original",async()=>{
  renderProfile();await screen.findByLabelText("Nome completo");await userEvent.click(screen.getByRole("button",{name:"Importar foto"}));
  expect(screen.getByRole("dialog")).toHaveTextContent("O fundo original e a foto inteira serão mantidos");
  expect(screen.queryByText(/fundo é removido/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Zoom",{exact:true})).not.toBeInTheDocument();
});
it("envia o PNG produzido pelo navegador com o nome e MIME corretos",async()=>{
  const create=vi.spyOn(URL,"createObjectURL").mockReturnValue("blob:portrait-preview");
  const revoke=vi.spyOn(URL,"revokeObjectURL").mockImplementation(()=>{});
  try{
    processPortrait.mockResolvedValueOnce({blob:new Blob(["png"],{type:"image/png"}),width:640,height:480});
    api.post.mockResolvedValueOnce({data:{...user,avatarUrl:"/me/foto?v=updated"}});
    renderProfile();await screen.findByLabelText("Nome completo");
    await userEvent.click(screen.getByRole("button",{name:"Importar foto"}));
    await userEvent.upload(await screen.findByLabelText("Escolher foto"),new File(["jpeg"],"photo.jpeg",{type:"image/jpeg"}));
    await screen.findByAltText("Prévia da foto completa com fundo original");
    await userEvent.click(screen.getByRole("button",{name:"Salvar foto"}));
    await waitFor(()=>expect(api.post).toHaveBeenCalled());
    const uploaded=api.post.mock.calls[0][1].get("foto");
    expect(uploaded.type).toBe("image/png");expect(uploaded.name).toBe("portrait.png");
  }finally{create.mockRestore();revoke.mockRestore();}
});
it("resposta lenta do perfil não sobrescreve um rascunho já editado",async()=>{
  let finish;api.get.mockImplementation(path=>path==="/me"?new Promise(resolve=>{finish=resolve;}):Promise.resolve({data:{googleEnabled:false}}));
  renderProfile();const input=screen.getByLabelText("Nome completo");await userEvent.clear(input);await userEvent.type(input,"Meu rascunho");
  finish({data:{...user,nome:"Nome retornado pelo servidor"}});await screen.findByText("Nome retornado pelo servidor");expect(input).toHaveValue("Meu rascunho");
});
