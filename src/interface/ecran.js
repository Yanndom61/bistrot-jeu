/* ecran.js — l'écran de jeu : barre du haut, vitesses, pauses automatiques. */
const UI = B.UI = {
  S: null,                 // la partie en cours
  pauses: {},              // raisons de pause automatique : volet, portrait, accueil, cache…
  selection: null,         // table touchée
  reglages: { pauseAuto: true },
  derniereSauvegarde: null
};

UI.$ = function (id) { return document.getElementById(id); };
UI.esc = function (s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
};

UI.pause = function (raison, oui) {
  if (oui) UI.pauses[raison] = true; else delete UI.pauses[raison];
  UI.majBarre();
};
UI.enPause = function () { return !UI.S || Object.keys(UI.pauses).length > 0 || UI.S.vitesse === 0 || UI.S.finJour; };
UI.vitesseReelle = function () { return UI.enPause() ? 0 : UI.S.vitesse; };

UI.initBarre = function () {
  const zone = UI.$('vitesses');
  zone.setAttribute('aria-label', B.t('aria_vitesse'));
  zone.innerHTML = B.DATA.regles.vitesses.map(function (v) {
    const lib = v === 0 ? B.t('btn_pause') : B.t('btn_' + v + 'x');
    return '<button type="button" data-v="' + v + '">' + UI.esc(lib) + '</button>';
  }).join('');
  zone.addEventListener('click', function (e) {
    const b = e.target.closest('button[data-v]');
    if (!b || !UI.S) return;
    UI.S.vitesse = +b.dataset.v;
    UI.majBarre();
  });
  UI.$('btn-journal').textContent = B.t('btn_journal');
  UI.$('btn-menu').textContent = B.t('btn_menu');
  UI.$('btn-journal').addEventListener('click', function () { UI.ouvrirVolet('journal'); });
  UI.$('btn-menu').addEventListener('click', function () { UI.ouvrirVolet('menu'); });
};

UI.majBarre = function () {
  const S = UI.S;
  if (!S) return;
  UI.$('b-nom').textContent = S.nom;
  UI.$('b-lieu').textContent = B.lieu(S.lieu).nom;
  let h = B.t('barre_jour_heure', { jour: S.jour, heure: B.heure(S.minute) });
  if (UI.enPause()) h += ' · ' + B.t('barre_en_pause');
  UI.$('b-heure').textContent = h;
  UI.$('b-argent').textContent = B.euros(S.argent);
  UI.$('vitesses').querySelectorAll('button').forEach(function (b) {
    const actif = +b.dataset.v === S.vitesse;
    b.classList.toggle('actif', actif);
    b.setAttribute('aria-pressed', actif ? 'true' : 'false');
  });
};

/* Panneau de droite, en bas : le détail de la table touchée, ou un résumé de la salle. */
UI.majDetail = function () {
  const S = UI.S, el = UI.$('detail');
  if (!S) return;
  let html = '';
  const sel = UI.selection && B.salle.tableDe(S, UI.selection);
  if (sel) {
    const g = sel.groupe && S.groupes.find(function (x) { return x.id === sel.groupe; });
    const ids = g ? g.tables : [sel.id];
    html += '<b>' + UI.esc(B.t('detail_table', { num: B.salle.nomTables(ids) })) + '</b>';
    if (g) {
      const taille = g.taille === 1 ? B.t('pers_1') : B.t('pers_n', { n: g.taille });
      html += '<div>' + UI.esc(B.t('detail_groupe', { taille: taille, groupe: B.t('groupe_' + g.type, { nom: g.nom }) })) + '</div>';
      html += '<div>' + UI.esc(B.t('etat_long_' + g.etat)) + '</div>';
      const min = Math.floor(S.minute - g.depuis);
      const attend = ['commande', 'pret', 'addition', 'cuisine'].indexOf(g.etat) >= 0;
      html += '<div class="' + UI.classeAttente(g) + '">' + UI.esc(B.t(attend ? 'detail_attend' : 'detail_depuis', { min: min })) + '</div>';
    } else if (sel.sale) {
      html += '<div>' + UI.esc(B.t('detail_a_debarrasser')) + '</div>';
    } else {
      html += '<div>' + UI.esc(B.t('detail_libre', { places: sel.places })) + '</div>';
    }
  } else {
    let enSalle = 0, file = 0;
    S.groupes.forEach(function (g) {
      if (g.etat === 'file') file++;
      else if (g.etat !== 'repart' && g.etat !== 'depart') enSalle += g.taille;
    });
    html += '<div class="aide">' + UI.esc(B.t('detail_aucune')) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_en_salle', { n: enSalle })) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_file', { n: file })) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_servis', { n: S.stats.jour.servis })) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_repartis', { n: S.stats.jour.repartis })) + '</div>';
  }
  if (el._html !== html) { el.innerHTML = html; el._html = html; }
};

UI.classeAttente = function (g) {
  const A = B.DATA.clients.alertes;
  if (['commande', 'pret', 'addition'].indexOf(g.etat) < 0) return 'neutre';
  const m = UI.S.minute - g.depuis;
  return m >= A.attenteRouge ? 'rouge' : m >= A.attenteOrange ? 'orange' : 'vert';
};
