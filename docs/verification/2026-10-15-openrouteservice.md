# Frete — openrouteservice / HeiGIT

Troca aprovada pelo proprietário em 15/10/2026 após Google Maps exigir pré-pagamento. O login Google permanece. O proprietário criou a conta gratuita Standard e guardou a chave em arquivo privado local; nenhum segredo entra no Git ou no frontend.

## Resultado real

Consulta ao serviço real e à aplicação autenticada em `http://localhost:5173/livros`: origem autorizada Rua José de Alencar, 511, Farol, Maceió; destino público Marco dos Corais, Maceió. Resposta: 7,01 km viários, 661,1 s e R$ 22,52, com tarifa base R$ 5 + R$ 2,50/km. A tarifa é calculada com a distância integral, antes do arredondamento de exibição. Não houve compra, cobrança ou alteração de estoque.

O geocodificador encontrou apenas a rua da origem, sem o número 511. A tela identifica os dois locais e avisa a aproximação. Não foi alegada localização exata da entrada do campus. A configuração poderá receber a localização exata após validação específica; não foram inventadas coordenadas. A duração não inclui trânsito ao vivo.

Uma consulta por “Uninassau” retornou outro estabelecimento com confiança 1. A validação foi endurecida para recusar nome incompatível, além de baixa confiança, país divergente, coordenadas inválidas e resultados somente de cidade/país. Erro do provedor ou limite de cota não produz frete fictício.

## Verificações

- Testes RED→GREEN do provedor e isolamento QA; teste visual RED→GREEN de locais, aproximação e atribuição.
- Backend completo: 59/59 testes e 52 respostas HTTP em banco QA descartável, sem chaves reais herdadas.
- Frontend: catalog-flows 10/10; lint e build aprovados. O build mantém o aviso anterior de chunk 3D acima de 500 kB.
- Os 84 arquivos do build foram conferidos: nenhum contém a chave ORS real.
- Navegador interno: cotação real autenticada exibida no catálogo, sem confirmar compra. Evidência privada `.superpowers/ors-live-quote.jpg`; resultado público de teste `.superpowers/ors-live-quote.json`.
- Runtime reiniciado de forma controlada, com backup fechado e mesmo banco: 22 livros, 5 contas, 5 pedidos.
- Vercel, apenas projeto biblioconnect: `ORS_API_KEY` como Secret em Preview/Production; `STORE_ADDRESS`, `DELIVERY_BASE_FEE` e `DELIVERY_PRICE_PER_KM` como Config. Não houve deploy nesta etapa.

Plano gratuito consultado: 2.000 rotas/dia, 40/min; 3.000 geocodificações/dia, 100/min. Cada prévia e recálculo de compra usa duas geocodificações e uma rota. A cota se esgota antes de 2.000 cotações quando o geocodificador é o limite. Não foi contratado plano pago. A chave Google Maps anterior não é usada pelo sistema.

Referências: [API atual](https://api.heigit.org/), [parâmetros e autenticação](https://openrouteservice.org/dev/), [cotas](https://account.heigit.org/info/plans), [atribuição](https://account.heigit.org/info/tos#attribution), [endereço oficial do campus](https://clinicaescola.uninassau.edu.br/campus/maceio/).
