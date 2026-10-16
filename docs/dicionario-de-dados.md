# Anexo A | Dicionário de dados

Gerado do schema Prisma do repositório. Edição documental: 15/10/2026.

Inclui todos os campos escalares e relações dos 15 modelos. `?` significa opcional; `[]`, coleção. `@id` indica chave primária; `@unique`/`@@unique`, unicidade; `@@index`, índice. Campos de relação do Prisma não são colunas duplicadas: a FK é o campo escalar indicado em `fields`.

As declarações abaixo são estrutura de código, não inspeção de drift da produção. Nenhum valor de usuário, senha, hash real ou conexão privada é incluído.

## Usuario

Conta local: dados pessoais, endereço, papel, confirmação, foto e recuperação. Senha opcional permite contas inicialmente Google.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `nome` | String | Não | - |
| `email` | String | Não | @unique |
| `senha` | String? | Sim | - |
| `avatarKey` | String? | Sim | - |
| `welcomeSeenAt` | DateTime? | Sim | - |
| `stripeCustomerId` | String? | Sim | @unique |
| `telefone` | String? | Sim | - |
| `endereco` | String? | Sim | - |
| `cep` | String? | Sim | - |
| `rua` | String? | Sim | - |
| `bairro` | String? | Sim | - |
| `cidade` | String? | Sim | - |
| `estado` | String? | Sim | - |
| `numero` | String? | Sim | - |
| `complemento` | String? | Sim | - |
| `pontoReferencia` | String? | Sim | - |
| `role` | String | Não | @default("CLIENTE") |
| `emailConfirmado` | Boolean | Não | @default(false) |
| `tokenConfirmacaoEmail` | String? | Sim | @unique |
| `tokenConfirmacaoHash` | String? | Sim | @unique |
| `tokenConfirmacaoExpira` | DateTime? | Sim | - |
| `tokenResetSenha` | String? | Sim | @unique |
| `tokenResetSenhaHash` | String? | Sim | @unique |
| `tokenResetSenhaExpira` | DateTime? | Sim | - |
| `bloqueado` | Boolean | Não | @default(false) |
| `createdAt` | DateTime | Não | @default(now()) |

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `pedidos` | Pedido[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `avaliacoes` | Avaliacao[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `conversas` | Conversa[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `mensagensChat` | MensagemChat[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `identidades` | IdentidadeExterna[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `sessoes` | Sessao[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `favoritos` | Favorito[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `operacoes` | OperacaoIdempotente[] | Coleção/relação inversa; FK declarada na entidade dependente. |

## Livro

Título do acervo: bibliografia, capa, preços, regras de aluguel, estoque e exibição.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `isbn` | String? | Sim | @unique |
| `titulo` | String | Não | - |
| `autor` | String | Não | - |
| `redator` | String | Não | - |
| `ano` | Int | Não | - |
| `categoria` | String | Não | - |
| `sinopse` | String | Não | - |
| `precoCompra` | Float | Não | - |
| `precoAluguel` | Float | Não | - |
| `diasInclusos` | Int | Não | - |
| `precoDiaExtra` | Float | Não | - |
| `estoque` | Int | Não | - |
| `isDoado` | Boolean | Não | @default(false) |
| `imagemUrl` | String? | Sim | - |
| `destaque` | Boolean | Não | @default(false) |
| `disponivel` | Boolean | Não | @default(true) |
| `createdAt` | DateTime | Não | @default(now()) |
| `updatedAt` | DateTime | Não | @updatedAt |

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `pedidos` | Pedido[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `avaliacoes` | Avaliacao[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `favoritos` | Favorito[] | Coleção/relação inversa; FK declarada na entidade dependente. |
| `eventosFavorito` | EventoFavorito[] | Coleção/relação inversa; FK declarada na entidade dependente. |

## Pedido

Uma operação de um usuário para um livro. Separa situação do pedido, pagamento, entrega e extensão.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `tipo` | String | Não | - |
| `status` | String | Não | - |
| `statusPagamento` | String | Não | @default("pendente") |
| `valor` | Float | Não | - |
| `diasAluguel` | Int? | Sim | - |
| `retiradaLimite` | DateTime | Não | - |
| `devolucaoPrevista` | DateTime? | Sim | - |
| `modalidadeEntrega` | String | Não | @default("retirada") |
| `enderecoEntrega` | String? | Sim | - |
| `distanciaEntregaKm` | Float? | Sim | - |
| `valorEntrega` | Float | Não | @default(0) |
| `statusEntrega` | String | Não | @default("nao_aplicavel") |
| `transportadoraEntrega` | String? | Sim | - |
| `codigoRastreio` | String? | Sim | - |
| `valorExtensaoPendente` | Float | Não | @default(0) |
| `diasExtensaoPendente` | Int | Não | @default(0) |
| `ultimaNotificacaoAtraso` | DateTime? | Sim | - |
| `preferenciaPagamentoId` | String? | Sim | - |
| `linkPagamento` | String? | Sim | - |
| `createdAt` | DateTime | Não | @default(now()) |
| `updatedAt` | DateTime | Não | @updatedAt |
| `usuarioId` | Int | Não | - |
| `livroId` | Int | Não | - |

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `usuario` | Usuario | @relation(fields: [usuarioId], references: [id]) |
| `livro` | Livro | @relation(fields: [livroId], references: [id]) |
| `pagamentos` | Pagamento[] | Coleção/relação inversa; FK declarada na entidade dependente. |

## Pagamento

Registro financeiro/tentativa vinculado ao pedido, inclusive extensão. Não contém cartão ou CVV.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `gateway` | String | Não | @default("mercadopago") |
| `gatewayPaymentId` | String? | Sim | - |
| `gatewayPreferenceId` | String? | Sim | - |
| `metodo` | String? | Sim | - |
| `status` | String | Não | @default("pendente") |
| `tipo` | String | Não | @default("pedido") |
| `valor` | Float | Não | - |
| `createdAt` | DateTime | Não | @default(now()) |
| `updatedAt` | DateTime | Não | @updatedAt |
| `pedidoId` | Int | Não | - |

Índices e unicidade composta:

- `@@index([gatewayPaymentId])`
- `@@index([gatewayPreferenceId])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `pedido` | Pedido | @relation(fields: [pedidoId], references: [id], onDelete: Cascade) |
| `eventosGateway` | EventoGateway[] | Coleção/relação inversa; FK declarada na entidade dependente. |

## IdentidadeExterna

Vínculo do identificador do provedor com a conta local.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | String | Não | @id @default(cuid()) |
| `provider` | String | Não | - |
| `subject` | String | Não | - |
| `usuarioId` | Int | Não | - |
| `createdAt` | DateTime | Não | @default(now()) |

Índices e unicidade composta:

- `@@unique([provider, subject])`
- `@@index([usuarioId])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `usuario` | Usuario | @relation(fields: [usuarioId], references: [id], onDelete: Cascade) |

## Sessao

Sessão autenticada com hashes de tokens, rotação, expiração e revogação.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | String | Não | @id @default(cuid()) |
| `tokenHash` | String | Não | @unique |
| `previousTokenHash` | String? | Sim | @unique |
| `previousTokenValidUntil` | DateTime? | Sim | - |
| `usuarioId` | Int | Não | - |
| `lembrar` | Boolean | Não | @default(false) |
| `createdAt` | DateTime | Não | @default(now()) |
| `lastSeenAt` | DateTime | Não | @default(now()) |
| `rotatedAt` | DateTime | Não | @default(now()) |
| `idleExpiresAt` | DateTime | Não | - |
| `absoluteExpiresAt` | DateTime | Não | - |
| `revokedAt` | DateTime? | Sim | - |

Índices e unicidade composta:

- `@@index([usuarioId, revokedAt])`
- `@@index([idleExpiresAt])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `usuario` | Usuario | @relation(fields: [usuarioId], references: [id], onDelete: Cascade) |

## DesafioGoogle

Desafio temporário e de uso único anterior à conclusão do login Google. Não possui FK para Usuario.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | String | Não | @id @default(cuid()) |
| `nonceHash` | String | Não | @unique |
| `cookieHash` | String | Não | - |
| `lembrar` | Boolean | Não | @default(false) |
| `createdAt` | DateTime | Não | @default(now()) |
| `expiresAt` | DateTime | Não | - |
| `consumedAt` | DateTime? | Sim | - |

Índices e unicidade composta:

- `@@index([expiresAt])`

## Favorito

Relação usuário/livro salvo, com unicidade por par.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `usuarioId` | Int | Não | - |
| `livroId` | Int | Não | - |
| `createdAt` | DateTime | Não | @default(now()) |

Índices e unicidade composta:

- `@@unique([usuarioId, livroId])`
- `@@index([livroId])`
- `@@index([usuarioId, createdAt])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `usuario` | Usuario | @relation(fields: [usuarioId], references: [id], onDelete: Cascade) |
| `livro` | Livro | @relation(fields: [livroId], references: [id], onDelete: Cascade) |

## EventoFavorito

Evento persistido de contagem por livro; serve à sincronização SSE com cursor.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | BigInt | Não | @id @default(autoincrement()) |
| `livroId` | Int | Não | - |
| `total` | Int | Não | - |
| `createdAt` | DateTime | Não | @default(now()) |

Índices e unicidade composta:

- `@@index([createdAt])`
- `@@index([livroId, id])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `livro` | Livro | @relation(fields: [livroId], references: [id], onDelete: Cascade) |

## EventoGateway

Registro de evento do provedor financeiro, deduplicado pelo par gateway/eventId.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | String | Não | @id @default(cuid()) |
| `gateway` | String | Não | - |
| `eventId` | String | Não | - |
| `tipo` | String | Não | - |
| `pagamentoId` | Int? | Sim | - |
| `createdAt` | DateTime | Não | @default(now()) |

Índices e unicidade composta:

- `@@unique([gateway, eventId])`
- `@@index([pagamentoId])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `pagamento` | Pagamento? | @relation(fields: [pagamentoId], references: [id], onDelete: SetNull) |

## OperacaoIdempotente

Proteção de retries por usuário/escopo/chave. resultadoId é referência lógica, não FK.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | String | Não | @id @default(cuid()) |
| `usuarioId` | Int | Não | - |
| `scope` | String | Não | - |
| `keyHash` | String | Não | - |
| `fingerprint` | String | Não | - |
| `resultadoId` | Int? | Sim | - |
| `state` | String | Não | @default("pendente") |
| `createdAt` | DateTime | Não | @default(now()) |
| `updatedAt` | DateTime | Não | @updatedAt |
| `expiresAt` | DateTime | Não | - |

Índices e unicidade composta:

- `@@unique([usuarioId, scope, keyHash])`
- `@@index([expiresAt])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `usuario` | Usuario | @relation(fields: [usuarioId], references: [id], onDelete: Cascade) |

## LimiteOperacao

Contador de janela por escopo/chave derivada. Não possui FK direta para usuário.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | String | Não | @id @default(cuid()) |
| `scope` | String | Não | - |
| `keyHash` | String | Não | - |
| `windowStart` | DateTime | Não | - |
| `count` | Int | Não | @default(0) |
| `expiresAt` | DateTime | Não | - |

Índices e unicidade composta:

- `@@unique([scope, keyHash, windowStart])`
- `@@index([expiresAt])`

## Avaliacao

Nota/comentário de usuário sobre livro, sujeitos à moderação.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `nota` | Int | Não | - |
| `comentario` | String | Não | - |
| `status` | String | Não | @default("pendente") |
| `createdAt` | DateTime | Não | @default(now()) |
| `updatedAt` | DateTime | Não | @updatedAt |
| `usuarioId` | Int | Não | - |
| `livroId` | Int | Não | - |

Índices e unicidade composta:

- `@@unique([usuarioId, livroId])`
- `@@index([livroId, status])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `usuario` | Usuario | @relation(fields: [usuarioId], references: [id], onDelete: Cascade) |
| `livro` | Livro | @relation(fields: [livroId], references: [id], onDelete: Cascade) |

## Conversa

Atendimento iniciado por um usuário, aberto ou encerrado.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `assunto` | String? | Sim | - |
| `status` | String | Não | @default("aberta") |
| `createdAt` | DateTime | Não | @default(now()) |
| `updatedAt` | DateTime | Não | @updatedAt |
| `usuarioId` | Int | Não | - |

Índices e unicidade composta:

- `@@index([usuarioId, status])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `usuario` | Usuario | @relation(fields: [usuarioId], references: [id], onDelete: Cascade) |
| `mensagens` | MensagemChat[] | Coleção/relação inversa; FK declarada na entidade dependente. |

## MensagemChat

Mensagem de uma conversa e seu autor real, com papel e indicação de leitura.

| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |
| --- | --- | --- | --- |
| `id` | Int | Não | @id @default(autoincrement()) |
| `texto` | String | Não | - |
| `remetenteRole` | String | Não | - |
| `lida` | Boolean | Não | @default(false) |
| `createdAt` | DateTime | Não | @default(now()) |
| `conversaId` | Int | Não | - |
| `remetenteId` | Int | Não | - |

Índices e unicidade composta:

- `@@index([conversaId, createdAt])`

Relações declaradas:

| Campo de relação | Destino | Definição |
| --- | --- | --- |
| `conversa` | Conversa | @relation(fields: [conversaId], references: [id], onDelete: Cascade) |
| `remetente` | Usuario | @relation(fields: [remetenteId], references: [id], onDelete: Cascade) |
