import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import BookCover from "./BookCover.jsx";
import variants from "./cover-variants.json";

it("oferece fontes WebP responsivas e respeita o tamanho informado pela hero", () => {
  const file=Object.keys(variants)[0];
  render(<BookCover livro={{titulo:"Livro",imagemUrl:`/uploads/livros/${file}`}} sizes="28vw" priority />);
  const img=screen.getByRole("img",{name:"Capa de Livro"});
  expect(img).toHaveAttribute("sizes","28vw");
  expect(img).toHaveAttribute("loading","eager");
  expect(img.getAttribute("srcset")).toContain("320w");
  expect(img.getAttribute("srcset")).toContain(file);
});

it("mantém imagens de novos cadastros e URLs externas sem variantes inexistentes", () => {
  render(<BookCover livro={{titulo:"Outro",imagemUrl:"https://example.test/nova.jpg"}} />);
  const img=screen.getByRole("img",{name:"Capa de Outro"});
  expect(img).toHaveAttribute("src","https://example.test/nova.jpg");
  expect(img).not.toHaveAttribute("srcset");
  expect(img).toHaveAttribute("loading","lazy");
});
