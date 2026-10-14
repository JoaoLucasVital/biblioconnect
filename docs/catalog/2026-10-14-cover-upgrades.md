# Capas WebP — 14/10/2026

O acervo persistente de 22 livros recebeu 21 capas de edições reais e uma composição própria claramente identificada como exemplar de teste para “Livro de integração”. Foram preenchidas as nove imagens ausentes. Capas maiores substituem os thumbnails disponíveis quando possível; frentes de livros substituem mockups quadrados na hero. Algumas fontes continuam limitadas a aproximadamente 287–400 pixels de largura. Não houve ampliação artificial, vetorização ou alteração da arte editorial.

Os 52 arquivos em `assets/book-covers/` incluem 22 imagens principais e 30 variantes. O componente `BookCover` usa `srcset` somente para arquivos conhecidos no manifesto; novos uploads e URLs externas continuam funcionando. A primeira imagem da hero tem prioridade; demais capas mantêm carregamento preguiçoso. Logos e ícones SVG permanecem vetoriais.

`cover-optimization.json` registra fonte, dimensões, tamanho e SHA256. `cover-application.json` registra nomes aplicados aos uploads locais. As fontes de maior resolução selecionadas somavam 18.159.846 bytes; as imagens principais WebP somam 2.024.402 bytes. Isso compara os novos originais às suas conversões, não aos thumbnails antigos de menor qualidade.

## Ferramentas e reprodução

A conversão requer Python/Pillow com WebP e um plano JSON explícito com os arquivos originais disponíveis localmente. Não baixa imagens nem sobrescreve originais:

```powershell
rtk proxy python scripts/catalog/optimize-covers.py plano-local.json assets/book-covers docs/catalog/cover-optimization.json frontend/src/components/ui/cover-variants.json
```

A aplicação requer o banco local existente em `127.0.0.1:55440` e a API na porta 3000. O cliente `pg` é uma ferramenta isolada em pasta ignorada, sem mudar dependências da aplicação:

```powershell
rtk npm install --prefix .local/media-tools --no-save --no-package-lock pg@8
rtk proxy node scripts/catalog/apply-cover-upgrades.mjs
```

O comando acima apenas confere o plano. `--apply` realiza a aplicação explicitamente. O script restringe o destino ao socket local, valida identidade dos livros e checksums, guarda backup, não sobrescreve arquivos divergentes e altera somente `Livro.imagemUrl` em transação. Preços, estoque e demais dados são comparados antes e depois. Todos os arquivos principais e variantes são conferidos por HTTP, MIME e tamanho.

A aplicação desta rodada já ocorreu; não é necessário repeti-la para abrir o sistema. Backup: `.local/backups/before-cover-upgrade-2026-10-14T21-26-17.063Z/books.json`. Os uploads anteriores permanecem presentes. Uma eventual restauração deve conferir identidade e recuperar somente as URLs anteriores, preservando alterações posteriores em outros campos. Para deploy, preservar/publicar os uploads e suas variantes junto às URLs persistidas; somente publicar o frontend não transfere esses arquivos.
