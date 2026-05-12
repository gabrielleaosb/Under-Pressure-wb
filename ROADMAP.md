# Under Pressure - Roadmap

## Visao

Under Pressure deve ser um party game online de calibragem, blefe leve e caos social em uma nave sob pressao. A referencia de base e Wavelength, mas o objetivo e ir alem do "acerte o ponto no espectro": a nave precisa reagir, quebrar, limitar a comunicacao e criar decisoes tensas que facam os amigos gritarem, rirem e culparem uns aos outros.

## Estado Atual

O projeto ja tem uma fatia vertical funcional:

- App React/Vite com Firebase Realtime Database.
- Salas online com codigo, lobby, entrada de jogadores e presenca.
- Engine host-authoritative no navegador do host.
- Fluxo de rodada: roleta, transmissor, voto, revelacao e fim de jogo.
- Modo FFA atual, com pontuacao individual, dano individual, streak e overdrive.
- Painel de pressao interativo.
- Naves pixel art, seletor de nave, ranking, sons sinteticos e efeitos visuais.
- Dev mode com bots para testar fluxo solo.

O projeto ainda esta em alpha. Ele compila e tem base jogavel, mas precisa consolidar seguranca, regras, UX e identidade mecanica.

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

- Escolher o modo principal do MVP: FFA, equipes ou cooperativo.
- Atualizar README para refletir o modo escolhido.
- Remover ou isolar restos de codigo antigo de equipes.
- Definir vocabulario fixo: transmissor, piloto, pressao, dano, overdrive, rodada.
- Criar um documento curto de regras atuais.

Criterio de pronto:

- Uma pessoa nova entende como o jogo funciona lendo README + ROADMAP.
- O codigo nao mistura conceitos antigos de equipe com o modo ativo.

## Marco 1 - MVP Online Confiavel

Prazo alvo: 3 a 5 dias.

Objetivo: permitir uma noite de teste com 4 a 8 amigos sem travar o fluxo.

Tarefas tecnicas:

- Endurecer regras do Firebase.
- Parar de expor o alvo secreto para todos os clientes.
- Validar acoes no engine com mais rigor.
- Tornar a fila de acoes idempotente.
- Melhorar reconexao e troca de host.
- Criar limpeza de salas antigas.
- Adicionar tela de erro clara quando Firebase nao estiver configurado.
- Criar testes unitarios para score, dano, overdrive, streak e final de jogo.

Tarefas de UX:

- Melhorar explicacao minima do lobby.
- Indicar claramente quem deve agir em cada fase.
- Reduzir textos truncados e mojibake.
- Garantir que mobile seja o caminho principal.
- Criar um fluxo de convite com link e, depois, QR code.

Criterio de pronto:

- Host cria sala, 4 pessoas entram, partida termina e todos veem o mesmo resultado.
- Um jogador desconectado nao trava a rodada.
- O alvo secreto nao fica trivialmente visivel para jogadores comuns.

## Marco 2 - Identidade De Nave Sob Pressao

Prazo alvo: 5 a 8 dias.

Objetivo: criar as mecanicas que diferenciam Under Pressure de Wavelength.

Sistemas candidatos para MVP:

- Casco: dano acumulado, risco de explosao ou penalidade.
- Reator: overdrive aumenta pontos, mas gera calor.
- Comunicacao: falhas limitam dica, voto ou informacao na tela.
- Oxigenio: timer global que pune demora.
- Reparo: depois da revelacao, jogadores escolhem entre pontuar, reparar ou arriscar.

Primeira versao recomendada:

- Manter o painel 0-100.
- Adicionar 3 sistemas simples: casco, reator e comunicacao.
- Cada rodada gera uma pane se a media errar muito ou se muitos usarem overdrive.
- A pane altera a proxima rodada com uma regra pequena.

Exemplos de panes:

- Comunicacao ruim: transmissor so pode dar dica com ate 5 letras.
- Sensor instavel: votantes nao veem numeros no painel.
- Reator quente: overdrive vale mais, mas erro causa dano dobrado.
- Gravidade falhando: ponteiro comeca em posicao aleatoria e treme.

Criterio de pronto:

- O jogador sente que esta em uma nave quebrando, nao apenas em um quiz abstrato.
- As panes sao simples de explicar em uma frase.
- O caos aumenta risadas sem destruir a legibilidade.

## Marco 3 - Playtest Night

Prazo alvo: 7 a 14 dias a partir de hoje.

Objetivo: testar diversao real com amigos.

Preparacao:

- Criar formulario curto de feedback.
- Preparar 3 configuracoes: curta, padrao e caotica.
- Criar um botao de "copiar convite".
- Ter dev tools escondidas por query param.
- Registrar historico de rodada suficiente para diagnosticar bugs.

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

- Expandir cartas para 150+ espectros.
- Criar packs tematicos: espaco, cultura pop, amigos, absurdos, dificil.
- Adicionar configuracao de intensidade de caos.
- Criar modo FFA competitivo.
- Criar modo cooperativo sobrevivencia.
- Avaliar modo equipes se playtest pedir.
- Criar tela de resumo com melhores momentos.

Criterio de pronto:

- O jogo aguenta 5 a 10 partidas sem repetir demais.
- O host consegue escolher o clima da sessao.

## Marco 5 - Beta Fechada

Prazo alvo: 4 a 8 semanas.

Objetivo: preparar o jogo para pessoas fora do circulo direto.

Tarefas:

- Backend ou funcao autoritativa para segredos e validacao critica.
- Regras de banco fechadas.
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
- Fechar regras publicas do Firebase.
- Consolidar FFA vs equipes.
- Playtestar com 4+ pessoas.
- Transformar dano/pressao em efeito mecanico real.
- Corrigir textos com encoding quebrado.

## Prioridades P1

- QR code de convite.
- Mais cartas e packs.
- Replays/resumo da partida.
- Melhor feedback de turno.
- Melhor host migration.
- Testes automaticos de engine.
- Melhor estado vazio e mensagens de erro.

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
- Cada rodada tem decisao clara.
- A pressao da nave muda pelo menos uma regra durante a partida.
- A revelacao gera tensao e reacao social.
- A partida termina com ranking/resumo convincente.
- O grupo consegue jogar de novo sem ajuda do desenvolvedor.
