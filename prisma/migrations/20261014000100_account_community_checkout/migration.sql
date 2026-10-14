-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "tokenConfirmacaoHash" TEXT,
ADD COLUMN     "tokenResetSenhaHash" TEXT,
ALTER COLUMN "senha" DROP NOT NULL;

-- CreateTable
CREATE TABLE "IdentidadeExterna" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentidadeExterna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "previousTokenHash" TEXT,
    "previousTokenValidUntil" TIMESTAMP(3),
    "usuarioId" INTEGER NOT NULL,
    "lembrar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idleExpiresAt" TIMESTAMP(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesafioGoogle" (
    "id" TEXT NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "cookieHash" TEXT NOT NULL,
    "lembrar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "DesafioGoogle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "livroId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoFavorito" (
    "id" BIGSERIAL NOT NULL,
    "livroId" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoFavorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoGateway" (
    "id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "pagamentoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperacaoIdempotente" (
    "id" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "resultadoId" INTEGER,
    "state" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperacaoIdempotente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimiteOperacao" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimiteOperacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdentidadeExterna_usuarioId_idx" ON "IdentidadeExterna"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentidadeExterna_provider_subject_key" ON "IdentidadeExterna"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_tokenHash_key" ON "Sessao"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_previousTokenHash_key" ON "Sessao"("previousTokenHash");

-- CreateIndex
CREATE INDEX "Sessao_usuarioId_revokedAt_idx" ON "Sessao"("usuarioId", "revokedAt");

-- CreateIndex
CREATE INDEX "Sessao_idleExpiresAt_idx" ON "Sessao"("idleExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DesafioGoogle_nonceHash_key" ON "DesafioGoogle"("nonceHash");

-- CreateIndex
CREATE INDEX "DesafioGoogle_expiresAt_idx" ON "DesafioGoogle"("expiresAt");

-- CreateIndex
CREATE INDEX "Favorito_livroId_idx" ON "Favorito"("livroId");

-- CreateIndex
CREATE INDEX "Favorito_usuarioId_createdAt_idx" ON "Favorito"("usuarioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuarioId_livroId_key" ON "Favorito"("usuarioId", "livroId");

-- CreateIndex
CREATE INDEX "EventoFavorito_createdAt_idx" ON "EventoFavorito"("createdAt");

-- CreateIndex
CREATE INDEX "EventoFavorito_livroId_id_idx" ON "EventoFavorito"("livroId", "id");

-- CreateIndex
CREATE INDEX "EventoGateway_pagamentoId_idx" ON "EventoGateway"("pagamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "EventoGateway_gateway_eventId_key" ON "EventoGateway"("gateway", "eventId");

-- CreateIndex
CREATE INDEX "OperacaoIdempotente_expiresAt_idx" ON "OperacaoIdempotente"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OperacaoIdempotente_usuarioId_scope_keyHash_key" ON "OperacaoIdempotente"("usuarioId", "scope", "keyHash");

-- CreateIndex
CREATE INDEX "LimiteOperacao_expiresAt_idx" ON "LimiteOperacao"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LimiteOperacao_scope_keyHash_windowStart_key" ON "LimiteOperacao"("scope", "keyHash", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_stripeCustomerId_key" ON "Usuario"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tokenConfirmacaoHash_key" ON "Usuario"("tokenConfirmacaoHash");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tokenResetSenhaHash_key" ON "Usuario"("tokenResetSenhaHash");

-- AddForeignKey
ALTER TABLE "IdentidadeExterna" ADD CONSTRAINT "IdentidadeExterna_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoFavorito" ADD CONSTRAINT "EventoFavorito_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoGateway" ADD CONSTRAINT "EventoGateway_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperacaoIdempotente" ADD CONSTRAINT "OperacaoIdempotente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
