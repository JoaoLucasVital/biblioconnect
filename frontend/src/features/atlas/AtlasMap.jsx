import { useEffect,useId,useMemo,useRef,useState } from "react";
import { fitAtlasNodes } from "./atlasModel.js";
import AtlasResults from "./AtlasResults.jsx";

export default function AtlasMap({model,selectedId,onSelect}) {
  const gridId=useId();
  const chartRef=useRef(null);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{
    const element=chartRef.current;
    if(typeof ResizeObserver==="undefined"){
      const frame=requestAnimationFrame(()=>{const r=element.getBoundingClientRect();setSize({width:r.width,height:r.height});});
      return ()=>cancelAnimationFrame(frame);
    }
    const observer=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;
      setSize(previous=>previous.width===width && previous.height===height?previous:{width,height});
    });
    observer.observe(element);return ()=>observer.disconnect();
  },[]);
  const fitted=useMemo(()=>fitAtlasNodes(model,size),[model,size]);
  const nodes=new Map(fitted.nodes.map(n=>[n.id,n]));
  const groups=[...new Map(fitted.nodes.map(n=>[n.categoryKey,n])).values()];
  return <><div ref={chartRef} className="atlas-chart" role="group" aria-label="Mapa de livros e categorias">
    <svg viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true" className="atlas-lines">
      <defs><pattern id={gridId} width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth=".6"/></pattern></defs>
      <rect width="1000" height="560" fill={`url(#${gridId})`} opacity=".22"/>
      <ellipse cx="500" cy="280" rx="440" ry="235" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="3 9" opacity=".25"/>
      {groups.map(n=><g key={n.categoryKey}>
        <circle cx={n.cx} cy={n.cy} r="48" fill="none" stroke="currentColor" strokeDasharray="2 6" strokeWidth=".7" opacity=".25"/>
        <path d={`M${n.cx-4} ${n.cy}h8M${n.cx} ${n.cy-4}v8`} stroke="#e67e00"/>
      </g>)}
      {fitted.edges.map(edge=>{
        const a=nodes.get(edge.source),b=nodes.get(edge.target);
        const selected=edge.source===selectedId || edge.target===selectedId;
        return <line key={`${edge.source}-${edge.target}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          className={selected?"atlas-edge atlas-edge-selected":"atlas-edge"} strokeDasharray={edge.reason==="autor"?undefined:"4 5"}/>;
      })}
    </svg>
    <span className="atlas-chart-index" aria-hidden="true">BC / CARTOGRAFIA DE LEITURAS</span>
    {groups.slice(0,8).map(n=><span key={n.categoryKey} className="atlas-category-label" title={n.livro.categoria||"Sem categoria"}
      style={{left:`${n.cx/10}%`,top:`${(n.cy-75)/5.6}%`}}>{n.livro.categoria||"Sem categoria"}</span>)}
    {fitted.nodes.map(node=><button key={node.id} type="button" className={`atlas-node ${node.id===selectedId?"is-selected":""}`}
      style={{left:`${node.x/10}%`,top:`${node.y/5.6}%`}} aria-pressed={node.id===selectedId}
      aria-label={`Ver ${node.livro.titulo}, de ${node.livro.autor}`} onFocus={()=>onSelect(node.id)} onClick={()=>onSelect(node.id)}>
      <span className="atlas-node-dot" aria-hidden="true"/>
      <span className="atlas-node-caption" aria-hidden="true">{node.livro.titulo}</span>
    </button>)}
    <div className="atlas-map-legend" aria-hidden="true"><span><i/>Livro</span><span><i/>Selecionado</span><span>— Mesmo autor</span><span>┄ Mesma categoria</span></div>
  </div><AtlasResults total={model.total} visibleCount={fitted.visibleCount} isMap={size.width>0}/></>;
}
