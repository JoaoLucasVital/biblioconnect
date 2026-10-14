import usePageVisible from "../usePageVisible.js";
import "./book-loader.css";

/** Nawsome's page-turning book, with a smaller responsive footprint. */
export default function BookLoader({label="Carregando acervo…"}) {
  const visible=usePageVisible();
  return <div role="status" className="bc-book-loading" data-paused={!visible || undefined}>
    <div className="bc-loading-book" aria-hidden="true"><div><ul>{[0,1,2,3,4,5].map(i=><li key={i}>
      <svg fill="currentColor" viewBox="0 0 90 120"><path fillRule="evenodd" d="M90 0v120H11A11 11 0 010 109V11A11 11 0 0111 0H90ZM19 33a2.5 2.5 0 000 5h52a2.5 2.5 0 000-5H19Zm0 24a2.5 2.5 0 000 5h52a2.5 2.5 0 000-5H19Zm0 24a2.5 2.5 0 000 5h52a2.5 2.5 0 000-5H19Z"/></svg>
    </li>)}</ul></div></div>
    <p className="text-sm">{label}</p>
  </div>;
}
