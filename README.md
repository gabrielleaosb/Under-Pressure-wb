# Under Pressure

Party game multiplayer de calibragem, blefe leve e caos social em uma nave sob pressao.

O jogo roda sem backend proprio: React + Vite no frontend e Firebase Realtime Database como sincronizacao em tempo real. A engine autoritativa roda no navegador do host da sala.

## Stack

- React 18 + Vite
- Firebase Realtime Database
- Deploy recomendado: Vercel com root em `frontend`

## Estado Atual

O projeto esta em alpha jogavel:

- salas online por codigo e link de convite;
- lobby com selecao cosmetica de nave;
- modo FFA competitivo;
- navegador rotativo a cada rodada;
- voto individual dos calibradores;
- modo de cartas `TEMATICO` e modo `LIVRE`;
- BOOST por voto, com risco e recompensa;
- streaks, ranking, sons, efeitos visuais e resumo final;
- dev mode com bots para testar sozinho.

Ainda nao esta pronto para beta publica. As prioridades atuais sao seguranca, alinhamento de dados do fim de jogo, testes de engine e playtest com 4+ pessoas.

## Como Rodar Localmente

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Depois preencha `frontend/.env.local` com as credenciais do Firebase.

URLs uteis:

- App: `http://localhost:5173`
- Dev mode com ferramentas e bots: `http://localhost:5173?dev`
- Laboratorios visuais: `?shipyard`, `?gauge`, `?rouletteLab`, `?roletas2`, `?bg`

## Firebase

Crie um projeto no Firebase Console e habilite Realtime Database.

Variaveis esperadas em `frontend/.env.local`:

```env
VITE_FB_API_KEY=
VITE_FB_AUTH_DOMAIN=
VITE_FB_DATABASE_URL=
VITE_FB_PROJECT_ID=
VITE_FB_STORAGE_BUCKET=
VITE_FB_MESSAGING_SENDER_ID=
VITE_FB_APP_ID=
```

As regras em `frontend/database.rules.json` sao apenas um endurecimento minimo para alpha. Sem Authentication, backend ou Cloud Function autoritativa, o alvo secreto e a validacao critica nao ficam realmente protegidos contra alguem inspecionando o cliente ou escrevendo direto no banco.

## Como Jogar

1. O host cria uma sala e compartilha o codigo ou link.
2. Jogadores entram, escolhem nome e nave.
3. O host ajusta rodada, timers, modo de alvo e modo de cartas.
4. O navegador inicial comeca a primeira rodada; depois o papel gira entre os jogadores.

Fluxo de rodada:

1. `TEMATICO`: o navegador gira a roleta para sortear tema e espectro.
2. `LIVRE`: o navegador escolhe uma carta entre as opcoes.
3. O navegador ve ou escolhe o alvo secreto no painel 0-100.
4. O navegador envia uma dica curta.
5. Todos os outros jogadores calibram seu palpite individualmente e podem ativar BOOST.
6. A revelacao mostra alvo, votos, pontuacao da rodada e libera o botao de continuar apos 5 segundos.

## Pontuacao

Pontuacao base por diferenca entre voto e alvo:

| Diferenca | Pontos |
| --- | ---: |
| 0-5 | 5 |
| 6-15 | 4 |
| 16-25 | 3 |
| 26-40 | 2 |
| 41-60 | 1 |
| 61+ | -1 |

BOOST:

| Resultado com BOOST | Bonus |
| --- | ---: |
| Diferenca ate 15 | +3 |
| Diferenca ate 25 | +1 |
| Diferenca acima de 25 | -2 |

O navegador tambem pontua quando a tripulacao chega perto do alvo. Se todo mundo acertar bem, recebe bonus de sincronia.

## Arquitetura

```text
frontend/src/
  firebase.js       Firebase init + exports
  gameEngine.js     Engine host-authoritative no navegador do host
  gameData.js       Temas, cartas, normalizacao e utilitarios
  App.jsx           App principal + subscriptions Firebase
  i18n.js           Textos PT/EN
  sounds.js         Web Audio API
  components/       Telas, fases e UI
```

O host e o "servidor" da partida:

- escuta a fila `/rooms/{code}/actions`;
- valida a acao conforme fase e jogador;
- atualiza o estado da sala;
- remove a acao processada;
- todos os clientes recebem o estado por `onValue`.

## Deploy na Vercel

1. Envie o repo para o GitHub.
2. Crie um projeto na Vercel.
3. Configure `Root Directory` como `frontend`.
4. Use `npm run build` como build command.
5. Use `dist` como output directory.
6. Cadastre as variaveis `VITE_FB_*`.

## Proximas Prioridades

- Fechar o segredo do alvo com backend/auth ou Cloud Function.
- Adicionar testes unitarios da engine.
- Criar limpeza de salas antigas.
- Prototipar panes simples de comunicacao/sensor.
- Fazer playtest real com 4 a 8 pessoas e cortar o que nao gerar diversao.
