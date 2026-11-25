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
  UI.$('btn-carte').textContent = B.t('btn_carte');
  UI.$('btn-carte').addEventListener('click', function () { UI.ouvrirVolet('carte'); });
  UI.$('btn-equipe').textContent = B.t('btn_equipe');
  UI.$('btn-equipe').addEventListener('click', function () { UI.ouvrirVolet('equipe'); });
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
  if (!S.ouvert) h += ' · ' + B.t('barre_ferme');
  else if (UI.enPause()) h += ' · ' + B.t('barre_en_pause');
  UI.$('b-heure').textContent = h;
  UI.$('b-argent').textContent = B.euros(S.argent);
  UI.$('b-argent').classList.toggle('negatif', S.argent < 0);
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
  const gFile = UI.groupeChoisi && S.groupes.find(function (g) { return g.id === UI.groupeChoisi && g.etat === 'file'; });
  if (!gFile) UI.groupeChoisi = null;
  if (!S.ouvert) {
    html += '<div class="ferme">' + UI.esc(B.t(S.faillite ? 'msg_faillite' : 'fin_salle_vide')) + '</div>';
  } else if (gFile) {
    const taille = gFile.taille === 1 ? B.t('pers_1') : B.t('pers_n', { n: gFile.taille });
    html += '<div class="choisi">' + UI.esc(B.t('placement_groupe_choisi', { taille: taille, groupe: B.t('groupe_' + gFile.type, { nom: gFile.nom }) })) + '</div>';
  } else if (sel) {
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
      if (g.commande) {
        const total = g.commande.reduce(function (s, l) { return s + l.prix; }, 0);
        html += '<div>' + UI.esc(B.t('detail_addition', { total: B.prix(total), n: g.commande.length })) + '</div>';
        html += '<button type="button" class="petit-btn btn-ticket" data-ticket="' + g.id + '">' + UI.esc(B.t('detail_ticket')) + '</button>';
      }
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
    const aide = S.placement === 'manuel' && S.groupes.some(function (g) { return g.etat === 'file'; }) ? 'placement_aide' : 'detail_aucune';
    html += '<div class="aide">' + UI.esc(B.t(aide)) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_en_salle', { n: enSalle })) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_file', { n: file })) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_servis', { n: S.stats.jour.servis })) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_repartis', { n: S.stats.jour.repartis })) + '</div>';
    html += '<div>' + UI.esc(B.t('detail_recettes', { total: B.euros(S.stats.jour.recettes) })) + '</div>';
  }
  if (el._html !== html) { el.innerHTML = html; el._html = html; }
};

UI.majPlacement = function () {
  const b = UI.$('btn-placement'), S = UI.S;
  if (!S) return;
  const manuel = S.placement === 'manuel';
  b.textContent = B.t(manuel ? 'placement_manuel' : 'placement_auto');
  b.classList.toggle('manuel', manuel);
  b.setAttribute('aria-pressed', manuel ? 'true' : 'false');
};
UI.initPlacement = function () {
  UI.$('btn-placement').addEventListener('click', function () {
    if (!UI.S) return;
    UI.S.placement = UI.S.placement === 'manuel' ? 'auto' : 'manuel';
    UI.groupeChoisi = null;
    UI.majPlacement(); UI.majDetail(); UI.sauver();
  });
};

UI.classeAttente = function (g) {
  const A = B.DATA.clients.alertes;
  if (['commande', 'pret', 'addition'].indexOf(g.etat) < 0) return 'neutre';
  const m = UI.S.minute - g.depuis;
  return m >= A.attenteRouge ? 'rouge' : m >= A.attenteOrange ? 'orange' : 'vert';
};
