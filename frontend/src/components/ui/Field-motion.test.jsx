import {useState} from "react";
import {it,expect} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import Field from "./Field.jsx";
function Form(){const [value,setValue]=useState("");return <><Field label="Texto"><textarea value={value} onChange={event=>setValue(event.target.value)}/></Field><Field label="Senha"><input type="password" autoComplete="current-password"/></Field></>;}
it("campo usa fade visual, mas paste e IME alteram valor imediatamente sem espelhar senha",()=>{
  render(<Form/>);const input=screen.getByLabelText("Texto");expect(input.closest(".bc-fade-field")).not.toBeNull();fireEvent.change(input,{target:{value:"texto colado"}});expect(input).toHaveValue("texto colado");fireEvent.compositionStart(input);fireEvent.change(input,{target:{value:"日本語"}});fireEvent.compositionEnd(input);expect(input).toHaveValue("日本語");expect(screen.getByLabelText("Senha").closest(".bc-fade-field")).toBeNull();
});
