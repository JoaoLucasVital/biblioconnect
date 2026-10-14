import { useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
function imageUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `${apiUrl.replace(/\/$/, "")}/${value.replace(/^\/+/, "")}`;
}

export default function BookCover({ livro, className = "" }) {
  const [failedImage, setFailedImage] = useState(null);
  const src = imageUrl(livro?.imagemUrl);
  return <div className={`relative aspect-[2/3] overflow-hidden bg-soft ${className}`}>
    {src && failedImage !== src
      ? <img src={src} alt={`Capa de ${livro.titulo}`} loading="lazy" decoding="async"
        onError={() => setFailedImage(src)} className="h-full w-full object-cover" />
      : <div className="flex h-full flex-col justify-between gap-4 border border-stroke p-[12%] text-ink">
        <span className="text-xs text-muted">{livro?.categoria || "BiblioConnect"}</span>
        <span className="break-words font-display text-[clamp(1rem,2.5vw,1.6rem)] leading-snug">{livro?.titulo || "Capa indisponível"}</span>
        {livro?.autor && <span className="text-sm leading-snug text-muted">{livro.autor}</span>}
      </div>}
  </div>;
}
