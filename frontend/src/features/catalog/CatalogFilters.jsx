import { Search } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import Field from "../../components/ui/Field.jsx";
export default function CatalogFilters({busca,categoria,tipoFiltro,categorias,onBusca,onCategoria,onTipo,onClear}) {
  return <section aria-label="Filtros do catálogo" className="mb-8 grid items-end gap-4 border-y border-stroke py-6 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
    <Field label="Buscar no acervo" leading={<Search size={18} aria-hidden="true"/>}><input type="search" value={busca} onChange={event=>onBusca(event.target.value)} placeholder="Título, autor, categoria ou sinopse"/></Field>
    <Field label="Categoria"><select value={categoria} onChange={event=>onCategoria(event.target.value)}>{categorias.map(item=><option key={item} value={item}>{item==="todas"?"Todas as categorias":item}</option>)}</select></Field>
    <Field label="Tipo"><select value={tipoFiltro} onChange={event=>onTipo(event.target.value)}><option value="todos">Todos</option><option value="compra">Compra</option><option value="aluguel">Aluguel</option><option value="destaque">Destaques</option></select></Field>
    <Button variant="ghost" onClick={onClear}>Limpar filtros</Button>
  </section>;
}
