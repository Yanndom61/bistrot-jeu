/* sons.js (v1.0) — des sons simples et doux, fabriqués par le navigateur (comme l'ancien jeu : pas de fichier à charger).
   Coupés au départ (choix prudent : téléphone dans un lieu public, et les navigateurs bloquent le son avant un premier toucher).
   Réglages gardés sur le téléphone : son oui / non, volume de 1 à 10. */
UI.sons = { ctx: null, maitre: null, dernier: {}, vu: null };

UI.sons.debloquer = function () {
  if (!UI.reglages.son) return;
  try {
    if (!UI.sons.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      UI.sons.ctx = new C();
      UI.sons.maitre = UI.sons.ctx.createGain();
      UI.sons.maitre.connect(UI.sons.ctx.destination);
    }
    if (UI.sons.ctx.state !== 'running') UI.sons.ctx.resume();
    UI.sons.maitre.gain.value = UI.reglages.volume / 10;
  } catch (e) { /* pas de son sur cet appareil */ }
};

UI.sons.note = function (f, d, type, v, t0) {
  const c = UI.sons.ctx, t = c.currentTime + (t0 || 0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.07, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(UI.sons.maitre); o.start(t); o.stop(t + d + 0.02);
};

/* Les sons de l'ancien jeu (mêmes notes), sauf « oups », plus doux que le bruit d'erreur d'origine. */
UI.sons.liste = {
  caisse: function (n) { n(1568, 0.1, 'square', 0.02, 0); n(2093, 0.28, 'sine', 0.05, 0.06); },
  evenement: function (n) { n(740, 0.1, 'triangle', 0.07); n(988, 0.1, 'triangle', 0.07, 0.11); n(740, 0.1, 'triangle', 0.07, 0.22); },
  bravo: function (n) { n(523, 0.12, 'triangle', 0.06); n(659, 0.12, 'triangle', 0.06, 0.1); n(784, 0.12, 'triangle', 0.06, 0.2); n(1047, 0.3, 'triangle', 0.07, 0.3); },
  oups: function (n) { n(220, 0.22, 'triangle', 0.06); n(185, 0.3, 'triangle', 0.05, 0.12); },
  ding: function (n) { n(1319, 0.35, 'sine', 0.06); n(1760, 0.5, 'sine', 0.045, 0.08); },
  clic: function (n) { n(700, 0.05, 'sine', 0.04); }
};
UI.sons.jouer = function (nom) {
  if (!UI.reglages.son || !UI.sons.ctx || UI.sons.ctx.state !== 'running') return;
  const now = Date.now(), ecart = nom === 'clic' ? 60 : nom === 'caisse' ? 400 : 250;
  if (UI.sons.dernier[nom] && now - UI.sons.dernier[nom] < ecart) return;
  UI.sons.dernier[nom] = now;
  try { UI.sons.liste[nom](UI.sons.note); } catch (e) { /* tant pis */ }
};

/* Appelé à chaque image : on regarde ce qui a changé dans la partie et on joue le son qui va avec. */
UI.sons.surveiller = function (S) {
  if (!S) { UI.sons.vu = null; return; }
  const st = S.stats.jour;
  const now = { S: S, jour: S.jour, recettes: st.recettes, repartis: st.repartis, attente: S.cal && S.cal.attente ? S.cal.attente.id + ':' + S.cal.attente.minute : '',
    objectifs: S.objectifs ? Object.keys(S.objectifs.faits).length : 0, michelin: !!(S.michelin && S.michelin.etoile), fin: !!S.finJour };
  const v = UI.sons.vu;
  UI.sons.vu = now;
  if (!v || v.S !== S || v.jour !== now.jour) return;
  if (now.michelin && !v.michelin) UI.sons.jouer('bravo');
  else if (now.objectifs > v.objectifs) UI.sons.jouer('bravo');
  else if (now.attente && now.attente !== v.attente) UI.sons.jouer('evenement');
  else if (now.fin && !v.fin) UI.sons.jouer('ding');
  else if (now.repartis > v.repartis) UI.sons.jouer('oups');
  else if (now.recettes > v.recettes) UI.sons.jouer('caisse');
};

UI.htmlReglagesSon = function () {
  const R = UI.reglages;
  let h = '<div class="ligne-reglage"><span>' + UI.esc(B.t('menu_son')) + '</span>' +
    '<button type="button" class="bascule' + (R.son ? ' on' : '') + '" data-action="son">' + UI.esc(B.t(R.son ? 'menu_oui' : 'menu_non')) + '</button></div>';
  h += '<div class="ligne-reglage"><span>' + UI.esc(B.t('menu_volume')) + '</span><span class="volume">' +
    '<button type="button" class="petit-btn gros-mini" data-action="volume" data-pas="-1" aria-label="' + UI.esc(B.t('menu_volume_moins')) + '"' + (R.volume <= 1 ? ' disabled' : '') + '>−</button>' +
    '<b>' + R.volume + ' / 10</b>' +
    '<button type="button" class="petit-btn gros-mini" data-action="volume" data-pas="1" aria-label="' + UI.esc(B.t('menu_volume_plus')) + '"' + (R.volume >= 10 ? ' disabled' : '') + '>+</button></span></div>';
  if (!R.son) h += '<p class="sous">' + UI.esc(B.t('menu_son_note')) + '</p>';
  return h;
};

UI.initSons = function () {
  ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) { document.addEventListener(ev, UI.sons.debloquer, { passive: true }); });
  document.addEventListener('click', function (e) { if (e.target.closest('button')) UI.sons.jouer('clic'); }, true);
};
