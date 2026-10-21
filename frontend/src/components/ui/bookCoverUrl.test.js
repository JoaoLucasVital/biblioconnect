import {describe,it,expect} from 'vitest';
import {resolveBookCoverUrl} from './bookCoverUrl.js';

describe('entrega das capas',()=>{
  it('entrega a capa cadastrada no domínio do site, inclusive no catálogo local',()=>{
    expect(resolveBookCoverUrl('https://oiw2tifie2hrax2f.public.blob.vercel-storage.com/livros/catalogo-2026/ol-12392899.webp','/api')).toBe('/covers/catalogo-2026/ol-12392899.webp');
    expect(resolveBookCoverUrl('/uploads/livros/cover-34-7158055552f0.webp','http://localhost:3000')).toBe('/covers/livros/cover-34-7158055552f0.webp');
  });
  it('preserva novas capas externas e uploads fora do catálogo publicado',()=>{
    expect(resolveBookCoverUrl('https://example.com/nova.webp','/api')).toBe('https://example.com/nova.webp');
    expect(resolveBookCoverUrl('https://example.com/ol-12392899.webp','/api')).toBe('https://example.com/ol-12392899.webp');
    expect(resolveBookCoverUrl('/uploads/livros/nova.webp','/api')).toBe('/api/uploads/livros/nova.webp');
  });
  it('preserva caminhos públicos e trata ausência sem uma URL inválida',()=>{
    expect(resolveBookCoverUrl('/covers/livros/cover-34-7158055552f0.webp','/api')).toBe('/covers/livros/cover-34-7158055552f0.webp');
    expect(resolveBookCoverUrl(null,'/api')).toBe('');
    expect(resolveBookCoverUrl('','/api')).toBe('');
  });
});
