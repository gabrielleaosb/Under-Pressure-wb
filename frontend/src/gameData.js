// ── Themes ─────────────────────────────────────────────────────────────────
export const THEMES = [
  { id: 0,  namePT: 'Filmes & Séries',     nameEN: 'Movies & TV',        shortPT: 'FILMES',   shortEN: 'MOVIES',  color: '#ff6b6b' },
  { id: 1,  namePT: 'Comida & Bebida',      nameEN: 'Food & Drinks',       shortPT: 'COMIDA',   shortEN: 'FOOD',    color: '#ffa07a' },
  { id: 2,  namePT: 'Ciência & Tech',       nameEN: 'Science & Tech',      shortPT: 'CIÊNCIA',  shortEN: 'SCIENCE', color: '#00ced1' },
  { id: 3,  namePT: 'Esportes',             nameEN: 'Sports',              shortPT: 'ESPORTE',  shortEN: 'SPORTS',  color: '#32cd32' },
  { id: 4,  namePT: 'Música',               nameEN: 'Music',               shortPT: 'MÚSICA',   shortEN: 'MUSIC',   color: '#ff69b4' },
  { id: 5,  namePT: 'Natureza & Animais',   nameEN: 'Nature & Animals',    shortPT: 'NATUREZA', shortEN: 'NATURE',  color: '#5dbb63' },
  { id: 6,  namePT: 'História',             nameEN: 'History',             shortPT: 'HISTÓRIA', shortEN: 'HISTORY', color: '#d2691e' },
  { id: 7,  namePT: 'Videogames',           nameEN: 'Video Games',         shortPT: 'GAMES',    shortEN: 'GAMES',   color: '#9400d3' },
  { id: 8,  namePT: 'Trabalho & Carreira',  nameEN: 'Work & Career',       shortPT: 'TRABALHO', shortEN: 'WORK',    color: '#4169e1' },
  { id: 9,  namePT: 'Filosofia & Emoções',  nameEN: 'Philosophy',          shortPT: 'MENTE',    shortEN: 'MIND',    color: '#ff8c00' },
  { id: 10, namePT: 'Espaço & Ficção',      nameEN: 'Space & Sci-Fi',      shortPT: 'ESPAÇO',   shortEN: 'SPACE',   color: '#00bfff' },
  { id: 11, namePT: 'Cultura Pop',          nameEN: 'Pop Culture',         shortPT: 'POP',      shortEN: 'POP',     color: '#ff1493' },
  { id: 12, namePT: 'Amigos & Caos',        nameEN: 'Friends & Chaos',     shortPT: 'AMIGOS',   shortEN: 'FRIENDS', color: '#00ff88' },
];

// ── 60 Spectrum Cards ───────────────────────────────────────────────────────
export const CARDS = [
  // 0 — Movies & TV
  { id:  0, t:0,  lP:'Previsível',     lE:'Predictable',   rP:'Surpreendente', rE:'Surprising'    },
  { id:  1, t:0,  lP:'Lento',          lE:'Slow-paced',    rP:'Frenético',     rE:'Action-packed' },
  { id:  2, t:0,  lP:'Sério',          lE:'Serious',       rP:'Cômico',        rE:'Comedic'       },
  { id:  3, t:0,  lP:'Clássico',       lE:'Classic',       rP:'Contemporâneo', rE:'Contemporary'  },
  { id:  4, t:0,  lP:'Arthouse',       lE:'Arthouse',      rP:'Blockbuster',   rE:'Blockbuster'   },
  // 1 — Food & Drinks
  { id:  5, t:1,  lP:'Saudável',       lE:'Healthy',       rP:'Indulgente',    rE:'Indulgent'     },
  { id:  6, t:1,  lP:'Suave',          lE:'Mild',          rP:'Apimentado',    rE:'Spicy'         },
  { id:  7, t:1,  lP:'Doce',           lE:'Sweet',         rP:'Amargo',        rE:'Bitter'        },
  { id:  8, t:1,  lP:'Barato',         lE:'Budget',        rP:'Sofisticado',   rE:'Gourmet'       },
  { id:  9, t:1,  lP:'Cru',            lE:'Raw',           rP:'Muito Cozido',  rE:'Overcooked'    },
  // 2 — Science & Tech
  { id: 10, t:2,  lP:'Comprovado',     lE:'Proven',        rP:'Teórico',       rE:'Theoretical'   },
  { id: 11, t:2,  lP:'Simples',        lE:'Simple',        rP:'Complexo',      rE:'Complex'       },
  { id: 12, t:2,  lP:'Seguro',         lE:'Safe',          rP:'Perigoso',      rE:'Dangerous'     },
  { id: 13, t:2,  lP:'Analógico',      lE:'Analog',        rP:'Digital',       rE:'Digital'       },
  { id: 14, t:2,  lP:'Obsoleto',       lE:'Obsolete',      rP:'Futurístico',   rE:'Futuristic'    },
  // 3 — Sports
  { id: 15, t:3,  lP:'Individual',     lE:'Solo',          rP:'Coletivo',      rE:'Team'          },
  { id: 16, t:3,  lP:'Físico',         lE:'Physical',      rP:'Mental',        rE:'Mental'        },
  { id: 17, t:3,  lP:'Devagar',        lE:'Slow',          rP:'Veloz',         rE:'Fast'          },
  { id: 18, t:3,  lP:'Amador',         lE:'Amateur',       rP:'Profissional',  rE:'Professional'  },
  { id: 19, t:3,  lP:'Seguro',         lE:'Safe',          rP:'Radical',       rE:'Extreme'       },
  // 4 — Music
  { id: 20, t:4,  lP:'Calmo',          lE:'Calm',          rP:'Agitado',       rE:'Intense'       },
  { id: 21, t:4,  lP:'Simples',        lE:'Simple',        rP:'Elaborado',     rE:'Complex'       },
  { id: 22, t:4,  lP:'Melancólico',    lE:'Melancholic',   rP:'Animado',       rE:'Upbeat'        },
  { id: 23, t:4,  lP:'Acústico',       lE:'Acoustic',      rP:'Eletrônico',    rE:'Electronic'    },
  { id: 24, t:4,  lP:'Old-school',     lE:'Old-school',    rP:'Contemporâneo', rE:'Contemporary'  },
  // 5 — Nature & Animals
  { id: 25, t:5,  lP:'Doméstico',      lE:'Domestic',      rP:'Selvagem',      rE:'Wild'          },
  { id: 26, t:5,  lP:'Microscópico',   lE:'Microscopic',   rP:'Gigantesco',    rE:'Gigantic'      },
  { id: 27, t:5,  lP:'Dócil',          lE:'Gentle',        rP:'Feroz',         rE:'Fierce'        },
  { id: 28, t:5,  lP:'Terrestre',      lE:'Land',          rP:'Aquático',      rE:'Aquatic'       },
  { id: 29, t:5,  lP:'Raro',           lE:'Rare',          rP:'Comum',         rE:'Common'        },
  // 6 — History & Geography
  { id: 30, t:6,  lP:'Antigo',         lE:'Ancient',       rP:'Moderno',       rE:'Modern'        },
  { id: 31, t:6,  lP:'Local',          lE:'Local',         rP:'Global',        rE:'Global'        },
  { id: 32, t:6,  lP:'Pacífico',       lE:'Peaceful',      rP:'Conflituoso',   rE:'Conflict-torn' },
  { id: 33, t:6,  lP:'Esquecido',      lE:'Forgotten',     rP:'Famoso',        rE:'Renowned'      },
  { id: 34, t:6,  lP:'Pequena Nação',  lE:'Small Nation',  rP:'Império',       rE:'Empire'        },
  // 7 — Video Games
  { id: 35, t:7,  lP:'Casual',         lE:'Casual',        rP:'Hardcore',      rE:'Hardcore'      },
  { id: 36, t:7,  lP:'Solo',           lE:'Singleplayer',  rP:'Multiplayer',   rE:'Multiplayer'   },
  { id: 37, t:7,  lP:'Fácil',          lE:'Easy',          rP:'Impossível',    rE:'Impossible'    },
  { id: 38, t:7,  lP:'Curto',          lE:'Short',         rP:'Interminável',  rE:'Endless'       },
  { id: 39, t:7,  lP:'Realista',       lE:'Realistic',     rP:'Fantasioso',    rE:'Fantasy'       },
  // 8 — Work & Career
  { id: 40, t:8,  lP:'Criativo',       lE:'Creative',      rP:'Técnico',       rE:'Technical'     },
  { id: 41, t:8,  lP:'Estressante',    lE:'Stressful',     rP:'Tranquilo',     rE:'Relaxed'       },
  { id: 42, t:8,  lP:'Bem Pago',       lE:'Well-paid',     rP:'Explorado',     rE:'Underpaid'     },
  { id: 43, t:8,  lP:'Solitário',      lE:'Solitary',      rP:'Social',        rE:'Social'        },
  { id: 44, t:8,  lP:'Manual',         lE:'Manual',        rP:'Intelectual',   rE:'Intellectual'  },
  // 9 — Philosophy & Emotions
  { id: 45, t:9,  lP:'Otimista',       lE:'Optimistic',    rP:'Pessimista',    rE:'Pessimistic'   },
  { id: 46, t:9,  lP:'Racional',       lE:'Rational',      rP:'Emocional',     rE:'Emotional'     },
  { id: 47, t:9,  lP:'Egoísta',        lE:'Selfish',       rP:'Altruísta',     rE:'Altruistic'    },
  { id: 48, t:9,  lP:'Medo',           lE:'Fear',          rP:'Coragem',       rE:'Courage'       },
  { id: 49, t:9,  lP:'Caos',           lE:'Chaos',         rP:'Ordem',         rE:'Order'         },
  // 10 — Space & Sci-Fi
  { id: 50, t:10, lP:'Próximo',        lE:'Near',          rP:'Infinito',      rE:'Infinite'      },
  { id: 51, t:10, lP:'Habitável',      lE:'Habitable',     rP:'Hostil',        rE:'Hostile'       },
  { id: 52, t:10, lP:'Descoberto',     lE:'Discovered',    rP:'Misterioso',    rE:'Mysterious'    },
  { id: 53, t:10, lP:'Micro',          lE:'Small-scale',   rP:'Cósmico',       rE:'Cosmic'        },
  { id: 54, t:10, lP:'Real',           lE:'Real',          rP:'Ficção',        rE:'Fiction'       },
  // 11 — Pop Culture
  { id: 55, t:11, lP:'Cult',           lE:'Cult',          rP:'Mainstream',    rE:'Mainstream'    },
  { id: 56, t:11, lP:'Nostálgico',     lE:'Nostalgic',     rP:'Atual',         rE:'Current'       },
  { id: 57, t:11, lP:'Sério',          lE:'Serious',       rP:'Irônico',       rE:'Ironic'        },
  { id: 58, t:11, lP:'Nicho',          lE:'Niche',         rP:'Universal',     rE:'Universal'     },
  { id: 59, t:11, lP:'Underground',    lE:'Underground',   rP:'Viral',         rE:'Viral'         },
  // 12 - Friends & Chaos
  { id: 60, t:12, lP:'Perdoavel',      lE:'Forgivable',    rP:'Imperdoavel',   rE:'Unforgivable'  },
  { id: 61, t:12, lP:'Privado',        lE:'Private',       rP:'Exposto',       rE:'Exposed'       },
  { id: 62, t:12, lP:'Faria sozinho',  lE:'Would do solo', rP:'Chamaria todos',rE:'Invite everyone' },
  { id: 63, t:12, lP:'Vergonha leve',  lE:'Mild shame',    rP:'Vergonha eterna',rE:'Eternal shame' },
  { id: 64, t:12, lP:'Amigo confiavel',lE:'Trustworthy',   rP:'Agente do caos',rE:'Chaos agent'   },
  { id: 65, t:12, lP:'Boa desculpa',   lE:'Good excuse',   rP:'Sem defesa',    rE:'No defense'    },
  { id: 66, t:12, lP:'Mandaria no grupo',lE:'Group chat',  rP:'Apagaria depois',rE:'Delete later'  },
  { id: 67, t:12, lP:'Pouco suspeito', lE:'Barely suspicious', rP:'Muito suspeito', rE:'Very suspicious' },
];

// ── Open (Wavelength-style) Cards — IDs start at 100 ────────────────────────
export const OPEN_CARDS = [
  { id:100, lP:'Subestimado',      lE:'Underrated',       rP:'Superestimado',    rE:'Overrated'        },
  { id:101, lP:'Básico',           lE:'Basic',            rP:'Diferentão',       rE:'Hipster'          },
  { id:102, lP:'Burro',            lE:'Stupid',           rP:'Genial',           rE:'Brilliant'        },
  { id:103, lP:'Inútil',           lE:'Useless',          rP:'Essencial',        rE:'Essential'        },
  { id:104, lP:'Culpa secreta',    lE:'Guilty pleasure',  rP:'Orgulho público',  rE:'Openly love'      },
  { id:105, lP:'Feio de falar',    lE:'Ugly word',        rP:'Bonito de falar',  rE:'Beautiful word'   },
  { id:106, lP:'Faz mal',          lE:'Feels bad',        rP:'Faz bem',          rE:'Feels good'       },
  { id:107, lP:'Perda de tempo',   lE:'Waste of time',    rP:'Bem aproveitado',  rE:'Good use of time' },
  { id:108, lP:'Irrazoável',       lE:'Unreasonable',     rP:'Razoável',         rE:'Reasonable'       },
  { id:109, lP:'Sem arte',         lE:'Not art',          rP:'Arte pura',        rE:'Definitely art'   },
  { id:110, lP:'Fama imerecida',   lE:'Undeserved fame',  rP:'Fama merecida',    rE:'Deserved fame'    },
  { id:111, lP:'Esquecível',       lE:'Forgettable',      rP:'Inesquecível',     rE:'Unforgettable'    },
  { id:112, lP:'Pura sorte',       lE:'Pure luck',        rP:'Pura habilidade',  rE:'Pure skill'       },
  { id:113, lP:'Todo mundo odeia', lE:'Everyone hates',   rP:'Todo mundo ama',   rE:'Everyone loves'   },
  { id:114, lP:'Antiquado',        lE:'Outdated',         rP:'Na moda',          rE:'Trendy'           },
  { id:115, lP:'Infantil',         lE:'Childish',         rP:'Maduro',           rE:'Mature'           },
  { id:116, lP:'Nerd',             lE:'Nerdy',            rP:'Descolado',        rE:'Cool'             },
  { id:117, lP:'Desnecessário',    lE:'Unnecessary',      rP:'Indispensável',    rE:'Indispensable'    },
  { id:118, lP:'Muito específico', lE:'Very niche',       rP:'Todo mundo conhece',rE:'Everyone knows'  },
  { id:119, lP:'Insignificante',   lE:'Insignificant',    rP:'Mudou o mundo',    rE:'Changed the world'},
  { id:120, lP:'Careta',           lE:'Uncool',           rP:'Ousado',           rE:'Daring'           },
  { id:121, lP:'Supersticioso',    lE:'Superstitious',    rP:'Científico',       rE:'Scientific'       },
  { id:122, lP:'Revoltante',       lE:'Revolting',        rP:'Delicioso',        rE:'Delightful'       },
  { id:123, lP:'Pior tarefa',      lE:'Worst chore',      rP:'Melhor tarefa',    rE:'Best chore'       },
  { id:124, lP:'Assustador demais',lE:'Too scary',        rP:'Nem um pouco',     rE:'Not at all scary' },
  { id:125, lP:'Mau hábito',       lE:'Bad habit',        rP:'Bom hábito',       rE:'Good habit'       },
  { id:127, lP:'Impossível',       lE:'Impossible',       rP:'Fácil demais',     rE:'Way too easy'     },
  { id:128, lP:'Introvertido',     lE:'Introverted',      rP:'Extrovertido',     rE:'Extroverted'      },
  { id:129, lP:'Melhor presente',  lE:'Best gift',        rP:'Pior presente',    rE:'Worst gift'       },
  { id:130, lP:'Viciante',         lE:'Addictive',        rP:'Entediante',       rE:'Boring'           },
  { id:131, lP:'Todo mundo tem',   lE:'Everyone has it',  rP:'Quase ninguém tem',rE:'Almost nobody has'},
  { id:132, lP:'Parte do cotidiano',lE:'Everyday thing',  rP:'Uma vez na vida',  rE:'Once in a lifetime'},
  { id:133, lP:'Você faria',       lE:"You'd do it",      rP:'Jamais faria',     rE:"You'd never do it"},
  { id:134, lP:'Faria com qualquer um',lE:'Would do with anyone',rP:'Só com pessoas próximas',rE:'Only with close people'},
  { id:135, lP:'Você evita',       lE:'You avoid it',     rP:'Você busca',       rE:'You seek it'      },
  { id:136, lP:'Raro de encontrar',lE:'Hard to find',     rP:'Todo lugar tem',   rE:'Everywhere'       },
  { id:137, lP:'Pior ano da história',lE:'Worst year ever', rP:'Melhor ano da história',rE:'Best year ever' },
  { id:138, lP:'Impossível de sentar',lE:'Impossible to sit on',rP:'Perfeito para sentar',rE:'Perfect to sit on'},
  { id:139, lP:'Difícil de lembrar',lE:'Hard to remember', rP:'Fácil de lembrar', rE:'Easy to remember' },
  { id:140, lP:'Matéria difícil',   lE:'Hard subject',     rP:'Matéria fácil',    rE:'Easy subject'     },
  { id:141, lP:'Mole',              lE:'Soft',             rP:'Duro',             rE:'Hard'             },
  { id:142, lP:'Irritante',         lE:'Annoying',         rP:'Divertido',        rE:'Fun'              },
  { id:143, lP:'Brincadeira',       lE:'Lighthearted',     rP:'Coisa séria',      rE:'Serious'          },
  { id:144, lP:'Silencioso',        lE:'Silent',           rP:'Barulhento',       rE:'Loud'             },
  { id:145, lP:'Frágil',            lE:'Fragile',          rP:'Inquebrável',      rE:'Unbreakable'      },
  { id:146, lP:'Vergonha alheia',   lE:'Cringe',           rP:'Legal',            rE:'Cool'             },
];

export function selectOpenCards(count, usedIds = []) {
  const usedSet = new Set(usedIds);
  let available = OPEN_CARDS.filter(c => !usedSet.has(c.id));
  if (available.length < count) available = [...OPEN_CARDS];
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export const EMOJI_REACTIONS = ['OK','GG','!!','??','+1'];

export const PLAYER_COLORS = [
  '#ff4655','#00c2ff','#ffb800','#00ff88',
  '#ff00cc','#88ff00','#ff6600','#6600ff',
  '#00ffcc','#ff0066','#ccff00','#0066ff',
];

// ── Utilities ───────────────────────────────────────────────────────────────

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function selectCard(usedIds = []) {
  const usedSet = new Set(usedIds);
  let available = CARDS.filter(c => !usedSet.has(c.id));
  if (!available.length) available = [...CARDS];
  const card  = available[Math.floor(Math.random() * available.length)];
  const theme = THEMES.find(t => t.id === card.t);
  return { theme, card };
}

// Normalize Firebase RTDB response to the shape components expect
export function normalizeRoom(raw) {
  if (!raw) return null;
  const rawPlayers     = Object.values(raw.players || {});
  const players        = raw.phase === 'lobby'
    ? rawPlayers.filter((player) => player.connected !== false || player.isBot)
    : rawPlayers;
  const playerScores   = raw.playerScores || {};
  const playerStreaks  = raw.playerStreaks || {};
  const roundHistory   = Object.values(raw.roundHistory || {});
  const emojiReactions = Object.values(raw.emojiReactions || {}).slice(-15);
  const votes          = raw.votes || {};
  const submittedVotes = Object.keys(votes);
  const teams          = raw.teams ? Object.values(raw.teams) : [];
  const teamState      = raw.teamState || {};
  const teamVotes      = raw.teamVotes || {};
  const teamResults    = raw.teamResults || {};

  return {
    ...raw,
    players,
    playerScores,
    playerStreaks,
    roundHistory,
    emojiReactions,
    votes: ['reveal','gameover'].includes(raw.phase) ? votes : null,
    submittedVotes,
    totalRounds: raw.settings?.rounds ?? 7,
    teams,
    teamState,
    teamVotes,
    teamResults,
    isSurvival: raw.settings?.gameMode === 'survival',
  };
}
