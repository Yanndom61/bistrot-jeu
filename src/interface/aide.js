/* aide.js — v0.9 (étape 7) : le guide pas à pas d'une nouvelle partie, l'écran d'aide et les objectifs.
   Le guide n'est lancé que pour une partie créée depuis « Nouvelle partie » (S.tuto) : les parties en cours n'y sont jamais forcées. */

/* ---------- Guide pas à pas ---------- */
UI.TUTO = [
  { cible: null }, { cible: 'vitesses' }, { cible: 'btn-equipe' }, { cible: 'salle-zone' }, { cible: 'btn-carte' },
  { cible: 'btn-stocks' }, { cible: 'btn-argent' }, { cible: 'btn-calendrier' }, { cible: 'btn-journal btn-menu' }, { cible: null }
];
UI.tutoActif = function () { return !!(UI.S && UI.S.tuto && !UI.S.tuto.fini); };

UI.lancerTuto = function () {
  if (!UI.S) return;
  UI.S.tuto = { etape: 0 };
  UI.montrerTuto();
};

UI.cacherCibles = function () { document.querySelectorAll('.tuto-cible').forEach(function (e) { e.classList.remove('tuto-cible'); }); };

UI.montrerTuto = function () {
  const S = UI.S, el = UI.$('tuto');
  if (!UI.tutoActif()) { UI.fermerTuto(); return; }
  const n = Math.max(0, Math.min(UI.TUTO.length - 1, S.tuto.etape | 0)), E = UI.TUTO[n], dernier = n === UI.TUTO.length - 1;
  S.tuto.etape = n;
  if (UI.voletOuvert) UI.fermerVolet();
  UI.pause('tuto', true);
  UI.cacherCibles();
  const c = B.objectifs.courant(S);
  let h = '<div class="carte-tuto" role="dialog" aria-live="polite"><p class="tuto-etape">' + UI.esc(B.t('tuto_etape', { n: n + 1, sur: UI.TUTO.length })) + '</p>';
  h += '<h2>' + UI.esc(B.t('tuto_' + n + '_titre')) + '</h2>';
  h += '<p class="tuto-texte">' + UI.esc(B.t('tuto_' + n + '_texte', { objectif: c ? B.t('obj_' + c.id) : '' })) + '</p>';
  h += '<div class="rang">';
  if (n > 0) h += '<button type="button" class="gros" data-tuto="retour">' + UI.esc(B.t('tuto_retour')) + '</button>';
  h += '<button type="button" class="gros principal" data-tuto="suivant">' + UI.esc(B.t(dernier ? 'tuto_fin' : 'tuto_suivant')) + '</button></div>';
  if (!dernier) h += '<button type="button" class="gros discret" data-tuto="passer">' + UI.esc(B.t('tuto_passer')) + '</button>';
  el.innerHTML = h + '</div>';
  el.hidden = false;
  el.className = '';
  const cibles = (E.cible || '').split(' ').filter(Boolean).map(UI.$).filter(Boolean);
  cibles.forEach(function (x) { x.classList.add('tuto-cible'); });
  el.classList.toggle('sans-cible', !cibles.length);
  /* la carte se met là où elle ne cache pas le bouton montré */
  if (cibles.length) {
    const r = cibles[0].getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    if (r.height > H * 0.5) el.classList.add(r.left + r.width / 2 < W / 2 ? 'a-droite' : 'a-gauche');
    else if (r.top < H / 3) el.classList.add('en-bas');
    else if (r.left > W / 2) el.classList.add('a-gauche');
    else el.classList.add('en-haut');
  }
  UI.sauver();
};

UI.fermerTuto = function () {
  const el = UI.$('tuto');
  UI.cacherCibles();
  el.hidden = true; el.innerHTML = '';
  UI.pause('tuto', false);
};

UI.finirTuto = function () {
  const S = UI.S;
  if (S && S.tuto) S.tuto.fini = true;
  UI.fermerTuto();
  UI.sauver();
  if (S && !S.ouvert && !S.faillite) UI.ouvrirVolet('equipe');
};

UI.initTuto = function () {
  UI.$('tuto').addEventListener('click', function (e) {
    const b = e.target.closest('[data-tuto]');
    if (!b || !UI.tutoActif()) return;
    const a = b.dataset.tuto, S = UI.S;
    if (a === 'passer') UI.finirTuto();
    else if (a === 'retour') { S.tuto.etape--; UI.montrerTuto(); }
    else if (S.tuto.etape >= UI.TUTO.length - 1) UI.finirTuto();
    else { S.tuto.etape++; UI.montrerTuto(); }
  });
  window.addEventListener('resize', function () { if (UI.tutoActif() && !UI.$('tuto').hidden) UI.montrerTuto(); });
};

/* ---------- Objectifs ---------- */
UI.texteObjectif = function (S) {
  const c = B.objectifs.courant(S);
  if (!c) return B.t('obj_ligne_tous');
  const a = B.objectifs.avance(S, c);
  return B.t('obj_ligne', { titre: B.t('obj_' + c.id) }) + (a.sur > 1 ? ' · ' + B.t('obj_progression', { n: a.n, sur: a.sur }) : '');
};

/* ---------- Écran d'aide (volet « Aide et objectifs ») ---------- */
UI.SUJETS_AIDE = ['salle', 'carte', 'stocks', 'equipe', 'argent', 'calendrier', 'evenements', 'proprete'];
UI.aideOnglet = 'objectifs';
UI.aideSujet = null;

UI.htmlAide = function () {
  const S = UI.S;
  let h = UI.onglets('data-aide-onglet', [['objectifs', B.t('aide_onglet_objectifs')], ['aide', B.t('aide_onglet_aide')]], UI.aideOnglet);
  h += '<div class="aide-corps">';
  if (UI.aideOnglet === 'objectifs') {
    const E = B.objectifs.etat(S), c = B.objectifs.courant(S), L = B.objectifs.liste();
    h += '<p class="aide-compte">' + UI.esc(B.t('obj_compte', { n: B.objectifs.nbFaits(S), sur: L.length })) + '</p>';
    L.forEach(function (o) {
      const fait = !!E.faits[o.id], encours = c && c.id === o.id, a = B.objectifs.avance(S, o);
      h += '<div class="objectif' + (fait ? ' fait' : encours ? ' en-cours' : '') + '"><b>' + UI.esc(B.t('obj_' + o.id)) + '</b>';
      h += '<span class="etat">' + UI.esc(fait ? B.t('obj_fait', { jour: E.faits[o.id] }) : encours ? B.t('obj_en_cours') + (a.sur > 1 ? ' · ' + B.t('obj_progression', { n: a.n, sur: a.sur }) : '') : B.t('obj_a_faire')) + '</span>';
      if (encours) h += '<span class="comment">' + UI.esc(B.t('obj_' + o.id + '_aide')) + '</span>';
      h += '</div>';
    });
  } else {
    h += '<button type="button" class="gros principal" data-aide="tuto">' + UI.esc(B.t('aide_relancer')) + '</button>';
    h += '<p class="aide-intro">' + UI.esc(B.t('aide_intro')) + '</p>';
    UI.SUJETS_AIDE.forEach(function (s) {
      const ouvert = UI.aideSujet === s;
      h += '<button type="button" class="sujet-aide' + (ouvert ? ' ouvert' : '') + '" data-aide-sujet="' + s + '" aria-expanded="' + ouvert + '">' + UI.esc(B.t('aide_' + s + '_titre')) + '<span>' + (ouvert ? '▲' : '▼') + '</span></button>';
      if (ouvert) h += '<ul class="texte-aide">' + B.t('aide_' + s + '_texte').split('|').map(function (l) { return '<li>' + UI.esc(l) + '</li>'; }).join('') + '</ul>';
    });
  }
  return h + '</div>';
};

UI.rafraichirAide = function (enHaut) {
  if (UI.voletOuvert !== 'aide') return;
  UI.$('volet-titre').textContent = B.t('aide_titre');
  const c = UI.$('volet-corps'), y = c.scrollTop;
  c.innerHTML = UI.htmlAide();
  c.scrollTop = enHaut ? 0 : y;
};

UI.ouvrirAide = function (onglet) {
  UI.aideOnglet = onglet || 'objectifs';
  UI.aideSujet = null;
  UI.ouvrirVolet('aide');
};

UI.initAide = function () {
  UI.initTuto();
  UI.$('volet-corps').addEventListener('click', function (e) {
    if (UI.voletOuvert !== 'aide' || !UI.S) return;
    const o = e.target.closest('[data-aide-onglet]'), s = e.target.closest('[data-aide-sujet]'), t = e.target.closest('[data-aide="tuto"]');
    if (o) { UI.aideOnglet = o.dataset.aideOnglet; UI.aideSujet = null; UI.rafraichirAide(true); }
    else if (s) {
      UI.aideSujet = UI.aideSujet === s.dataset.aideSujet ? null : s.dataset.aideSujet;
      UI.rafraichirAide();
      const b = UI.$('volet-corps').querySelector('.sujet-aide.ouvert');
      if (b) b.scrollIntoView({ block: 'start' });
    }
    else if (t) { UI.fermerVolet(); UI.lancerTuto(); }
  });
  UI.$('detail').addEventListener('click', function (e) { if (e.target.closest('[data-objectif]')) UI.ouvrirAide('objectifs'); });
};
