import {screen} from "@testing-library/react";
import {it,expect,vi} from "vitest";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
import GoogleSignIn from "./GoogleSignIn.jsx";
import api from "../../api/api.js";
import {useLayoutEffect} from "react";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn(),post:vi.fn()}}));
it("Google não configurado permanece desabilitado e não abre autenticação simulada",async()=>{
  api.get.mockResolvedValue({data:{googleEnabled:false,googleClientId:null}});
  renderWithRouter(<GoogleSignIn/>);
  expect(await screen.findByText(/Login Google será liberado/)).toBeVisible();
  expect(screen.getByRole("button",{name:"Continuar com Google"})).toBeDisabled();expect(api.post).not.toHaveBeenCalled();
});
it('tema aplicado durante a montagem do cabeçalho já produz o botão Google escuro',async()=>{
  document.body.classList.remove('dark');
  const renderButton=vi.fn();window.google={accounts:{id:{initialize:vi.fn(),renderButton}}};
  api.get.mockResolvedValue({data:{googleEnabled:true,googleClientId:'public.apps.googleusercontent.com'}});api.post.mockResolvedValue({data:{nonce:'test',challengeId:'test'}});
  function ThemeOnMount(){useLayoutEffect(()=>{document.body.classList.add('dark');},[]);return <GoogleSignIn/>;}
  renderWithRouter(<ThemeOnMount/>);await vi.waitFor(()=>expect(renderButton).toHaveBeenCalled());
  expect(renderButton.mock.calls.at(-1)[1].theme).toBe('filled_black');document.body.classList.remove('dark');delete window.google;
});
it('login Google usa botão oficial arredondado e compatível com tema escuro',async()=>{
  const renderButton=vi.fn();window.google={accounts:{id:{initialize:vi.fn(),renderButton}}};
  document.body.classList.add('dark');
  api.get.mockResolvedValue({data:{googleEnabled:true,googleClientId:'public.apps.googleusercontent.com'}});
  api.post.mockResolvedValue({data:{nonce:'test-nonce',challengeId:'test-challenge'}});
  renderWithRouter(<GoogleSignIn/>);
  await vi.waitFor(()=>expect(renderButton).toHaveBeenCalled());
  expect(renderButton.mock.calls.at(-1)[1]).toMatchObject({shape:'pill',theme:'filled_black',size:'medium',logo_alignment:'left',text:'continue_with'});
  document.body.classList.remove('dark');delete window.google;
});
