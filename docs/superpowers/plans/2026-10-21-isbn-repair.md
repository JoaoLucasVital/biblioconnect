# Correção do preenchimento por ISBN

Execução aprovada pelo pedido direto do usuário; nesta sessão, preservando React, Express, Prisma e as funções atuais.

**Problema reproduzido:** Google Books responde 429 por quota excedida; serviço atual depende só dele. A Open Library respondeu 200 para a mesma edição, incluindo título, autor, editora, data e capa. A consulta precisa manter ISBN-10/13, informar dados ausentes e persistir a capa em um endereço utilizável pelo catálogo público.

## Implementação

1. `src/services/isbnService.js`: validar checksum e equivalência 10/13; consultar Open Library e Google Books com timeout, cache limitado e identificação do aplicativo; combinar somente a edição correspondente. Buscar sinopse da edição/obra quando necessário. Não fabricar dados ausentes, preço ou estoque. Normalizar categorias usuais para português.
2. Entregar capa por `GET /isbn/:isbn/capa`, pública como as demais capas. Aceitar somente URLs dos provedores conhecidos, verificar cada redirecionamento, limitar tamanho e pixels, converter para WebP e cachear. Nenhuma URL arbitrária fornecida pelo cliente. Lookup administrativo retorna o endereço dessa capa e os campos ausentes. Dados/fontes incompletos têm mensagens claras, sem erros técnicos do provedor.
3. Corrigir consulta no formulário: Enter busca sem enviar cadastro; impedir resultados antigos de sobrescrever ISBN alterado; substituir corretamente a imagem anterior ao aplicar capa nova. Preservar preço, estoque e configurações do administrador.
4. Testes determinísticos dos provedores, validação, falhas, segurança e imagem; testes do formulário; suíte frontend e backend; build. Verificar consulta real, imagem e salvamento com uma cópia local do banco; não criar livros de teste no catálogo online. Publicar e conferir no deploy.

## Limites

Fontes bibliográficas nem sempre possuem todos os dados. Avisar quais campos exigem complemento manual. Sinopses podem estar no idioma da fonte. Armazenamento e autenticação atuais continuam preservados; capa importada fica pública, não fotos de perfil. Cache de metadados limitado a 128 itens, capas a 16 MB; consultas somente sob ação humana.

## Progresso

- [x] Causa reproduzida e fonte alternativa consultada.
- [x] Regressões e implementação; revisão independente e correção dos dois achados.
- [x] Verificação, publicação e demonstração.

Verificação local: frontend 168/168; backend 73 aprovados, um teste integrado preexistente ignorado; build hospedado aprovado. Fluxo real em cópia isolada: consulta 200, capa WebP 200, cadastro 201 e leitura persistida; livro de teste e cópia removidos. Nenhum livro de teste criado online.

Publicado no GitHub e no alias `biblioconnect-olive.vercel.app` (deploy `dpl_D8pNeJbkqHv65fHZNy3vfnDxvG1X`). Consulta autenticada do ISBN 9788532530783: 200, todos os campos bibliográficos previstos presentes, capa pública WebP 348×500 e 33.436 bytes; ISBN inválido: 400. Formulário publicado conferido no navegador com preenchimento e prévia carregada, sem salvar novo livro online. Ambiente local reiniciado com backup e os dados preservados.
