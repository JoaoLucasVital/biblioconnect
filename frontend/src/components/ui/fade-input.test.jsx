import { useState } from "react";
import { fireEvent,render,screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect,it } from "vitest";
import FadeInput from "./FadeInput.jsx";
import Field from "./Field.jsx";

function Form() {
  const [value,setValue]=useState("");
  const [changes,setChanges]=useState(0);
  return <><Field label="Nome"><FadeInput value={value} onChange={e=>{setValue(e.target.value);setChanges(n=>n+1);}}/></Field><output aria-label="Valor recebido">{value}</output><output aria-label="Mudanças">{changes}</output></>;
}

it("digitação entrega cada letra imediatamente e emite apenas uma mudança por entrada",async()=>{
  const user=userEvent.setup(); render(<Form/>);
  await user.type(screen.getByRole("textbox",{name:"Nome"}),"João");
  expect(screen.getByLabelText("Valor recebido")).toHaveTextContent("João");
  expect(screen.getByLabelText("Mudanças")).toHaveTextContent("4");
  expect(screen.getByRole("textbox",{name:"Nome"})).toHaveValue("João");
});

it("seleção, edição no meio, colagem e exclusão mantêm o input nativo",async()=>{
  const user=userEvent.setup(); render(<FadeInput aria-label="Busca" defaultValue="Dom Casmurro"/>);
  const input=screen.getByRole("textbox",{name:"Busca"});
  input.focus(); input.setSelectionRange(0,3);
  await user.paste("Senhor");
  expect(input).toHaveValue("Senhor Casmurro");
  input.setSelectionRange(6,6); await user.keyboard("{Backspace}");
  expect(input).toHaveValue("Senho Casmurro");
});

it("composição de acentos não cria valores intermediários nem perde o caractere",()=>{
  render(<Form/>); const input=screen.getByRole("textbox",{name:"Nome"});
  fireEvent.compositionStart(input);
  fireEvent.change(input,{target:{value:"ã"}});
  fireEvent.compositionEnd(input,{data:"ã"});
  fireEvent.change(input,{target:{value:"ãa"}});
  expect(input).toHaveValue("ãa");
  expect(screen.getByLabelText("Valor recebido")).toHaveTextContent("ãa");
  expect(screen.getByLabelText("Mudanças")).toHaveTextContent("2");
});
