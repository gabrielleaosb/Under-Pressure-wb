import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';

export default function Lobby({ gameState, myId, lang, setLang, send, isHost }) {
  const { code, players, teams, settings } = gameState;
  const [copied, setCopied] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [editName, setEditName] = useState('');

  const me = players.find(p => p.id === myId);

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    playClick();
  };

  const canStart = () => {
    const t0 = players.filter(p => p.teamIndex === 0).length;
    const t1 = players.filter(p => p.teamIndex === 1).length;
    return t0 >= 2 && t1 >= 2;
  };

  const unassigned = players.filter(p => p.teamIndex === null);
  const team0 = players.filter(p => p.teamIndex === 0);
  const team1 = players.filter(p => p.teamIndex === 1);

  const startEditTeam = (idx) => { playClick(); setEditTeam(idx); setEditName(teams[idx].name); };
  const saveTeamName = () => {
    if (editName.trim()) send('rename_team', { teamIndex: editTeam, name: editName.trim() });
    setEditTeam(null);
  };

  // Allow any player to move themselves; host can move anyone
  const moveSelf = (teamIndex) => {
    playJoin();
    send('assign_team', { targetPlayerId: myId, teamIndex });
  };
  const movePlayer = (targetId, teamIndex) => {
    playClick();
    send('assign_team', { targetPlayerId: targetId, teamIndex });
  };

  // Read room from URL on mount
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('room')) {
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  return (
    <div className="screen" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 16, paddingBottom: 40 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <h1 className="pixel-title" style={{ fontSize: 'clamp(9px,3vw,14px)', color: 'var(--cyan)' }}>
            {t('lobby_title', lang)}
          </h1>
          <div className="flex gap-8 items-center">
            {['pt','en'].map(l => (
              <button key={l} className={`btn btn-sm ${lang===l?'btn-cyan':'btn-ghost'}`}
                onClick={() => { playClick(); setLang(l); }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Room code */}
        <div className="pixel-box p-16 mb-16">
          <div className="flex items-center justify-between gap-12" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="pixel-title" style={{ fontSize: 7, color: 'var(--dim)', marginBottom: 6 }}>{t('room_code', lang)}</div>
              <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 'clamp(20px,6vw,36px)', color: 'var(--yellow)', textShadow: '0 0 16px var(--yellow)', letterSpacing: 8 }}>
                {code}
              </div>
            </div>
            <button className={`btn ${copied ? 'btn-green' : 'btn-yellow'}`} onClick={copyLink}>
              {copied ? '✓ ' + t('copied', lang) : '🔗 ' + t('copy_link', lang)}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── My team selection (self-service) ── */}
          <div className="pixel-box-yellow p-16">
            <div className="pixel-title mb-12" style={{ fontSize: 8, color: 'var(--dim)' }}>
              {lang === 'pt' ? 'SUA EQUIPE' : 'YOUR TEAM'}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="avatar" style={{ color: me?.color, background: `${me?.color}22`, width: 40, height: 40, fontSize: 9 }}>
                {me?.name?.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: 15 }}>{me?.name}</span>
              <div style={{ flex: 1 }} />
              <button
                className={`btn btn-sm ${me?.teamIndex === 0 ? 'btn-red' : 'btn-ghost'}`}
                style={{ borderColor: teams[0].color, color: me?.teamIndex === 0 ? '#fff' : teams[0].color,
                         background: me?.teamIndex === 0 ? `${teams[0].color}33` : 'transparent' }}
                onClick={() => moveSelf(me?.teamIndex === 0 ? null : 0)}
              >
                {me?.teamIndex === 0 ? '✓ ' : ''}{teams[0].name}
              </button>
              <button
                className={`btn btn-sm ${me?.teamIndex === 1 ? 'btn-cyan' : 'btn-ghost'}`}
                style={{ borderColor: teams[1].color, color: me?.teamIndex === 1 ? '#fff' : teams[1].color,
                         background: me?.teamIndex === 1 ? `${teams[1].color}33` : 'transparent' }}
                onClick={() => moveSelf(me?.teamIndex === 1 ? null : 1)}
              >
                {me?.teamIndex === 1 ? '✓ ' : ''}{teams[1].name}
              </button>
            </div>
          </div>

          {/* ── Team columns ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[0, 1].map(tIdx => {
              const teamPlayers = tIdx === 0 ? team0 : team1;
              const color = tIdx === 0 ? 'var(--team0)' : 'var(--team1)';
              return (
                <div key={tIdx} className="pixel-box p-12">
                  {/* Team header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, borderBottom: `2px solid ${color}`, paddingBottom: 8 }}>
                    {editTeam === tIdx && isHost ? (
                      <div className="flex gap-4 w-full items-center">
                        <input
                          className="pixel-input"
                          value={editName}
                          onChange={e => setEditName(e.target.value.slice(0, 30))}
                          onKeyDown={e => e.key === 'Enter' && saveTeamName()}
                          style={{ fontSize: 14, padding: '4px 8px', flex: 1 }}
                          autoFocus
                        />
                        <button className="btn btn-green btn-sm" onClick={saveTeamName}>✓</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontFamily: 'var(--f-pixel)', fontSize: 7, color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tIdx === 0 ? '🔴' : '🔵'} {teams[tIdx].name}
                        </span>
                        <span style={{ fontFamily: 'var(--f-vt)', fontSize: 18, color: 'var(--dim)' }}>
                          {teamPlayers.length}
                        </span>
                        {isHost && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 7, padding: '2px 6px', minHeight: 24 }}
                            onClick={() => startEditTeam(tIdx)}>✏</button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Players in team */}
                  <div className="flex-col gap-4">
                    {teamPlayers.map(p => (
                      <div key={p.id} className="player-row" style={{ borderColor: p.id === myId ? color : undefined }}>
                        <div className="avatar" style={{ color: p.color, background: `${p.color}22`, width: 34, height: 34, fontSize: 8 }}>
                          {p.name.slice(0, 2).toUpperCase()}
                          {!p.connected && <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 8 }}>💤</span>}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                            {p.id === myId && <span className="tag tag-cyan" style={{ marginLeft: 4, fontSize: 5 }}>YOU</span>}
                          </div>
                          {p.isHost && <span className="tag tag-yellow" style={{ fontSize: 5 }}>CAPTAIN</span>}
                        </div>
                        {/* Host can remove others from team */}
                        {isHost && p.id !== myId && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 6, padding: '2px 6px', minHeight: 24, color: 'var(--dim)' }}
                            onClick={() => movePlayer(p.id, null)}>✕</button>
                        )}
                      </div>
                    ))}
                    {teamPlayers.length === 0 && (
                      <div style={{ fontFamily: 'var(--f-vt)', fontSize: 18, color: 'var(--dim)', textAlign: 'center', padding: '6px 0' }}>
                        {lang === 'pt' ? 'Vazio' : 'Empty'}
                      </div>
                    )}
                    {teamPlayers.length < 2 && (
                      <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 6, color: 'var(--dim)', textAlign: 'center' }}>
                        {lang === 'pt' ? `(mín. 2)` : `(min. 2)`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Unassigned players ── */}
          {unassigned.length > 0 && (
            <div className="pixel-box p-12">
              <div className="pixel-title mb-8" style={{ fontSize: 7, color: 'var(--dim)' }}>
                {t('unassigned', lang)} ({unassigned.length})
              </div>
              <div className="flex-col gap-4">
                {unassigned.map(p => (
                  <div key={p.id} className="player-row">
                    <div className="avatar" style={{ color: p.color, background: `${p.color}22`, width: 34, height: 34, fontSize: 8 }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontFamily: 'var(--f-body)', fontSize: 13 }}>
                      {p.name}
                      {p.id === myId && <span className="tag tag-cyan" style={{ marginLeft: 6, fontSize: 5 }}>YOU</span>}
                    </span>
                    {/* Host can move others */}
                    {isHost && p.id !== myId && (
                      <div className="flex gap-4">
                        {[0, 1].map(ti => (
                          <button key={ti} className="btn btn-ghost btn-sm"
                            style={{ fontSize: 6, borderColor: ti === 0 ? 'var(--team0)' : 'var(--team1)', color: ti === 0 ? 'var(--team0)' : 'var(--team1)' }}
                            onClick={() => movePlayer(p.id, ti)}>
                            → {ti === 0 ? '🔴' : '🔵'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Settings (host only) ── */}
          {isHost && (
            <div className="pixel-box p-16">
              <div className="pixel-title mb-16" style={{ fontSize: 8, color: 'var(--dim)' }}>{t('settings', lang)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <SettingRow label={t('rounds', lang)}     options={[5,10,15]}  value={settings.rounds}
                  onChange={v => { playClick(); send('update_settings', { ...settings, rounds: v }); }} />
                <SettingRow label={t('max_damage', lang)} options={[3,5,7]}    value={settings.maxDamage}
                  onChange={v => { playClick(); send('update_settings', { ...settings, maxDamage: v }); }} />
                <SettingRow label={t('clue_timer', lang)} options={[30,60,90]} value={settings.clueTimer} suffix="s"
                  onChange={v => { playClick(); send('update_settings', { ...settings, clueTimer: v }); }} />
                <SettingRow label={t('vote_timer', lang)} options={[30,60,90]} value={settings.voteTimer} suffix="s"
                  onChange={v => { playClick(); send('update_settings', { ...settings, voteTimer: v }); }} />
              </div>
            </div>
          )}

          {/* ── Start / waiting ── */}
          <div className="text-center">
            {isHost ? (
              <div className="flex-col items-center gap-8">
                <button
                  className="btn btn-green btn-lg"
                  onClick={() => { playClick(); send('start_game'); }}
                  disabled={!canStart()}
                  style={{ opacity: canStart() ? 1 : 0.4 }}
                >
                  🚀 {t('start_mission', lang)}
                </button>
                <span style={{ fontFamily: 'var(--f-pixel)', fontSize: 7, color: 'var(--dim)' }}>
                  {t('min_players_note', lang)}
                </span>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--f-vt)', fontSize: 24, color: 'var(--dim)', letterSpacing: 2 }}>
                📡 {t('waiting_host', lang)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, options, value, onChange, suffix = '' }) {
  return (
    <div>
      <div className="pixel-title mb-8" style={{ fontSize: 7, color: 'var(--dim)' }}>{label}</div>
      <div className="flex gap-4">
        {options.map(o => (
          <button key={o} className={`btn btn-sm ${value === o ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => onChange(o)} style={{ flex: 1, fontSize: 8 }}>
            {o}{suffix}
          </button>
        ))}
      </div>
    </div>
  );
}
