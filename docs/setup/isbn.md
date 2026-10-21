# Cadastro por ISBN

No cadastro ou edição de livros, informe um ISBN-10 ou ISBN-13 e selecione **Preencher por ISBN** (Enter no campo também consulta). A consulta exige uma sessão administrativa; não cria nem salva um livro automaticamente.

O backend valida o dígito verificador, consulta Open Library e Google Books e combina dados somente da edição correspondente: título, autor, editora, ano, categoria, sinopse e capa. A interface informa os campos ausentes. Preço, estoque e opções comerciais continuam manuais; confira a edição antes de salvar. A sinopse conserva o idioma da fonte.

## Endpoints

- `GET /isbn/:isbn`: autenticação e perfil ADMIN; até 30 consultas por minuto por administrador. Retorna metadados, fontes, campos ausentes e o endereço público da capa.
- `GET /isbn/:isbn/capa`: imagem pública, como as demais capas do catálogo; até 240 requisições por minuto por IP. Verifica formato, tamanho e dimensões, converte para WebP e entrega ETag e cache HTTP. No deploy, os endpoints recebem o prefixo `/api`.

Não é necessário cadastrar uma chave para a Open Library. `GOOGLE_BOOKS_API_KEY` é opcional e permanece somente no servidor. Quota excedida no Google não bloqueia a fonte alternativa. O aplicativo identifica suas consultas à Open Library e exibe atribuição no formulário.

O cache em memória é limitado: metadados por uma hora, no máximo 128 ISBNs; imagens por 24 horas, no máximo 32 capas e 16 MB. Uma imagem já em cache pode ser entregue mesmo se a fonte de metadados cair. Instâncias serverless não compartilham esse cache; após expirar, a capa depende novamente da disponibilidade das fontes. O endereço da capa, salvo no livro, permanece estável.

As imagens só podem vir dos hosts conhecidos dos provedores ou dos caminhos de arquivo de capas usados nos redirecionamentos oficiais da Open Library. URLs arbitrárias, destinos locais, conteúdo incompatível e arquivos acima do limite são rejeitados. Uploads manuais continuam disponíveis: uma consulta sem capa preserva o arquivo escolhido; uma capa importada substitui a seleção anterior.

## Verificação

Testes de serviço cobrem checksum, edição incorreta, quota, campos ausentes, cache, redirecionamentos e conteúdo inválido. Testes de rota verificam autenticação, imagem pública e erros; testes de interface cobrem Enter, consultas desatualizadas, preenchimento, preservação dos valores comerciais e seleção de imagem. O fluxo real de consulta, cadastro e leitura da capa foi verificado em uma cópia isolada do banco local, removendo o livro e a cópia ao terminar. Não se criam livros de teste no catálogo online.

Referências: [Books API](https://openlibrary.org/dev/docs/api/books), [Covers API](https://openlibrary.org/dev/docs/api/covers).
