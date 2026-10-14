import { StrictMode } from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookScene from "./BookScene";

describe("BookScene — entrega ao fallback sem exigir WebGL", () => {
  it.each([undefined, { id: 1 }, { id: 1, imagemUrl: "  " }])(
    "notifica uma vez quando não existe capa real: %j",
    (livro) => {
      const onUnavailable = vi.fn();
      const { container } = render(<StrictMode>
        <BookScene livro={livro} active onUnavailable={onUnavailable} />
      </StrictMode>);

      expect(onUnavailable).toHaveBeenCalledTimes(1);
      expect(container.querySelector("canvas")).toBeNull();
      expect(container.querySelector("img")).toBeNull();
    },
  );

  it("resolve a capa do backend e mantém decoração fora da navegação", () => {
    const { container } = render(<BookScene
      livro={{ id: 1, imagemUrl: "/uploads/livros/capa.png" }} active
    />);
    const image = container.querySelector("img");
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    expect(image).toHaveAttribute("src", `${apiUrl.replace(/\/$/, "")}/uploads/livros/capa.png`);
    expect(image).toHaveAttribute("crossorigin", "anonymous");
    expect(image.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("mantém a URL externa e entrega erro de imagem ao fallback sem nova tentativa", () => {
    const onUnavailable = vi.fn();
    const { container, rerender } = render(<BookScene
      livro={{ id: 1, imagemUrl: "https://capas.example/livro.jpg" }}
      active onUnavailable={onUnavailable}
    />);
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "https://capas.example/livro.jpg");

    fireEvent.error(image);
    rerender(<BookScene livro={{ id: 1, imagemUrl: "https://capas.example/livro.jpg" }}
      active={false} onUnavailable={onUnavailable} />);

    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("permite uma nova capa real depois da falha de outra", () => {
    const onUnavailable = vi.fn();
    const { container, rerender } = render(<BookScene
      livro={{ id: 1, imagemUrl: "/uploads/erro.jpg" }} onUnavailable={onUnavailable}
    />);
    fireEvent.error(container.querySelector("img"));

    rerender(<BookScene livro={{ id: 2, imagemUrl: "/uploads/outra.jpg" }}
      onUnavailable={onUnavailable} />);
    expect(container.querySelector("img").getAttribute("src")).toMatch(/\/uploads\/outra\.jpg$/);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });
});
