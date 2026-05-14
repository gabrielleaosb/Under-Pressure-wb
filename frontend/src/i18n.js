const strings = {
  pt: {
    title: 'UNDER PRESSURE',
    subtitle: 'Party game de calibragem intergalactica',
    create: 'CRIAR SALA',
    join: 'ENTRAR NA SALA',
    playerName: 'SEU NOME DE PILOTO',
    playerNamePh: 'Capitao Zero...',
    roomCode: 'CODIGO DA SALA',
    roomCodePh: 'ABCD',
    connecting: 'CONECTANDO...',
    connected: 'CONECTADO',
    disconnected: 'DESCONECTADO',
    reconnecting: 'RECONECTANDO...',

    err_room_not_found: 'Sala nao encontrada!',
    err_game_in_progress: 'Jogo em andamento!',
    err_room_full: 'Sala cheia!',
    err_invalid_name: 'Nome invalido!',
    err_invalid_input: 'Codigo ou nome invalido!',
    err_not_in_room: 'Voce nao esta em uma sala!',
    err_room_gone: 'Sala nao existe mais!',

    lobby_title: 'HANGAR DE TRIPULACAO',
    room_code: 'CODIGO DA SALA',
    copy_link: 'COPIAR LINK',
    copied: 'COPIADO!',
    players: 'JOGADORES',
    settings: 'CONFIGURACOES DA MISSAO',
    rounds: 'RODADAS',
    clue_timer: 'TEMPO DA DICA',
    vote_timer: 'TEMPO DO VOTO',
    seconds: 's',
    start_mission: 'INICIAR MISSAO',
    assign: 'DESIGNAR',
    waiting_host: 'Aguardando o capitao...',
    host_badge: 'CAPITAO',
    you: 'VOCE',

    roulette_title: 'ROLETA DE TEMAS',
    spin_btn: 'GIRAR!',
    waiting_spin: 'O NAVEGADOR ESTA GIRANDO...',
    theme_selected: 'TEMA SELECIONADO',

    psychic_title: 'VOCE E O NAVEGADOR',
    psychic_watch: 'NAVEGADOR ESTA PENSANDO...',
    psychic_role: 'NAVEGADOR',
    target_label: 'ALVO SECRETO',
    clue_label: 'SUA DICA',
    clue_ph: 'Digite sua dica...',
    send_clue: 'TRANSMITIR DICA',
    left_side: 'ESQUERDA',
    right_side: 'DIREITA',
    time_up_clue: 'TEMPO ESGOTADO',

    voting_title: 'CALIBRAR PAINEL DE PRESSAO',
    psychic_clue: 'DICA DO NAVEGADOR',
    drag_needle: 'ARRASTE A AGULHA',
    confirm_vote: 'CONFIRMAR POSICAO',
    voted: 'VOTO ENVIADO',
    waiting_votes: 'AGUARDANDO TRIPULACAO...',
    voted_count: 'votaram',
    you_voted: 'Voce votou:',
    observer_msg: 'AGUARDANDO A TRIPULACAO - REAJA COM SINAIS!',

    reveal_title: 'REVELACAO DE PRESSAO',
    target_was: 'ALVO ERA',
    avg_label: 'MEDIA',
    diff_label: 'DIFERENCA',
    points_label: 'PONTOS',
    next_round: 'PROXIMA RODADA',

    gameover_title: 'FIM DE MISSAO',
    winners: 'VENCEDORES',
    tie: 'EMPATE GALACTICO!',
    best_psychic: 'MELHOR NAVEGADOR',
    worst_miss: 'MAIOR ERRO',
    best_hit: 'MELHOR ACERTO',
    new_mission: 'NOVA MISSAO',
    new_crew: 'NOVA TRIPULACAO',
    stats_title: 'RELATORIO DE MISSAO',

    round_label: 'RODADA',
    score_label: 'PONTOS',
    active_label: 'ATIVO',
    psychic_is: 'NAVEGADOR',
    navigator_is: 'NAVEGADOR',
    round_n: 'RODADA',
    of: 'DE',
  },
  en: {
    title: 'UNDER PRESSURE',
    subtitle: 'Intergalactic calibration party game',
    create: 'CREATE ROOM',
    join: 'JOIN ROOM',
    playerName: 'YOUR PILOT NAME',
    playerNamePh: 'Captain Zero...',
    roomCode: 'ROOM CODE',
    roomCodePh: 'ABCD',
    connecting: 'CONNECTING...',
    connected: 'CONNECTED',
    disconnected: 'DISCONNECTED',
    reconnecting: 'RECONNECTING...',

    err_room_not_found: 'Room not found!',
    err_game_in_progress: 'Game in progress!',
    err_room_full: 'Room is full!',
    err_invalid_name: 'Invalid name!',
    err_invalid_input: 'Invalid code or name!',
    err_not_in_room: 'Not in a room!',
    err_room_gone: 'Room no longer exists!',

    lobby_title: 'CREW HANGAR',
    room_code: 'ROOM CODE',
    copy_link: 'COPY LINK',
    copied: 'COPIED!',
    players: 'PLAYERS',
    settings: 'MISSION SETTINGS',
    rounds: 'ROUNDS',
    clue_timer: 'CLUE TIME',
    vote_timer: 'VOTE TIME',
    seconds: 's',
    start_mission: 'START MISSION',
    assign: 'ASSIGN',
    waiting_host: 'Waiting for the captain...',
    host_badge: 'CAPTAIN',
    you: 'YOU',

    roulette_title: 'THEME ROULETTE',
    spin_btn: 'SPIN!',
    waiting_spin: 'NAVIGATOR IS SPINNING...',
    theme_selected: 'THEME SELECTED',

    psychic_title: 'YOU ARE THE NAVIGATOR',
    psychic_watch: 'NAVIGATOR IS THINKING...',
    psychic_role: 'NAVIGATOR',
    target_label: 'SECRET TARGET',
    clue_label: 'YOUR CLUE',
    clue_ph: 'Type your clue...',
    send_clue: 'TRANSMIT CLUE',
    left_side: 'LEFT',
    right_side: 'RIGHT',
    time_up_clue: 'TIME UP',

    voting_title: 'CALIBRATE PRESSURE PANEL',
    psychic_clue: 'NAVIGATOR\'S CLUE',
    drag_needle: 'DRAG THE NEEDLE',
    confirm_vote: 'CONFIRM POSITION',
    voted: 'VOTE SENT',
    waiting_votes: 'WAITING FOR CREW...',
    voted_count: 'voted',
    you_voted: 'You voted:',
    observer_msg: 'WAITING FOR THE CREW - REACT WITH SIGNALS!',

    reveal_title: 'PRESSURE REVEAL',
    target_was: 'TARGET WAS',
    avg_label: 'AVERAGE',
    diff_label: 'DIFFERENCE',
    points_label: 'POINTS',
    next_round: 'NEXT ROUND',

    gameover_title: 'MISSION OVER',
    winners: 'WINNERS',
    tie: 'GALACTIC TIE!',
    best_psychic: 'BEST NAVIGATOR',
    worst_miss: 'WORST MISS',
    best_hit: 'BEST HIT',
    new_mission: 'NEW MISSION',
    new_crew: 'NEW CREW',
    stats_title: 'MISSION REPORT',

    round_label: 'ROUND',
    score_label: 'POINTS',
    active_label: 'ACTIVE',
    psychic_is: 'NAVIGATOR',
    navigator_is: 'NAVIGATOR',
    round_n: 'ROUND',
    of: 'OF',
  },
};

export function t(key, lang = 'pt') {
  return strings[lang]?.[key] ?? strings.pt[key] ?? key;
}

export function tCard(card, side, lang = 'pt') {
  if (!card) return '';
  return lang === 'en'
    ? (side === 'left' ? card.lE : card.rE)
    : (side === 'left' ? card.lP : card.rP);
}

export function tTheme(theme, lang = 'pt') {
  if (!theme) return '';
  return lang === 'en' ? theme.nameEN : theme.namePT;
}

export function tGrade(result, lang = 'pt') {
  if (!result) return '';
  return lang === 'en' ? result.grade : result.gradePT;
}
