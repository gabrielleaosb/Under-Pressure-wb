import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';

export default function Lobby({ gameState, myId, lang, setLang, send, isHost, onSettings }) {
  const { code, players, teams, settings } = gameState;
  const [copied,   setCopied]   = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [editName, setEditName] = useState('');

  const me      = players.find(p => p.id === myId);
  const team0   = players.filter(p => p.teamIndex === 0);
  const team1   = players.filter(p => p.teamIndex === 1);
  const unassigned = players.filter(p => p.teamIndex === null);

  const canStart = () => {
    const hasBots = players.some(p => p.isBot);
    const min = hasBots ? 1 : 2;
    return team0.length >= min && team1.length >= min;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?room=${code}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    playClick();
  };

  const moveSelf = (ti) => { playJoin(); send('assign_team', { targetPlayerId: myId, teamIndex: ti }); };
  const moveOther = (pid, ti) => { playClick(); send('assign_team', { targetPlayerId: pid, teamIndex: ti }); };

  const startEdit = (idx) => { playClick(); setEditTeam(idx); setEditName(teams[idx].name); };
  const saveEdit  = () => {
    if (editName.trim()) send('rename_team', { teamIndex: editTeam, name: editName.trim() });
    setEditTeam(null);
  };

  const TEAM_COLORS = ['var(--team0)', 'var(--team1)'];
  const TEAM_BG     = ['rgba(255,51,85,0.08)', 'rgba(0,180,255,0.08)'];
  const TEAM_BORDER = ['rgba(255,51,85,0.4)',  'rgba(0,180,255,0.4)'];

  return (
    <div className="screen" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 16, paddingBottom: 80 }}>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 8 }}>
          <h1 className="pixel-title" style={{ fontSize: 'clamp(11px,3vw,15px)', color: 'var(--cyan)' }}>
            UNDER PRESSURE
          </h1>
          <div className="flex gap-8 items-center">
            {['pt','en'].map(l => (
              <button key={l} className={`btn btn-sm ${lang===l?'btn-cyan':'btn-ghost'}`}
                onClick={() => { playClick(); setLang(l); }}>{l.toUpperCase()}</button>
            ))}
            <button
              onClick={() => { playClick(); onSettings?.(); }}
              style={{
                background:'rgba(255,255,255,0.05)', border:'1px solid var(--dim)', color:'var(--dim2)',
                borderRadius:6, width:36, height:36, fontSize:16,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >⚙</button>
          </div>
        </div>

        {/* Room code + copy */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          padding: '14px 20px', borderRadius: 8,
          border: '2px solid rgba(255,224,0,0.4)', background: 'rgba(255,224,0,0.05)',
          marginBottom: 20,
        }}>
          <div>
            <div className="label mb-4" style={{ color: 'var(--dim2)' }}>{t('room_code', lang)}</div>
            <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 'clamp(18px,5vw,28px)', color: 'var(--yellow)', letterSpacing: 8, textShadow: '0 0 16px var(--yellow)' }}>
              {code}
            </div>
          </div>
          <button className={`btn ${copied ? 'btn-green' : 'btn-yellow'}`} onClick={copyLink}>
            {copied ? '✓ ' + t('copied', lang) : '🔗 ' + t('copy_link', lang)}
          </button>
        </div>

        {/* MY TEAM CHOICE — always visible */}
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 8, border: '2px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.04)' }}>
          <div className="label mb-12" style={{ color: 'var(--dim2)' }}>
            {lang === 'pt' ? 'SUA EQUIPE' : 'YOUR TEAM'}
          </div>
          <div className="flex items-center gap-12" style={{ flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              background: `${me?.color}22`,
              border: `2px solid ${me?.color || 'var(--dim)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--f-pixel)', fontSize: 12, color: me?.color,
            }}>
              {me?.name?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 15 }}>{me?.name}</div>
              {isHost && <span className="tag tag-yellow" style={{ marginTop: 4, display: 'inline-block' }}>👑 {t('host_badge', lang)}</span>}
            </div>
            <div className="flex gap-8" style={{ marginLeft: 'auto', flexWrap: 'wrap' }}>
              {[0, 1].map(ti => (
                <button key={ti}
                  className={`btn ${me?.teamIndex === ti ? (ti===0?'btn-red':'btn-cyan') : 'btn-ghost'}`}
                  onClick={() => moveSelf(me?.teamIndex === ti ? null : ti)}
                  style={{ borderColor: TEAM_COLORS[ti], color: me?.teamIndex === ti ? '#fff' : TEAM_COLORS[ti], background: me?.teamIndex === ti ? `${TEAM_COLORS[ti]}33` : 'transparent', minWidth: 110 }}
                >
                  {me?.teamIndex === ti ? '✓ ' : ''}{teams[ti]?.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TEAM COLUMNS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {[0, 1].map(ti => {
            const teamPlayers = ti === 0 ? team0 : team1;
            const color       = TEAM_COLORS[ti];
            const bg          = TEAM_BG[ti];
            const border      = TEAM_BORDER[ti];
            const hasBots     = players.some(p => p.isBot);
            const minReq      = hasBots ? 1 : 2;
            const ready       = teamPlayers.length >= minReq;

            return (
              <div key={ti} style={{ borderRadius: 10, border: `2px solid ${border}`, background: bg, overflow: 'hidden' }}>
                {/* Team header */}
                <div style={{ padding: '12px 14px', borderBottom: `2px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
                  {editTeam === ti && isHost ? (
                    <div className="flex gap-4 w-full items-center">
                      <input className="pixel-input" value={editName} onChange={e => setEditName(e.target.value.slice(0,30))}
                        onKeyDown={e => e.key==='Enter' && saveEdit()}
                        style={{ fontSize:14, padding:'4px 8px', flex:1 }} autoFocus />
                      <button className="btn btn-green btn-sm" onClick={saveEdit}>✓</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontFamily:'var(--f-body)', fontWeight:900, fontSize:14, color, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {teams[ti]?.name}
                      </span>
                      <span style={{ fontFamily:'var(--f-vt)', fontSize:20, color:'rgba(255,255,255,0.3)' }}>
                        {teamPlayers.length}
                      </span>
                      {isHost && (
                        <button onClick={() => startEdit(ti)} style={{ background:'none', border:'none', color:'var(--dim2)', cursor:'pointer', fontSize:14, padding:'2px 4px' }}>✏</button>
                      )}
                    </>
                  )}
                </div>

                {/* Player list */}
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 80 }}>
                  {teamPlayers.length === 0 && (
                    <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--dim2)', textAlign:'center', padding:'16px 0' }}>
                      {lang === 'pt' ? 'Nenhum jogador' : 'No players'}
                    </div>
                  )}
                  {teamPlayers.map(p => (
                    <PlayerCard key={p.id} player={p} myId={myId} isHost={isHost}
                      teamColor={color} lang={lang}
                      onRemove={() => moveOther(p.id, null)}
                    />
                  ))}
                  {/* Status */}
                  {!ready && (
                    <div style={{ fontFamily:'var(--f-body)', fontSize:11, color: 'var(--orange)', textAlign:'center', marginTop:4 }}>
                      ⚠ {lang === 'pt' ? `mín. ${minReq}` : `min. ${minReq}`}
                    </div>
                  )}
                  {ready && (
                    <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--green)', textAlign:'center', marginTop:4 }}>
                      ✓ {lang === 'pt' ? 'pronto' : 'ready'}
                    </div>
                  )}
                </div>

                {/* Host: assign unassigned players to this team */}
                {isHost && unassigned.filter(p => !p.isBot).length > 0 && (
                  <div style={{ padding:'6px 10px', borderTop:`1px solid ${border}`, display:'flex', flexWrap:'wrap', gap:4 }}>
                    {unassigned.filter(p => !p.isBot).map(p => (
                      <button key={p.id} onClick={() => moveOther(p.id, ti)}
                        style={{ background:'none', border:`1px solid ${color}`, color, borderRadius:4, fontSize:11, padding:'3px 8px', cursor:'pointer', fontFamily:'var(--f-body)', fontWeight:700 }}>
                        + {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unassigned (non-bots) */}
        {unassigned.filter(p => !p.isBot).length > 0 && (
          <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:8, border:'1px solid var(--dim)', background:'rgba(255,255,255,0.02)' }}>
            <div className="label mb-8" style={{ color:'var(--dim2)' }}>{t('unassigned', lang)}</div>
            <div className="flex-col gap-6">
              {unassigned.filter(p => !p.isBot).map(p => (
                <PlayerCard key={p.id} player={p} myId={myId} isHost={isHost}
                  teamColor="var(--dim2)" lang={lang}
                  onAssignTeam={ti => moveOther(p.id, ti)}
                  showAssign={isHost}
                  teams={teams}
                />
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        {isHost && (
          <div className="pixel-box p-16 mb-20">
            <div className="label mb-14" style={{ color:'var(--dim2)' }}>{t('settings', lang)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <SettingRow label={t('rounds', lang)}     options={[5,10,15]}  value={settings.rounds}
                onChange={v => send('update_settings', { ...settings, rounds:v })} />
              <SettingRow label={t('max_damage', lang)} options={[3,5,7]}    value={settings.maxDamage}
                onChange={v => send('update_settings', { ...settings, maxDamage:v })} />
              <SettingRow label={t('clue_timer', lang)} options={[30,60,90]} value={settings.clueTimer} suffix="s"
                onChange={v => send('update_settings', { ...settings, clueTimer:v })} />
              <SettingRow label={t('vote_timer', lang)} options={[30,60,90]} value={settings.voteTimer} suffix="s"
                onChange={v => send('update_settings', { ...settings, voteTimer:v })} />
            </div>
          </div>
        )}

        {/* Start / waiting — sticky footer so it's always visible */}
        <div style={{
          position:'sticky', bottom:0,
          background:'linear-gradient(0deg, rgba(5,5,16,1) 70%, transparent 100%)',
          padding:'16px 0 8px',
          textAlign:'center',
        }}>
          {isHost ? (
            <div className="flex-col items-center gap-8">
              <button
                className="btn btn-green btn-lg btn-full"
                onClick={() => { playClick(); send('start_game'); }}
                disabled={!canStart()}
                style={{ opacity: canStart() ? 1 : 0.35, maxWidth:360 }}
              >
                🚀 {t('start_mission', lang)}
              </button>
              {!canStart() && (
                <span style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--dim2)' }}>
                  {t('min_players_note', lang)}
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontFamily:'var(--f-body)', fontSize:15, color:'var(--dim2)', letterSpacing:1, padding:'10px 0' }}>
              📡 {t('waiting_host', lang)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player, myId, isHost, teamColor, lang, onRemove, onAssignTeam, showAssign, teams }) {
  const isMe   = player.id === myId;
  const isBot  = player.isBot;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px', borderRadius: 6,
      border: `1px solid ${isMe ? teamColor : 'rgba(255,255,255,0.08)'}`,
      background: isMe ? `${teamColor}15` : 'rgba(255,255,255,0.025)',
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 6, flexShrink: 0,
        background: `${player.color}20`,
        border: `2px solid ${player.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--f-pixel)', fontSize: 9, color: player.color,
        position: 'relative',
      }}>
        {player.name.slice(0,2).toUpperCase()}
        {!player.connected && !isBot && (
          <span style={{ position:'absolute', top:-5, right:-5, fontSize:10 }}>💤</span>
        )}
      </div>

      {/* Name + badges */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: isBot ? 'var(--dim2)' : 'var(--white)' }}>
          {player.name}
          {isBot && <span style={{ fontFamily:'var(--f-body)', fontSize:10, color:'var(--dim2)', marginLeft:6 }}>BOT</span>}
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:2 }}>
          {isMe   && <span className="tag tag-cyan"   style={{ fontSize:8 }}>{lang==='pt'?'VOCÊ':'YOU'}</span>}
          {player.isHost && <span className="tag tag-yellow" style={{ fontSize:8 }}>👑 {lang==='pt'?'CAPITÃO':'CAPTAIN'}</span>}
        </div>
      </div>

      {/* Assign buttons (host mode) */}
      {showAssign && teams && (
        <div className="flex gap-4">
          {[0,1].map(ti => (
            <button key={ti} onClick={() => onAssignTeam(ti)}
              style={{
                border: `1px solid ${ti===0?'var(--team0)':'var(--team1)'}`,
                color: ti===0?'var(--team0)':'var(--team1)',
                background:'none', borderRadius:4, padding:'3px 8px',
                cursor:'pointer', fontFamily:'var(--f-body)', fontSize:10, fontWeight:700,
              }}>
              {ti===0?'🔴':'🔵'}
            </button>
          ))}
        </div>
      )}

      {/* Remove button */}
      {isHost && onRemove && !isMe && (
        <button onClick={onRemove} style={{ background:'none', border:'none', color:'var(--dim2)', cursor:'pointer', fontSize:14, padding:'2px 4px', flexShrink:0 }}>✕</button>
      )}
    </div>
  );
}

function SettingRow({ label, options, value, onChange, suffix = '' }) {
  return (
    <div>
      <div className="label mb-8" style={{ color:'var(--dim2)' }}>{label}</div>
      <div className="flex gap-4">
        {options.map(o => (
          <button key={o} className={`btn btn-sm ${value===o?'btn-cyan':'btn-ghost'}`}
            onClick={() => { playClick(); onChange(o); }} style={{ flex:1, fontSize:9 }}>
            {o}{suffix}
          </button>
        ))}
      </div>
    </div>
  );
}
