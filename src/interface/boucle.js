/* boucle.js — démarrage, écran portrait, fin de journée, et la boucle qui fait vivre la salle. */
UI.initPortrait = function () {
  UI.$('portrait').innerHTML = '<div class="tel"></div><h2>' + UI.esc(B.t('portrait_titre')) + '</h2><p>' + UI.esc(B.t('portrait_texte')) + '</p>';
  const mq = window.matchMedia('(orientation: portrait)');
  const maj = function () { UI.pause('portrait', mq.matches); if (mq.matches) UI.sauver(); };
  if (mq.addEventListener) mq.addEventListener('change', maj); else mq.addListener(maj);
  maj();
};

UI.majFin = function () {
  const S = UI.S, el = UI.$('fin');
  if (!S || !S.finJour || !S.bilan) { el.hidden = true; return; }
  if (!el.hidden) return;
  const b = S.bilan;
  el.innerHTML = '<div class="carte-fin"><h2>' + UI.esc(B.t('fin_titre', { jour: b.jour })) + '</h2><div class="chiffres">' +
    '<div><b>' + b.servis + '</b><span>' + UI.esc(B.t('fin_servis')) + '</span></div>' +
    '<div><b>' + UI.esc(B.euros(b.recettes || 0)) + '</b><span>' + UI.esc(B.t('fin_recettes')) + '</span></div>' +
    '<div><b>' + UI.esc(B.prix(b.ticketMoyen || 0)) + '</b><span>' + UI.esc(B.t('fin_ticket_moyen')) + '</span></div></div>' +
    '<div class="fin-detail">' + [
      B.t('fin_d_repartis', { n: b.repartis }), B.t('fin_d_attente', { n: b.attente }),
      B.t('fin_d_cout', { cout: B.euros(b.coutMatiere || 0) }), B.t('fin_d_marge', { marge: B.euros((b.recettes || 0) - (b.coutMatiere || 0)) }),
      B.t('fin_d_renvois', { n: b.platsRenvoyes || 0 }), B.t('fin_d_pourboires', { total: B.prix(b.pourboires || 0) }),
      b.meilleurPlat ? B.t('fin_d_meilleur', { nom: b.meilleurPlat.nom, n: b.meilleurPlat.n }) : '',
      B.t('fin_d_achats', { total: B.euros(b.achats || 0) }), B.t('fin_d_resultat', { total: B.euros(b.resultat || 0) }),
      B.t('fin_d_gaspillage', { n: b.gaspillagePortions || 0, valeur: B.euros(b.gaspillage || 0) }),
      B.t('fin_d_mdj', { n: b.mdjVendus || 0, e: b.emporter || 0 }), B.t('fin_d_boissons', { n: b.boissons || 0 }),
      B.t('fin_d_ruptures', { n: (b.ruptures || []).length, partis: b.partisRupture || 0 }),
      b.formations ? B.t('fin_d_formations', { total: B.euros(b.formations) }) : '',
      b.proprete ? B.t('fin_d_proprete', { avant: b.proprete.avant, apres: b.proprete.apres }) : '',
      b.partisSale ? B.t('fin_d_partis_sale', { n: b.partisSale }) : '',
      (b.absents || []).length ? B.t('fin_d_absents', { n: b.absents.map(function (x) { return x.nom.split(' ')[0]; }).join(', ') }) : '',
      b.partage ? B.t('fin_d_partage', { total: B.prix(b.partage.total), n: b.partage.n, part: B.prix(b.partage.part) }) : ''
    ].filter(Boolean).map(function (x) { return '<span>' + UI.esc(x) + '</span>'; }).join('') + '</div>' + UI.htmlFinRuptures(b) +
    '<button type="button" class="gros principal" id="fin-suivant">' + UI.esc(B.t('fin_suivant', { jour: b.jour + 1 })) + '</button></div>';
  el.hidden = false;
  UI.sauver();
  UI.$('fin-suivant').addEventListener('click', function () {
    B.jourSuivant(UI.S);
    el.hidden = true;
    UI.sauver();
    UI.majBarre();
    if (!UI.S.ouvert) UI.ouvrirVolet('equipe');
  });
};

UI.htmlFinRuptures = function (b) {
  const R = b.ruptures || [];
  if (!R.length) return '';
  return '<div class="fin-ruptures"><b>' + UI.esc(B.t('fin_ruptures_titre')) + '</b>' + R.slice(0, 4).map(function (r) {
    return '<span>' + UI.esc(r.nom + ' : ' + B.t(r.cause, r.vars)) + '</span>';
  }).join('') + (R.length > 4 ? '<span>…</span>' : '') + '</div>';
};

UI.boucle = function (ts) {
  const dtReel = UI._dernier == null ? 0 : Math.min(250, ts - UI._dernier);
  UI._dernier = ts;
  const S = UI.S;
  if (S) {
    const v = UI.vitesseReelle();
    if (v > 0) {
      B.avancer(S, dtReel / 1000 * v * B.DATA.regles.minutesParSeconde);
      if (UI.derniereSauvegarde == null || S.minute - UI.derniereSauvegarde >= B.DATA.regles.sauvegarde.toutesLesMinutesDeJeu || S.minute < UI.derniereSauvegarde) UI.sauver();
    }
    if (S.finJour) UI.majFin();
    UI.dessin.dynamique();
    if (!UI._tDetail || ts - UI._tDetail > 250) { UI._tDetail = ts; UI.majDetail(); UI.majBarre(); }
  }
  UI.majMessages(Date.now());
  requestAnimationFrame(UI.boucle);
};

UI.init = function () {
  document.title = B.t('jeu_nom') + (B.CANAL === 'test' ? ' (test)' : '');
  UI.chargerReglages();
  UI.initBarre();
  UI.dessin.fond();
  UI.dessin.initTouches();
  UI.initVolets();
  UI.initAccueil();
  UI.initEquipe();
  UI.initCarte();
  UI.initStocks();
  UI.initPlacement();
  UI.initPortrait();
  const r = UI.chargerPartie();
  if (r.partie) { UI.S = r.partie; B.message(UI.S, 'msg_reprise', { nom: UI.S.nom, jour: UI.S.jour }); }
  UI.erreurChargement = r.erreur || null;
  UI.montrerAccueil();
  UI.majBarre();
  UI.majDetail();
  document.addEventListener('visibilitychange', function () {
    UI.pause('cache', document.hidden);
    if (document.hidden) UI.sauver();
  });
  window.addEventListener('pagehide', UI.sauver);
  requestAnimationFrame(UI.boucle);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* hors ligne indisponible, le jeu marche quand même */ });
  }
};

document.addEventListener('DOMContentLoaded', UI.init);
