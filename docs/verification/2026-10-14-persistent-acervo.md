# Acervo persistente integrado — 14/10/2026

O usuário autorizou reutilizar `biblioconnect/.local/database` e cadastrar livros. Esse banco é PGlite, compatível com PostgreSQL e servido por socket para o Prisma/API original. É um ambiente local persistente para apresentação e avaliação; ainda não existe deploy público desta rodada.

## Operação realizada e verificação

- Backup anterior à carga: `.local/backups/before-editorial-2026-10-14T15-09-00.387Z`, no repositório original.
- Um registro já existente, `Livro de integração`, id 1, foi preservado integralmente.
- Três inclusões pela API autenticada original, com uploads no diretório original `uploads/livros`.
- GET das três capas: HTTP 200, Content-Type image/jpeg.
- Encerramento e reinício completos: quatro livros encontrados no mesmo banco.
- Reexecução da carga depois do reinício: before=4, after=4, created=[], três títulos ignorados por já existirem. Comparação profunda dos registros anteriores sem alterações.
- Nenhuma migração, reset, mudança de schema, criação de pedido, pagamento ou usuário para preencher o layout.

| ID | Livro | Autor | Ano da edição cadastrada | Categoria | Compra / aluguel | Estoque |
| --- | --- | --- | --- | --- | --- | --- |
| 34 | Dom Casmurro | Machado de Assis | 1899 | Romance | R$ 24 / R$ 5 | 6 |
| 35 | Memórias Póstumas de Brás Cubas | Machado de Assis | 1881 | Realismo | R$ 22 / R$ 5 | 5 |
| 36 | O Cortiço | Aluísio Azevedo | 1897 | Naturalismo | R$ 20 / R$ 5 | 4 |

Preços e estoques são valores configurados para a apresentação, não alegações de inventário comercial. O ano 1897 de O Cortiço corresponde à edição digitalizada usada na capa; a publicação original é anterior.

## Proveniência das capas e metadados

- Dom Casmurro: [BBM-USP](https://digital.bbm.usp.br/handle/bbm/4828), [Project Gutenberg 55752](https://www.gutenberg.org/ebooks/55752), [capa](https://www.gutenberg.org/cache/epub/55752/images/cover02.jpg).
- Memórias Póstumas: [BBM-USP](https://digital.bbm.usp.br/handle/bbm/4826), [Project Gutenberg 54829](https://www.gutenberg.org/ebooks/54829), [capa](https://www.gutenberg.org/cache/epub/54829/images/cover.jpg).
- O Cortiço: [Project Gutenberg 69187](https://www.gutenberg.org/ebooks/69187), [capa](https://www.gutenberg.org/cache/epub/69187/images/cortico_cover.jpg).

Foram reutilizados os arquivos de capa já presentes no projeto de referência, inspecionados visualmente e conferidos contra as páginas bibliográficas. Nenhum código de produto ou schema daquela versão foi incorporado.

## Prévia em execução

- Frontend do worktree editorial: http://localhost:5173
- Backend original: http://localhost:3000
- Dados, e-mails e uploads persistidos no repositório original.
- Comando local do worktree: `rtk proxy node .superpowers/start-persistent.mjs`.
- A carga é uma operação separada: `.superpowers/seed-existing-acervo.mjs`; inicializar o aplicativo não volta a cadastrar livros.

Os dois scripts e relatórios operacionais em `.superpowers` são locais e ignorados pelo Git. Não incluem credenciais externas. Uma futura instalação em outra máquina deve usar o fluxo documentado do projeto e receber configuração própria. O frontend atual ainda é a primeira rodada editorial; o Atlas e os componentes selecionados aguardam implementação.
