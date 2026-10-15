import {useState} from "react";
import {it,expect} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import PeekRating from "./PeekRating.jsx";
function Rating(){const [value,setValue]=useState(3);return <PeekRating value={value} onChange={setValue} label="Nota"/>;}
it("avaliação permite todas as notas por teclado com seleção nativa acessível",()=>{
  render(<Rating/>);const group=screen.getByRole("radiogroup",{name:"Nota"});expect(group).toBeVisible();const three=screen.getByRole("radio",{name:/3/});three.focus();fireEvent.keyDown(three,{key:"ArrowRight"});expect(screen.getByRole("radio",{name:/4/})).toBeChecked();fireEvent.keyDown(screen.getByRole("radio",{name:/4/}),{key:"Home"});expect(screen.getByRole("radio",{name:/1/})).toBeChecked();fireEvent.keyDown(screen.getByRole("radio",{name:/1/}),{key:"End"});expect(screen.getByRole("radio",{name:/5/})).toBeChecked();
});
