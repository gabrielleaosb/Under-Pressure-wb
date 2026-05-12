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
];

export const EMOJI_REACTIONS = ['😱','🔥','💀','😂','👏','😮','🤯','💥'];

export const PLAYER_COLORS = [
  '#ff4655','#00c2ff','#ffb800','#00ff88',
  '#ff00cc','#88ff00','#ff6600','#6600ff',
  '#00ffcc','#ff0066','#ccff00','#0066ff',
];

export const TEAM_NAME_PAIRS = [
  ['Galáxia Vermelha', 'Nebulosa Azul'],
  ['Meteoro Carmim',   'Pulsar Ciano'],
  ['Nova Dourada',     'Quasar Prateado'],
  ['Cometa Escarlate', 'Éden Safira'],
];

// ── Utilities ───────────────────────────────────────────────────────────────

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function computeResult(avg, target) {
  const diff = Math.abs(avg - target);
  if (diff <=  5) return { points:3, damage:0, grade:'PERFECT',    gradePT:'PERFEITO!'       };
  if (diff <= 15) return { points:2, damage:0, grade:'VERY CLOSE', gradePT:'MUITO PRÓXIMO!'  };
  if (diff <= 25) return { points:1, damage:1, grade:'CLOSE',      gradePT:'PRÓXIMO!'        };
  if (diff <= 40) return { points:0, damage:1, grade:'REASONABLE', gradePT:'RAZOÁVEL...'     };
  return                 { points:0, damage:2, grade:'FAR',        gradePT:'LONGE!'          };
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
  const players       = Object.values(raw.players || {});
  const teamsRaw      = raw.teams || {};
  const teams         = [teamsRaw['0'] || teamsRaw[0] || {name:'Time 1', color:'#ff3355'},
                         teamsRaw['1'] || teamsRaw[1] || {name:'Time 2', color:'#00aaff'}];
  const damage        = [Number(raw.damage0 ?? 0), Number(raw.damage1 ?? 0)];
  const scores        = [Number(raw.score0  ?? 0), Number(raw.score1  ?? 0)];
  const psychicIndices= [Number(raw.psychicIdx0 ?? 0), Number(raw.psychicIdx1 ?? 0)];
  const roundHistory  = Object.values(raw.roundHistory || {});
  const emojiReactions= Object.values(raw.emojiReactions || {}).slice(-15);
  const votes         = raw.votes || {};
  const submittedVotes= Object.keys(votes);

  return {
    ...raw,
    players, teams, damage, scores, psychicIndices,
    roundHistory, emojiReactions,
    votes: ['reveal','gameover'].includes(raw.phase) ? votes : null,
    submittedVotes,
    totalRounds: raw.settings?.rounds ?? 10,
  };
}
