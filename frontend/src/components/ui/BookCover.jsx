import { useState } from "react";
import coverVariants from "./cover-variants.json";
import {resolveBookCoverUrl} from './bookCoverUrl.js';

export default function BookCover({ livro, className = "", sizes = "(min-width: 1280px) 240px, (min-width: 768px) 30vw, 50vw", priority = false }) {
  const [failedImage, setFailedImage] = useState(null);
  const src = resolveBookCoverUrl(livro?.imagemUrl);
  const variants = coverVariants[src.split("/").pop()];
  const directory = src.slice(0, src.lastIndexOf("/") + 1);
  const srcSet = variants?.map(item => `${directory}${item.file} ${item.width}w`).join(", ");
  return <div className={`relative aspect-[2/3] overflow-hidden bg-soft ${className}`}>
    {src && failedImage !== src
      ? <img src={src} srcSet={srcSet} sizes={srcSet ? sizes : undefined} alt={`Capa de ${livro.titulo}`} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async"
        onError={() => setFailedImage(src)} className="h-full w-full object-cover" />
      : <div className="flex h-full flex-col justify-between gap-4 border border-stroke p-[12%] text-ink">
        <span className="text-xs text-muted">{livro?.categoria || "BiblioConnect"}</span>
        <span className="break-words font-display text-[clamp(1rem,2.5vw,1.6rem)] leading-snug">{livro?.titulo || "Capa indisponível"}</span>
        {livro?.autor && <span className="text-sm leading-snug text-muted">{livro.autor}</span>}
      </div>}
  </div>;
}
