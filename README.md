# 🚀 Space Pressure / Pressão no Espaço

Multiplayer party game de calibração espacial — 100% humano, sem IA.

## Estrutura

```
waveweb/
├── backend/   Node.js WebSocket server
└── frontend/  React + Vite SPA
```

## Desenvolvimento local

### 1. Backend (servidor WebSocket)
```bash
cd backend
npm install
npm run dev       # hot-reload com node --watch
# Server: ws://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev       # Vite dev server
# App: http://localhost:5173
```

A URL do servidor WebSocket padrão é `ws://localhost:3001`.  
Para apontar para outro servidor, defina a variável de ambiente:
```
VITE_WS_URL=wss://seu-servidor.com
```

---

## Deploy: Vercel (frontend) + Railway/Render (backend)

### Backend no Railway

1. Criar novo projeto no Railway e conectar este repositório
2. Selecionar pasta `backend` como **Root Directory** (ou usar monorepo config)
3. **Start command**: `node server.js`
4. Copiar a URL pública gerada (ex: `wss://space-pressure-server.up.railway.app`)

### Backend no Render

1. Criar **Web Service** no Render
2. Root Directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Copiar a URL gerada

### Frontend no Vercel

1. Criar novo projeto no Vercel conectando este repositório
2. **Root Directory**: `frontend`
3. **Build command**: `npm run build`
4. **Output directory**: `dist`
5. Em **Environment Variables**, adicionar:
   - `VITE_WS_URL` = `wss://sua-url-do-backend.railway.app`
6. Deploy!

---

## Como jogar

1. **Criar sala**: Um jogador entra, cria a sala e compartilha o código de 4 letras
2. **Entrar na sala**: Outros jogadores entram com o código
3. **Configurar**: O capitão (host) divide os jogadores em 2 equipes e configura rodadas/danos
4. **Iniciar missão**: Host clica em "Iniciar Missão"

### Fluxo por rodada

- **Roleta**: O Psíquico da equipe ativa gira a roleta para sortear um tema
- **Psíquico**: Vê a posição secreta (0–100) no espectro e digita UMA palavra-dica
- **Votação**: Toda a equipe ativa arrasta o cursor para onde acha que o alvo está
- **Revelação**: O alvo é revelado, danos são aplicados, pontos computados

### Pontuação (diferença entre média da equipe e alvo)

| Diferença | Pontos | Danos |
|-----------|--------|-------|
| ±5        | 3      | 0 — PERFEITO |
| ±15       | 2      | 0 — MUITO PRÓXIMO |
| ±25       | 1      | 1 — PRÓXIMO |
| ±40       | 0      | 1 — RAZOÁVEL |
| >40       | 0      | 2 — LONGE |

A nave da equipe ativa explode se acumular danos demais!

---

## Features implementadas

- ✅ Bilíngue PT / EN (toggle na UI)
- ✅ 60 cartas de espectro (5 por tema × 12 temas)
- ✅ Roleta animada com 12 temas
- ✅ Painel de pressão com slider drag/touch
- ✅ Timer server-side com countdown visual
- ✅ Reações com emojis em tempo real
- ✅ Naves pixel art com 5 estágios de dano
- ✅ Reconexão automática (mesmo nome em sala aberta)
- ✅ Responsivo (mobile 360px+)
- ✅ Easter egg 👾
- ✅ Estatísticas pós-jogo
- ✅ Confetes na vitória

## Tecnologias

- **Frontend**: React 18 + Vite, CSS puro (pixel art, glow neon, scanlines)
- **Backend**: Node.js + ws (WebSocket)
- **Fontes**: Press Start 2P + VT323 (Google Fonts)
- **Sem banco de dados** — salas vivem em memória durante a sessão
