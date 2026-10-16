# Anexo B | Mapa de rotas

Inventário estático do código, edição 15/10/2026. 74 declarações HTTP encontradas.

Na produção, prefixar os endpoints abaixo com `/api`. Os caminhos React da segunda parte não recebem esse prefixo. A classificação de acesso é um resumo: não substitui o middleware/handler. Este inventário não é um contrato OpenAPI de payloads e respostas.

## Endpoints HTTP

| Método | Caminho no backend | Acesso resumido | Origem |
| --- | --- | --- | --- |
| GET | `/` | Público; limites/regras no handler | server.js:503 |
| GET | `/admin/atrasos` | ADMIN / regras do handler | server.js:967 |
| GET | `/admin/avaliacoes` | ADMIN / regras do handler | server.js:2432 |
| DELETE | `/admin/avaliacoes/:id` | ADMIN / regras do handler | server.js:2465 |
| PATCH | `/admin/avaliacoes/:id/status` | ADMIN / regras do handler | server.js:2449 |
| GET | `/admin/chat/conversas` | ADMIN / regras do handler | server.js:2538 |
| GET | `/admin/chat/conversas/:id` | ADMIN / regras do handler | server.js:2554 |
| POST | `/admin/chat/conversas/:id/mensagens` | ADMIN / regras do handler | server.js:2577 |
| PATCH | `/admin/chat/conversas/:id/status` | ADMIN / regras do handler | server.js:2601 |
| GET | `/admin/dashboard` | ADMIN / regras do handler | server.js:1813 |
| GET | `/admin/email/status` | ADMIN / regras do handler | server.js:512 |
| POST | `/admin/email/teste` | ADMIN / regras do handler | server.js:522 |
| GET | `/admin/entregas/terceirizadas` | ADMIN / regras do handler | server.js:2309 |
| GET | `/admin/financeiro` | ADMIN / regras do handler | server.js:1984 |
| GET | `/admin/pedidos` | ADMIN / regras do handler | server.js:1697 |
| PATCH | `/admin/pedidos/:id/entrega` | ADMIN / regras do handler | server.js:2313 |
| PATCH | `/admin/pedidos/:id/pagamento` | ADMIN / regras do handler | server.js:2135 |
| PATCH | `/admin/pedidos/:id/status` | ADMIN / regras do handler | server.js:1741 |
| POST | `/admin/resetar-sistema` | ADMIN / regras do handler | server.js:2828 |
| GET | `/admin/usuarios` | ADMIN / regras do handler | server.js:766 |
| DELETE | `/admin/usuarios/:id` | ADMIN / regras do handler | server.js:909 |
| PATCH | `/admin/usuarios/:id/bloqueio` | ADMIN / regras do handler | server.js:848 |
| POST | `/alugar` | Autenticado; dono/ADMIN conforme handler | server.js:1540 |
| GET | `/auth/config` | Público; limites/regras no handler | src/routes/googleAuthRoutes.js:10 |
| POST | `/auth/google` | Público; limites/regras no handler | src/routes/googleAuthRoutes.js:40 |
| POST | `/auth/google/challenge` | Público; limites/regras no handler | src/routes/googleAuthRoutes.js:12 |
| POST | `/auth/google/link` | Sessão / regras do handler | src/routes/googleAuthRoutes.js:41 |
| POST | `/auth/logout` | Sessão / regras do handler | server.js:99 |
| GET | `/auth/session` | Sessão / regras do handler | server.js:98 |
| GET | `/chat` | Autenticado; dono/ADMIN conforme handler | server.js:2488 |
| POST | `/chat/mensagens` | Autenticado; dono/ADMIN conforme handler | server.js:2512 |
| POST | `/comprar` | Autenticado; dono/ADMIN conforme handler | server.js:1465 |
| GET | `/confirmar-email/:token` | Público; limites/regras no handler | server.js:693 |
| POST | `/entrega/cotacao` | Autenticado; dono/ADMIN conforme handler | server.js:2298 |
| POST | `/esqueci-senha` | Público; limites/regras no handler | server.js:702 |
| GET | `/integracoes/status` | Autenticado; dono/ADMIN conforme handler | server.js:2273 |
| GET | `/internal/cron` | Segredo do cron | src/routes/cronRoutes.js:5 |
| GET | `/isbn/:isbn` | ADMIN / regras do handler | server.js:2285 |
| GET | `/livros` | Público ou sessão opcional | server.js:1134 |
| POST | `/livros` | ADMIN | server.js:1048 |
| DELETE | `/livros/:id` | ADMIN | server.js:1343 |
| GET | `/livros/:id` | Público ou sessão opcional | server.js:1156 |
| PUT | `/livros/:id` | ADMIN | server.js:1184 |
| GET | `/livros/:id/avaliacoes` | Público ou sessão opcional | server.js:2371 |
| POST | `/livros/:id/avaliacoes` | Autenticado | server.js:2387 |
| PATCH | `/livros/:id/destaque` | ADMIN | server.js:1310 |
| PATCH | `/livros/:id/disponibilidade` | ADMIN | server.js:1277 |
| PUT | `/livros/:id/salvo` | Autenticado | src/routes/favoritesRoutes.js:11 |
| GET | `/livros/salvos/eventos` | Público ou sessão opcional | src/routes/favoritesRoutes.js:26 |
| GET | `/livros/salvos/resumo` | Público ou sessão opcional | src/routes/favoritesRoutes.js:15 |
| POST | `/login` | Público; limites/regras no handler | server.js:744 |
| GET | `/me` | Autenticado; dono/ADMIN conforme handler | src/routes/profileRoutes.js:10 |
| PATCH | `/me` | Autenticado; dono/ADMIN conforme handler | src/routes/profileRoutes.js:11 |
| DELETE | `/me/foto` | Autenticado; dono/ADMIN conforme handler | src/routes/profileRoutes.js:31 |
| GET | `/me/foto` | Autenticado; dono/ADMIN conforme handler | src/routes/profileRoutes.js:12 |
| POST | `/me/foto` | Autenticado; dono/ADMIN conforme handler | src/routes/profileRoutes.js:19 |
| GET | `/me/pedidos` | Autenticado; dono/ADMIN conforme handler | server.js:1614 |
| PATCH | `/me/pedidos/:id/cancelar` | Autenticado; dono/ADMIN conforme handler | server.js:1642 |
| POST | `/me/pedidos/:id/estender-aluguel` | Autenticado; dono/ADMIN conforme handler | server.js:2728 |
| GET | `/me/salvos` | Autenticado; dono/ADMIN conforme handler | src/routes/favoritesRoutes.js:19 |
| POST | `/me/welcome/claim` | Autenticado; dono/ADMIN conforme handler | src/routes/profileRoutes.js:9 |
| POST | `/media/book-upload-finalize` | ADMIN / regras do handler | src/routes/mediaRoutes.js:21 |
| POST | `/media/book-upload-ticket` | ADMIN / regras do handler | src/routes/mediaRoutes.js:8 |
| POST | `/media/book-upload-token` | ADMIN / regras do handler | src/routes/mediaRoutes.js:11 |
| GET | `/pedidos/:id` | Autenticado; dono/ADMIN conforme handler | server.js:1932 |
| POST | `/pedidos/:id/pagamento` | Autenticado; dono/ADMIN conforme handler | server.js:2620 |
| GET | `/pedidos/:id/pagamentos` | Autenticado; dono/ADMIN conforme handler | server.js:2686 |
| PATCH | `/pedidos/:id/simular-pagamento` | Autenticado; dono/ADMIN conforme handler | server.js:2195 |
| GET | `/public/home-insights` | Público; limites/regras no handler | server.js:245 |
| PATCH | `/redefinir-senha/:token` | Público; limites/regras no handler | server.js:713 |
| POST | `/reenviar-confirmacao` | Público; limites/regras no handler | server.js:729 |
| POST | `/reservar` | Autenticado; dono/ADMIN conforme handler | server.js:1383 |
| POST | `/usuarios` | Público; limites/regras no handler | server.js:557 |
| POST | `/webhooks/mercadopago` | Validação do provedor | server.js:2705 |

## Observações operacionais

- Endpoints internos, upload por ticket e webhooks têm validações específicas. Um endereço público não significa operação sem autorização.
- /admin/resetar-sistema é destrutivo; não utilizar em deploy nem em testes de produção.
- /pedidos/:id/simular-pagamento é bloqueado em produção.
- O pagamento executável é Mercado Pago; não há endpoints Stripe neste inventário.
- Eventos de favoritos usam text/event-stream; uploads usam formato próprio do handler.

## Rotas da interface

| Grupo | Caminho React |
| --- | --- |
| Público | `/` |
| Público | `/livros` |
| Público | `/login` |
| Público | `/cadastro` |
| Público | `/esqueci-senha` |
| Público | `/redefinir-senha/:token` |
| Público | `/livros/:id/avaliacoes` |
| Autenticado | `/perfil` |
| Autenticado | `/chat` |
| Autenticado | `/meus-pedidos` |
| Autenticado | `/checkout/:livroId` |
| Autenticado | `/pedido-confirmado/:id` |
| Autenticado | `/comprovante/:id` |
| ADMIN | `/admin` |
| ADMIN | `/admin/livros` |
| ADMIN | `/admin/pedidos` |
| ADMIN | `/admin/financeiro` |
| ADMIN | `/admin/usuarios` |
| ADMIN | `/admin/atrasos` |
| ADMIN | `/admin/avaliacoes` |
| ADMIN | `/admin/chat` |
| ADMIN | `/admin/entregas` |
| ADMIN | `/adicionar-livro` |
| ADMIN | `/editar-livro/:id` |

Guarda de navegação não substitui autorização na API. Rotas não encontradas exibem a página 404 da SPA.
