# Under Pressure - Roadmap

## Visao

Under Pressure deve ser um party game online de calibragem, blefe leve e caos social em uma nave sob pressao. A referencia de base e Wavelength, mas o objetivo e ir alem do "acerte o ponto no espectro": a nave precisa reagir, quebrar, limitar a comunicacao e criar decisoes tensas que facam os amigos gritarem, rirem e culparem uns aos outros.

## Estado Atual

O projeto ja tem uma fatia vertical funcional:

- App React/Vite com Firebase Realtime Database.
- Salas online com codigo, lobby, entrada de jogadores e presenca.
- Engine host-authoritative no navegador do host.
- Fluxo de rodada: roleta/selecao de carta, navegador, voto, revelacao e fim de jogo.
- Modo FFA com pontuacao individual, streak e BOOST (alto risco/alta recompensa).
- Sistema de dano removido — pontuacao negativa substitui penalidade por erro grande.
- Painel de pressao interativo com identificacao de votos por ranking.
- Naves pixel art com cor e accent, seletor de nave, ranking, sons e efeitos visuais.
- Modo LIVRE: navegador escolhe entre N cartas estilo Wavelength em vez de roleta tematica.
- Dev mode com bots para testar fluxo solo.
- Desconexao de navegador pula a rodada automaticamente; votantes desconectados sao ignorados.
- Regras do Firebase endurecidas por caminho: sala, jogadores, acoes, votos, placar, historico e locks tem validacao explicita.
- Host heartbeat com troca de host quando o navegador autoridade fica stale.
- Timer de reveal/proxima rodada corrigido com `revealUnlockAt` e finalizacao de voto idempotente por `finalizeLocks`.
- Dependencias auditadas apos upgrade do Firebase; `npm audit --omit=dev` sem vulnerabilidades conhecidas.

O projeto esta em alpha jogavel. Precisa consolidar segredo real do alvo, panes mecanicas e playtest real.

## URGENTE - Roadmap Real Recomendado

Esta lista corrige o descompasso entre o estado real do codigo, o README e os itens marcados como concluidos. Tratar como prioridade antes de adicionar mecanicas permanentes novas.

1. ~~Corrigir `GameOver` e `roundHistory`.~~ ✓
   - Engine grava `avgDiff` e `votes` no historico.
   - `GameOver` tambem suporta historico antigo com `averageVote`.

2. ~~Atualizar `README.md` para o jogo atual.~~ ✓
   - Documentar FFA real, navegador rotativo, voto individual, modo TEMATICO/LIVRE, BOOST e streak.
   - Remover regras antigas de equipes, dano acumulado e nave explodindo.

3. ~~Limpar restos de equipe e dano do codigo ativo.~~ ✓
   - Remover constantes, helpers, textos e CSS legados de equipe/dano no app ativo.
   - Manter dano apenas como cosmetico de nave, se for intencional.

4. Corrigir encoding/mojibake.
   - Priorizar `README.md`, `gameData.js`, `i18n.js`, `CardPicker.jsx`, `RevealPhase.jsx`, `GameOver.jsx` e comentarios visiveis.

5. Fechar o Firebase e decidir estrategia real para segredo. (parcialmente feito)
   - O `.write` amplo de `rooms/$code` foi removido e substituido por permissoes/validacoes granulares.
   - Acoes aceitam apenas tipos conhecidos e timestamps plausiveis.
   - Votos rejeitam campos extras e validam `position`/`boost`.
   - O alvo secreto ainda fica visivel para clientes comuns via sala inteira.
   - Sem backend/auth, segredo e validacao critica nao ficam realmente seguros.

6. Adicionar testes unitarios da engine. (parcialmente feito)
   - Coberto: score, BOOST, streak e payload de resolucao de rodada/roundHistory.
   - Pendente: fluxo Firebase completo, pick card, desconexao e gameover.

7. Prototipar panes somente depois dessa base.
   - Primeira pane recomendada: comunicacao limitada a 5 caracteres ou sensor sem numeros.
   - Evitar adicionar sistemas permanentes enquanto seguranca, docs e fluxo final ainda estao desalinhados.

## Norte De Produto

Prioridade maxima: transformar "painel Wavelength espacial" em "nave sob pressao".

Toda mecanica nova deve responder a pelo menos uma pergunta:

- Ela aumenta a pressao social?
- Ela cria uma decisao interessante, nao apenas mais UI?
- Ela gera historias curtas que os jogadores vao comentar depois da rodada?
- Ela funciona em celular e com amigos em chamada?

## Prazos Realistas Com Codex + Claude Code

Assumindo sessoes frequentes, decisoes rapidas e playtests pequenos:

- MVP privado bom para amigos: 7 a 14 dias.
- Alpha forte, com identidade propria: 3 a 5 semanas.
- Beta fechada com estabilidade melhor: 6 a 8 semanas.
- Versao publica simples: 2 a 3 meses, dependendo de backend, seguranca e volume de conteudo.

O prazo encurta bastante com Codex e Claude Code, mas playtest nao da para automatizar. A parte que mais define qualidade sera jogar com pessoas reais e cortar o que nao diverte.

## Marco 0 - Consolidar Direcao

Prazo alvo: 1 dia.

Objetivo: deixar o projeto sem ambiguidade entre modo por equipes e FFA.

Tarefas:

- ~~Escolher o modo principal do MVP: FFA, equipes ou cooperativo.~~ ✓ (FFA consolidado)
- ~~Atualizar README para refletir o modo escolhido.~~ ✓
- ~~Remover ou isolar restos de codigo antigo de equipes.~~ ✓
- ~~Definir vocabulario fixo.~~ ✓ (navegador, calibrador, BOOST, rodada — dano removido)
- Criar um documento curto de regras atuais.

Criterio de pronto:

- Uma pessoa nova entende como o jogo funciona lendo README + ROADMAP.
- O codigo nao mistura conceitos antigos de equipe com o modo ativo.

## Marco 1 - MVP Online Confiavel

Prazo alvo: 3 a 5 dias.

Objetivo: permitir uma noite de teste com 4 a 8 amigos sem travar o fluxo.

Tarefas tecnicas:

- ~~Endurecer regras do Firebase.~~ feito (sem `.write` amplo; validacoes granulares por caminho)
- Parar de expor o alvo secreto para todos os clientes. (pendente; exige backend/auth ou separacao real de leitura)
- ~~Validar acoes no engine com mais rigor.~~ feito (whitelist nas regras e validacoes de fase/ator no engine)
- ~~Tornar a finalizacao de voto idempotente.~~ feito (`finalizeLocks` por rodada)
- ~~Melhorar reconexao e troca de host.~~ feito (skip automatico, votantes ignorados, heartbeat e host stale election)
- ~~Criar limpeza de salas antigas.~~ parcial (TTL `expiresAt`, delecao de sala expirada por regra e limpeza oportunista por codigo conhecido; limpeza agendada/Admin ainda fica para backend futuro)
- Adicionar tela de erro clara quando Firebase nao estiver configurado.
- ~~Criar testes unitarios para score, BOOST e pontuacao do navegador.~~ feito (cobertura inicial; testes de fluxo engine ainda pendentes)

Tarefas de UX:

- ~~Melhorar explicacao minima do lobby.~~ ✓ (briefing, configuracoes, indicadores de fase)
- ~~Indicar claramente quem deve agir em cada fase.~~ ✓ (round intro, labels de fase, CardPicker)
- Reduzir textos truncados e mojibake.
- Garantir que mobile seja o caminho principal.
- ~~Criar um fluxo de convite com link.~~ ✓ (link funciona, bug do botao voltar corrigido)
- QR code de convite (pendente).

Criterio de pronto:

- Host cria sala, 4 pessoas entram, partida termina e todos veem o mesmo resultado.
- ~~Um jogador desconectado nao trava a rodada.~~ ✓
- O alvo secreto nao fica trivialmente visivel para jogadores comuns. (ainda pendente sem backend/auth)

## Marco 2 - Identidade De Nave Sob Pressao

Prazo alvo: 5 a 8 dias.

Objetivo: criar as mecanicas que diferenciam Under Pressure de Wavelength.

Sistemas candidatos para MVP:

- ~~Casco/dano acumulado~~ (removido — pontuacao negativa substitui penalidade)
- BOOST: alto risco/alta recompensa por voto. ✓ Implementado. Precisa de playtest para calibrar valores.
- Comunicacao: falhas limitam a dica ou informacao na tela. (pendente)
- Oxigenio: timer global que pune demora. (pendente)
- Reparo: depois da revelacao, jogadores escolhem entre pontuar, reparar ou arriscar. (pendente)

Primeira versao recomendada:

- Manter o painel 0-100. ✓
- ~~Adicionar reator/overdrive.~~ → BOOST implementado com formula reformulada. ✓
- Adicionar panes de comunicacao como evento de rodada.
- A pane altera a proxima rodada com uma regra pequena.

Exemplos de panes a prototipar:

- Comunicacao ruim: navegador so pode dar dica com ate 5 letras.
- Sensor instavel: calibradores nao veem numeros no painel.
- Reator quente: BOOST vale mais, mas erro causa penalidade dobrada.
- Gravidade falhando: ponteiro comeca em posicao aleatoria e treme.

Criterio de pronto:

- O jogador sente que esta em uma nave quebrando, nao apenas em um quiz abstrato.
- As panes sao simples de explicar em uma frase.
- O caos aumenta risadas sem destruir a legibilidade.

## Marco 3 - Playtest Night

Prazo alvo: proximo grupo disponivel.

Objetivo: testar diversao real com amigos.

Preparacao:

- Criar formulario curto de feedback.
- Preparar 3 configuracoes: curta, padrao e caotica.
- ~~Criar um botao de copiar convite.~~ ✓
- ~~Ter dev tools escondidas por query param.~~ ✓ (?dev, ?gauge, ?rouletteLab, etc.)
- ~~Registrar historico de rodada suficiente para diagnosticar bugs.~~ ✓ (roundHistory)

Metricas de playtest:

- Tempo para entrar na sala.
- Tempo ate entender a primeira rodada.
- Quantas vezes alguem pergunta "o que eu faco agora?".
- Quantas risadas ou discussoes aparecem por rodada.
- Rodadas em que alguem fica sem acao por tempo demais.
- Se os jogadores pedem "mais uma".

Criterio de sucesso:

- Um grupo termina uma partida e quer jogar outra.
- As pessoas entendem a regra principal sem explicacao longa.
- Pelo menos uma mecanica de pressao vira assunto da chamada.

## Marco 4 - Conteudo E Modos

Prazo alvo: 1 a 2 semanas apos o primeiro playtest.

Objetivo: aumentar rejogabilidade sem inflar complexidade.

Tarefas:

- Expandir cartas tematicas para 150+ espectros. (68 tematicas atuais)
- ~~Criar pack de cartas abertas estilo Wavelength.~~ ✓ (30 cartas em OPEN_CARDS, modo LIVRE)
- ~~Adicionar configuracao de modo de cartas no lobby.~~ ✓ (TEMATICO / LIVRE, opcoes 1/3/5)
- ~~Modo FFA competitivo.~~ ✓ (implementado e refinado)
- Criar modo cooperativo sobrevivencia.
- Avaliar modo equipes se playtest pedir.
- ~~Tela de resumo com destaques no fim de partida.~~ ✓ (GameOver com destaques e placar)
- Rejoin de jogador que saiu durante partida em andamento. (base feita: jogador desconectado pode recuperar slot por mesmo nome; UX dedicada ainda pendente)

Criterio de pronto:

- O jogo aguenta 5 a 10 partidas sem repetir demais.
- O host consegue escolher o clima da sessao.

## Marco 5 - Beta Fechada

Prazo alvo: 4 a 8 semanas.

Objetivo: preparar o jogo para pessoas fora do circulo direto.

Tarefas:

- Backend ou funcao autoritativa para segredos e validacao critica.
- Regras de banco fechadas para escrita cliente. (parcial feito; leitura por identidade ainda depende de auth/backend)
- Rate limit basico para acoes.
- Room lifecycle completo.
- Observabilidade minima: logs de erro e eventos anonimos.
- Tutorial interativo ou onboarding de primeira rodada.
- Ajustes de acessibilidade mobile.
- Politica de privacidade simples se houver analytics.

Criterio de pronto:

- Pode compartilhar o link com grupos externos sem explicar tudo ao vivo.
- Falhas comuns geram mensagens claras.
- Trapaca basica via console nao quebra a partida.

## Prioridades P0

- Corrigir exposicao do alvo secreto.
- ~~Fechar escrita publica ampla do Firebase.~~ feito (regras granulares por caminho; ainda sem segredo real)
- ~~Consolidar FFA vs equipes.~~ ✓
- Playtestar com 4+ pessoas.
- ~~Transformar overdrive em mecanica de decisao real.~~ ✓ (BOOST com risco/recompensa)
- ~~Corrigir jargao e textos confusos na UI.~~ ✓ (navegador, calibrador, labels claros)

## Prioridades P1

- QR code de convite.
- Mais cartas tematicas (meta: 150+).
- ~~Pack de cartas abertas estilo Wavelength.~~ ✓
- ~~Melhor feedback de turno e identidade de fase.~~ ✓ (round intro, card picker, transicoes)
- ~~Melhor host migration.~~ feito (skip automatico, transferencia de host e heartbeat stale)
- Testes automaticos de engine. (parcial: regras puras e resolucao de rodada cobertas; fluxo Firebase completo ainda pendente)
- ~~Melhor estado vazio e mensagens de erro.~~ ✓ (error handling no engine, telas de espera)
- Panes de comunicacao (primeira iteracao).
- Rejoin mid-game. (base de engine feita; UX dedicada pendente)

## Prioridades P2

- Cosmeticos desbloqueaveis.
- Estatisticas persistentes.
- Modo espectador.
- Salas publicas.
- Matchmaking.
- Ranking global.
- Monetizacao.

## Fluxo De Trabalho Com Codex E Claude Code

Use os dois como aceleradores, mas mantenha uma unica direcao de produto.

Codex deve cuidar de:

- Integracao no repo.
- Mudancas com teste e build.
- Refatoracao de engine.
- Firebase, regras e fluxo online.
- Revisao de riscos.

Claude Code pode cuidar em paralelo de:

- Variantes de UI.
- Copys e regras explicaveis.
- Novas cartas e packs.
- Prototipos de mecanicas isoladas.
- Ideias de efeitos visuais e audio.

Regra operacional:

- Uma tarefa por branch ou lote pequeno.
- Toda mecanica nova precisa de playtest.
- Nao aceitar mudanca visual que piore clareza mobile.
- Nao adicionar sistema permanente antes de testar como evento temporario.

## Definicao De MVP

O MVP de Under Pressure esta pronto quando:

- 4 a 8 jogadores conseguem jogar online pelo celular.
- Uma partida dura 10 a 20 minutos.
- Cada rodada tem decisao clara (escolha de carta, BOOST, posicao alvo livre).
- Pelo menos uma mecanica de pressao muda uma regra durante a partida.
- A revelacao gera tensao e reacao social.
- A partida termina com ranking/resumo convincente.
- O grupo consegue jogar de novo sem ajuda do desenvolvedor.
