export default function AtlasResults({total,visibleCount,isMap=false}) {
  return <div className="atlas-map-footer" role="status"><span>{total} {total===1?"livro encontrado":"livros encontrados"}{isMap && total>visibleCount?` · ${visibleCount} pontos no mapa; todos os resultados na lista`:""}</span><span aria-hidden="true">ESCOLHA UM PONTO. ENCONTRE UMA HISTÓRIA. ↗</span></div>;
}
