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

Os scripts e relatórios operacionais em `.superpowers` são locais e ignorados pelo Git. Não incluem credenciais externas. Uma futura instalação em outra máquina deve usar o fluxo documentado do projeto e receber configuração própria. A segunda rodada agora inclui o Atlas conectado a esses dados e os componentes escolhidos.

## Ampliação para exercitar relações reais no Atlas

Foram incluídos mais oito títulos autorizados pelo pedido de abastecer o acervo: Quincas Borba (1891), Helena (1876), Iaiá Garcia (1878), Papéis Avulsos (1882), Histórias sem Data (1884), Noite na Taverna (1855), Lira dos Vinte Anos (1853) e Macário (1855), ids 67–74. O conjunto completo passou de quatro para **12 livros**. Metadados/fontes e sinopses próprias em `docs/design-references/2026-10-14/atlas-books.json`.

Referências: [romances no corpus digital da BYU](https://machado.byu.edu/novels/), [Papéis Avulsos no Gutenberg](https://www.gutenberg.org/ebooks/57001), [Histórias sem Data no Gutenberg](https://www.gutenberg.org/ebooks/33056), [Álvares de Azevedo na Biblioteca Municipal de Torres](https://biblioteca.torres.rs.gov.br/autores/azevedo-alvares-de/). As sinopses são breves descrições próprias, não transcrições dos sites.

Cada novo livro tem estoque 4, compra R$20 e aluguel R$5 configurados para apresentação. Ano representa publicação da obra segundo as fontes; `redator` foi identificado explicitamente como referência bibliográfica de apresentação. Não foi atribuída uma editora comercial fictícia. Os oito títulos não possuem imagem de capa cadastrada e usam o fallback tipográfico do aplicativo. As três capas históricas anteriores continuam intactas.

Nova carga autenticada pela API: before=4, after=12. Reexecução: before=12, after=12, created=[]. Comparação profunda dos quatro registros anteriores sem alterações. Nenhum usuário, pedido, pagamento ou indicador de vendas foi fabricado.

## Conexões do serviço local

Foi observada falha P1001 na primeira consulta após períodos sem uso. A biblioteca de socket usada pelo launcher tinha limite padrão de uma conexão. Uma reprodução isolada em banco em memória manteve um socket antigo aberto e tentou uma consulta Prisma pela nova conexão: falhou com limite1 e passou com limite4. O launcher local passou a permitir quatro sockets; a fila interna do PGlite continua serializando consultas. Backend, Prisma/schema e dados não foram alterados para esse ajuste operacional.

Reinício após a correção: backup `before-editorial-2026-10-14T15-59-40.942Z`, 12 livros encontrados. Ambas as cargas foram repetidas depois: before12/after12, nenhum novo cadastro, três capas históricas ainda HTTP200. Uma nova abertura da home após mais de seis minutos sem consulta voltou a mostrar os12 livros na primeira tentativa. Isso verifica o cenário observado; não é uma alegação de teste de disponibilidade contínua nem de ambiente de produção.
