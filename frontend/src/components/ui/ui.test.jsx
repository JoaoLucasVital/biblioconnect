import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button.jsx";
import Field from "./Field.jsx";
import Dialog from "./Dialog.jsx";
import BookCover from "./BookCover.jsx";
import { livroDisponivel } from "../../test/fixtures.js";

it("botão ocupado não confirma novamente", async () => {
  const confirm = vi.fn();
  render(<Button busy onClick={confirm}>Comprar</Button>);
  await userEvent.click(screen.getByRole("button", { name: "Comprar" }));
  expect(confirm).not.toHaveBeenCalled();
  expect(screen.getByRole("button")).toBeDisabled();
});

it("campo associa o rótulo e a explicação do erro ao controle", () => {
  render(<Field id="email" label="E-mail" error="Confira o endereço" hint="Seu e-mail de acesso">
    <input type="email" />
  </Field>);
  const input = screen.getByLabelText("E-mail");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("Seu e-mail de acesso Confira o endereço");
});

it("capa com erro mantém título e autor no fallback", () => {
  render(<BookCover livro={livroDisponivel} />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText(livroDisponivel.titulo)).toBeVisible();
  expect(screen.getByText(livroDisponivel.autor)).toBeVisible();
});

it("trocar o livro depois de erro carrega a nova imagem", () => {
  const { rerender } = render(<BookCover livro={livroDisponivel} />);
  fireEvent.error(screen.getByRole("img"));
  rerender(<BookCover livro={{ ...livroDisponivel, id: 8, titulo: "Outro livro", imagemUrl: "/uploads/nova.jpg" }} />);
  expect(screen.getByRole("img", { name: "Capa de Outro livro" })).toHaveAttribute("src", "http://localhost:3000/uploads/nova.jpg");
});

it("diálogo tem nome acessível e solicita fechar pelo botão", async () => {
  const close = vi.fn();
  render(<Dialog open title="Reservar livro" onClose={close}><p>Escolha a retirada</p></Dialog>);
  expect(screen.getByRole("dialog", { name: "Reservar livro" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Fechar diálogo" }));
  expect(close).toHaveBeenCalledOnce();
});

it("diálogo ocupado bloqueia fechamento por botão e Escape", async () => {
  const close = vi.fn();
  render(<Dialog open busy title="Comprar livro" onClose={close}><p>Confirmando</p></Dialog>);
  await userEvent.click(screen.getByRole("button", { name: "Fechar diálogo" }));
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
  expect(close).not.toHaveBeenCalled();
});
