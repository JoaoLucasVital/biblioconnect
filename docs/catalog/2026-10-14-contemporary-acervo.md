# Acervo contemporâneo cadastrado em 14/10/2026

Foram cadastrados **10 livros**, ids **100–109**, no banco persistente original `biblioconnect/.local/database`, passando de **12 para 22 registros**. A seleção combina dark romance adulto, romance contemporâneo, fantasia e suspense, com títulos associados à descoberta literária nas redes. Não foi atribuída posição em ranking, volume de vendas, avaliação de leitores ou tendência atual sem evidência.

## Livros e fontes primárias

| ID | Livro | Autor | Categoria | ISBN da edição representada | Ano |
| --- | --- | --- | --- | --- | --- |
| 100 | [Corrupt](https://www.thegiftboxeditora.shop/romance/corrupt) | Penelope Douglas | Dark romance | 9786550480318 | 2024¹ |
| 101 | [Hideaway](https://www.thegiftboxeditora.shop/romance/hideaway) | Penelope Douglas | Dark romance | 9786556360256 | 2024¹ |
| 102 | [A empregada](https://www.editoraarqueiro.com.br/livros/a-empregada/) | Freida McFadden | Suspense | 9786555655063 | 2023 |
| 103 | [A hipótese do amor](https://www.editoraarqueiro.com.br/livros/a-hipotese-do-amor/) | Ali Hazelwood | Romance | 9786555653304 | 2022 |
| 104 | [Verity](https://www.record.com.br/products/verity) | Colleen Hoover | Suspense | 9788501117847 | 2020 |
| 105 | [O príncipe cruel](https://www.record.com.br/products/o-principe-cruel-vol-1-o-povo-do-ar) | Holly Black | Fantasia | 9788501115553 | 2018 |
| 106 | [Corte de espinhos e rosas](https://www.record.com.br/products/corte-de-espinhos-e-rosas-vol-1-edicao-especial) | Sarah J. Maas | Fantasia | 9786559810727 | 2021² |
| 107 | [Os sete maridos de Evelyn Hugo](https://www.companhiadasletras.com.br/9788584391509-os-sete-maridos-de-evelyn-hugo-3202/p) | Taylor Jenkins Reid | Romance | 9788584391509 | 2019 |
| 108 | [Jantar secreto](https://www.companhiadasletras.com.br/9788535928358-jantar-secreto-3194/p) | Raphael Montes | Suspense | 9788535928358 | 2016 |
| 109 | [A Biblioteca da Meia-Noite](https://www.record.com.br/products/a-biblioteca-da-meia-noite) | Matt Haig | Fantasia | 9786558380542 | 2021 |

¹ Data de lançamento/reimpressão de 10/04/2024 exibida na página atual da The Gift Box. Não representa a publicação original da obra nem sua primeira edição brasileira. ² Edição especial de 2021, com capa e ISBN correspondentes.

Corrupt e Hideaway são identificados como dark romance pela própria editora, que informa adequação a maiores de 18 anos. Verity é suspense psicológico e tem classificação 18+ na Record. Essas três informações também aparecem nas sinopses cadastradas. Para os demais títulos, não foi inventada classificação etária: `classificacaoFonte: null` no manifesto significa ausência de classificação confirmada na pesquisa, não indicação livre. A seleção contém obras adultas; o nome operacional `youth` não define elegibilidade para menores.

## Capas, textos e limites de uso

Cada capa foi baixada da editora ou do CDN de sua loja oficial, inspecionada visualmente e enviada pela API original para `uploads/livros`. Os endereços exatos estão em [youth-books.json](../../scripts/catalog/youth-books.json), os hashes SHA-256 em [youth-cover-provenance.json](youth-cover-provenance.json), e os arquivos persistidos constam em [youth-seed-result.json](youth-seed-result.json). Não foram baixados livros, PDFs de texto nem conteúdos integrais. As sinopses são descrições curtas próprias, sem reprodução das sinopses comerciais.

As artes das capas pertencem aos respectivos titulares. As páginas consultadas não forneceram uma licença aberta para redistribuição; o cadastro local de apresentação não transfere direitos nem estabelece autorização geral para publicar ou reutilizar essas artes em materiais publicitários. Não foi alegado domínio público, Creative Commons ou licença MIT para as capas. The Gift Box e Companhia das Letras fornecem imagens quadradas de apresentação com a capa dentro da composição; elas foram preservadas integralmente. As imagens da Record e da Arqueiro têm aproximadamente 200 × 300 pixels, conforme arquivos oficiais disponíveis, e podem perder definição em ampliações.

O manifesto registra título, autor, editora/selo, categoria, ISBN, ano e fonte de cada edição. Os valores de compra (R$30–38), aluguel (R$5–8 por sete dias), dia adicional (R$1) e estoque (4–6) são configurações coerentes para apresentação do aplicativo; não são cotações comerciais nem alegação de inventário real. Todos os novos livros estão disponíveis e em destaque.

## Preservação e verificação executada

- Snapshot lógico completo de todas as tabelas públicas antes da alteração, em transação PostgreSQL `REPEATABLE READ READ ONLY`, por meio do socket do runtime ativo. Local: `biblioconnect/.local/backups/before-youth-2026-10-14T19-37-45.149Z/logical-snapshot.json`. O snapshot contém dados privados locais e não deve ser publicado.
- Cadastro pela API administrativa autenticada; nenhum reset, migração, alteração de schema ou acesso direto ao diretório PGlite aberto.
- Somente os ids 34, 35 e 36 tiveram o campo `destaque` alterado para `false`; o Prisma atualizou automaticamente `updatedAt`. Os demais campos desses livros foram comparados integralmente. Todos os outros livros anteriores foram comparados integralmente, inclusive timestamps.
- Todas as tabelas diferentes de `Livro` permaneceram idênticas ao snapshot: nenhum usuário, pedido, pagamento, reserva ou indicador comercial foi fabricado.
- Dez imagens verificadas por HTTP 200 e `Content-Type: image/*`; exatamente um registro por título/autor normalizados e ISBN correspondente ao manifesto.
- Reexecução: **22 → 22**, `created: []`, 10 títulos ignorados, nenhuma flag alterada. Resultado em [youth-seed-idempotency.json](youth-seed-idempotency.json).

O primeiro ensaio de snapshot usando um segundo Prisma encontrou colisão de prepared statement (`42P05`) antes de qualquer mutação. O leitor [logical-snapshot.mjs](../../scripts/catalog/logical-snapshot.mjs) utiliza o protocolo simple-query, somente para leitura no socket local, sem registrar prepared statements. A carga final e sua reexecução passaram com esse leitor. Nenhum serviço foi reiniciado durante esta operação.

## Repetição da carga

Com o runtime persistente original disponível nas portas 3000/55440, execute a partir da raiz deste worktree:

```powershell
rtk proxy node scripts/catalog/download-youth-covers.mjs
rtk proxy node scripts/catalog/seed-youth.mjs
```

O primeiro comando baixa apenas imagens e grava os hashes SHA-256 em `.local/youth-covers/provenance.json`. O segundo cria um snapshot lógico novo, autentica-se pela API e inclui somente os livros ausentes pela chave título/autor normalizada. Não altera o cadastro de livros já existentes para forçar correspondência. Credenciais e endereços podem ser definidos com `CATALOG_ADMIN_EMAIL`, `CATALOG_ADMIN_PASSWORD`, `CATALOG_API_URL`, `CATALOG_DATABASE_URL`, `BIBLIO_BACKEND_ROOT` e `CATALOG_COVER_DIR`; os padrões correspondem ao ambiente local de demonstração. A operação é separada da inicialização do aplicativo.
