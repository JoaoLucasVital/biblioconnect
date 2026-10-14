import { fireEvent, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { buildAtlas,fitAtlasNodes } from "./atlasModel.js";
import AtlasExplorer from "./AtlasExplorer.jsx";
import { renderWithRouter } from "../../test/renderWithRouter.jsx";
import { livroDisponivel } from "../../test/fixtures.js";

const books=[
  {...livroDisponivel,id:1,titulo:"Dom Casmurro",autor:"Machado de Assis",categoria:"Romance"},
  {...livroDisponivel,id:2,titulo:"Memórias Póstumas de Brás Cubas",autor:"Machado de Assis",categoria:"Realismo"},
  {...livroDisponivel,id:3,titulo:"O Cortiço",autor:"Aluísio Azevedo",categoria:"Romance",estoque:0},
];

it("modelo mantém relação verdadeira e posições estáveis sem alterar os livros",()=>{
  const original=structuredClone(books);
  const result=buildAtlas(books,{});
  expect(result.edges).toEqual(expect.arrayContaining([
    expect.objectContaining({source:1,target:2,reason:"autor"}),
    expect.objectContaining({source:1,target:3,reason:"categoria"}),
  ]));
  expect(result.edges).not.toEqual(expect.arrayContaining([expect.objectContaining({source:2,target:3})]));
  expect(buildAtlas([...books].reverse(),{}).nodes).toEqual(result.nodes);
  expect(books).toEqual(original);
});

it("busca normaliza acentos e preserva categorias reais e livros sem categoria",()=>{
  expect(buildAtlas(books,{query:"MEMORIAS"}).books.map(b=>b.id)).toEqual([2]);
  expect(buildAtlas(books,{query:"machado",category:"Romance"}).books.map(b=>b.id)).toEqual([1]);
  const uncategorized=buildAtlas([{...books[0],categoria:null}],{});
  expect(uncategorized.categories).toEqual([expect.objectContaining({name:"Sem categoria",count:1})]);
  expect(uncategorized.edges).toEqual([]);
  expect(buildAtlas([],{})).toMatchObject({books:[],nodes:[],edges:[],total:0,visibleCount:0});
});

it("centenas de livros têm mapa limitado e lista completa, pontos únicos e grau limitado",()=>{
  const many=Array.from({length:250},(_,i)=>({...books[0],id:i+1,titulo:`Livro ${String(i).padStart(3,"0")}`}));
  const result=buildAtlas(many,{});
  expect(result.books).toHaveLength(250); expect(result.nodes).toHaveLength(48);
  expect(result.total).toBe(250); expect(result.visibleCount).toBe(48);
  const positions=new Set(result.nodes.map(n=>`${n.x},${n.y}`));
  expect(positions.size).toBe(48);
  for(const node of result.nodes){
    expect(node.x).toBeGreaterThan(30); expect(node.x).toBeLessThan(970);
    expect(node.y).toBeGreaterThan(30); expect(node.y).toBeLessThan(530);
    expect(result.edges.filter(e=>e.source===node.id || e.target===node.id).length).toBeLessThanOrEqual(3);
  }
});

it("Atlas permite selecionar um livro real e filtrar sem perder o catálogo",()=>{
  renderWithRouter(<AtlasExplorer livros={books}/>);
  fireEvent.click(screen.getByRole("button",{name:"Ver O Cortiço, de Aluísio Azevedo"}));
  const detail=screen.getByRole("region",{name:"Livro selecionado"});
  expect(within(detail).getByRole("heading",{name:"O Cortiço"})).toBeVisible();
  expect(within(detail).getByText("Sem estoque no momento")).toBeVisible();
  expect(within(detail).getByRole("link",{name:"Consultar no catálogo"})).toHaveAttribute("href","/livros");
  fireEvent.change(screen.getByRole("searchbox",{name:"Buscar no Atlas"}),{target:{value:"zzzz"}});
  expect(screen.getByText("Nenhuma leitura encontrada")).toBeVisible();
  expect(screen.queryByRole("region",{name:"Livro selecionado"})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Limpar busca"}));
  expect(screen.getByRole("button",{name:"Ver Dom Casmurro, de Machado de Assis"})).toBeVisible();
});

it("loading e erro não apresentam contagens como se o acervo já tivesse carregado",()=>{
  const {unmount}=renderWithRouter(<AtlasExplorer livros={[]} loading/>);
  expect(screen.getByRole("status")).toHaveTextContent("Carregando acervo");
  expect(screen.queryByText("0 livros")).not.toBeInTheDocument();
  unmount(); renderWithRouter(<AtlasExplorer livros={[]} error="Falha de conexão" onRetry={()=>{}}/>);
  expect(screen.getByRole("alert")).toHaveTextContent("Falha de conexão");
  expect(screen.getByRole("button",{name:"Tentar novamente"})).toBeVisible();
});

it("alvos de 44px ficam separados no mapa real de tablet",()=>{
  const many=Array.from({length:200},(_,i)=>({...books[0],id:i+1,titulo:`Livro ${i}`}));
  const result=fitAtlasNodes(buildAtlas(many,{}),{width:484,height:500});
  expect(result.nodes).toHaveLength(48);
  for(let i=0;i<result.nodes.length;i++)for(let j=i+1;j<result.nodes.length;j++){
    const a=result.nodes[i],b=result.nodes[j];
    expect(Math.abs(a.x-b.x)*484/1000>=44 || Math.abs(a.y-b.y)*500/560>=44).toBe(true);
  }
});

it("área pequena limita pontos e relações sem perder livros da lista",()=>{
  const many=Array.from({length:200},(_,i)=>({...books[0],id:i+1,titulo:`Livro ${i}`}));
  const model=buildAtlas(many,{}),result=fitAtlasNodes(model,{width:200,height:300});
  expect(result.visibleCount).toBeLessThan(48);
  expect(result.books).toHaveLength(200); expect(result.total).toBe(200);
  const ids=new Set(result.nodes.map(n=>n.id));
  expect(result.edges.every(e=>ids.has(e.source)&&ids.has(e.target))).toBe(true);
  expect(model.nodes).toHaveLength(48);
});
