import {screen} from "@testing-library/react";
import {it,expect,vi} from "vitest";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
import GoogleSignIn from "./GoogleSignIn.jsx";
import api from "../../api/api.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn(),post:vi.fn()}}));
it("Google não configurado permanece desabilitado e não abre autenticação simulada",async()=>{
  api.get.mockResolvedValue({data:{googleEnabled:false,googleClientId:null}});
  renderWithRouter(<GoogleSignIn/>);
  expect(await screen.findByText(/Login Google será liberado/)).toBeVisible();
  expect(screen.getByRole("button",{name:"Continuar com Google"})).toBeDisabled();expect(api.post).not.toHaveBeenCalled();
});
