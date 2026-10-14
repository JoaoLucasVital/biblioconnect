export const livroDisponivel = {
  id: 7, isbn: null, titulo: "Uma história para descobrir", autor: "Autora de teste",
  redator: "Editora de teste", ano: 2025, categoria: "Romance",
  sinopse: "Uma obra criada exclusivamente para testar os fluxos da biblioteca.",
  precoCompra: 20, precoAluguel: 5, diasInclusos: 7, precoDiaExtra: 2, estoque: 2,
  isDoado: false, imagemUrl: "/uploads/capa-teste.jpg", destaque: true, disponivel: true,
  createdAt: "2026-10-01T12:00:00.000Z", updatedAt: "2026-10-01T12:00:00.000Z",
};
export const livroSemEstoque = { ...livroDisponivel, estoque: 0 };
export const livroDoado = { ...livroDisponivel, isDoado: true };
export const livroTituloLongo = { ...livroDisponivel,
  titulo: "Uma história de encontros, memórias e descobertas que continua muito além das margens de uma página",
  autor: "Uma autora com um nome muito extenso para verificar o comportamento da interface", imagemUrl: null };
