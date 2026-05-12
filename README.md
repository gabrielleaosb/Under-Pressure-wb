# 🎮 Under Pressure

Party game multiplayer de calibração — 100% humanos, sem IA.

**Stack:** React + Vite + Firebase Realtime Database → deploy gratuito na Vercel.
Sem backend separado. O estado do jogo vive no Firebase; a lógica roda no browser do host.

---

## 🔥 Configurar Firebase (5 min)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto
2. No projeto → **Build → Realtime Database → Create database** → escolha região → modo **test** por enquanto
3. No projeto → **Project Settings → Your apps → `</>`** (Web) → registre o app → copie o `firebaseConfig`
4. Nas regras do banco (**Realtime Database → Rules**), cole:
   ```json
   {
     "rules": {
       "rooms": {
         "$code": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```
5. Copie `frontend/.env.example` → `frontend/.env.local` e preencha com os valores do `firebaseConfig`

---

## 🚀 Deploy na Vercel (grátis, sem backend)

1. Faça push do repositório pro GitHub
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o repo
3. Em **Root Directory**, selecione: `frontend`
4. Build command: `npm run build` | Output directory: `dist`
5. Em **Environment Variables**, adicione todas as `VITE_FB_*` do seu `.env.local`
6. Deploy! 🎉

---

## 💻 Rodar localmente

```bash
cd frontend
cp .env.example .env.local   # preencha com suas credenciais Firebase
npm install
npm run dev                  # http://localhost:5173
```

Dev mode (testa o fluxo solo): `http://localhost:5173?dev`

---

## 🎮 Como jogar

1. Host cria a sala → compartilha o código de 4 letras
2. Outros jogadores entram com o código
3. Host divide em 2 equipes (mín. 2 por equipe) e configura a partida
4. Host inicia a missão

### Fluxo por rodada
- **Roleta**: navegador gira para sortear o tema
- **Psíquico**: vê a posição secreta (0–100) no espectro e dá UMA palavra de dica
- **Votação**: equipe calibra o painel de pressão (arrasta a agulha)
- **Revelação**: posição revelada, danos aplicados, pontos computados

### Pontuação
| Diferença | Pontos | Danos |
|-----------|--------|-------|
| ±5 | 3 | 0 — PERFEITO |
| ±15 | 2 | 0 — MUITO PRÓXIMO |
| ±25 | 1 | 1 — PRÓXIMO |
| ±40 | 0 | 1 — RAZOÁVEL |
| >40 | 0 | 2 — LONGE |

A nave explode ao acumular danos demais → equipe adversária vence!

---

## 🏗 Arquitetura

```
frontend/src/
├── firebase.js       Firebase init + exports
├── gameEngine.js     Lógica do jogo (roda no browser do host)
├── gameData.js       60 cartas de espectro, utilitários
├── App.jsx           App principal + Firebase subscriptions
├── i18n.js           Traduções PT/EN
├── sounds.js         Web Audio API (sem arquivos externos)
└── components/       UI components
```

**O host é o servidor:** quando o host abre a sala, o `GameEngine` instanciado no browser dele:
- Ouve requisições de ação no Firebase (`/rooms/{code}/actions`)
- Executa a lógica do jogo
- Escreve o novo estado de volta no Firebase
- Todos os outros clientes recebem o estado atualizado via `onValue`
