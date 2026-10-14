import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import ThemeToggle from "../ThemeToggle.jsx";

afterEach(()=>document.body.classList.remove("dark"));

it("alternar tema por teclado persiste a preferência e atualiza a página",async()=>{
  const user=userEvent.setup();
  render(<ThemeToggle/>);
  const toggle=screen.getByRole("switch",{name:"Tema escuro"});
  expect(toggle).not.toBeChecked();
  await user.tab(); await user.keyboard(" ");
  expect(toggle).toBeChecked();
  expect(document.body).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
  await user.click(toggle);
  expect(document.body).not.toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("light");
});

it("reabre com tema salvo e sincroniza outra aba sem deixar estado divergente",()=>{
  localStorage.setItem("theme","dark");
  render(<ThemeToggle/>);
  expect(screen.getByRole("switch",{name:"Tema escuro"})).toBeChecked();
  localStorage.setItem("theme","light");
  fireEvent(window,new StorageEvent("storage",{key:"theme",newValue:"light"}));
  expect(screen.getByRole("switch",{name:"Tema escuro"})).not.toBeChecked();
  expect(document.body).not.toHaveClass("dark");
});
