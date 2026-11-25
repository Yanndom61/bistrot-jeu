/* carte.js (écran) — volet Carte (prix, plats à la carte), fiche d'un plat, et ticket d'une table. */
UI.platCourant = null;   /* id du plat dont la fiche est ouverte */
UI.carteRefus = null;    /* { id, texte } : pourquoi on ne peut pas ajouter / retirer ce plat */
UI.ticketGroupe = null;  /* id du groupe dont on regarde le ticket */

UI.badgesPlat = function (S, d) {
  let h = '';
  if (d.local) h += '<span class="badge local">' + UI.esc(B.t('carte_badge_local')) + '</span>';
  if (B.DATA.carte.faitMaison) h += '<span class="badge fm">' + UI.esc(B.t('carte_badge_fm')) + '</span>';
  if (d.vegetarien) h += '<span class="badge veg">' + UI.esc(B.t('carte_badge_veg')) + '</span>';
  return h;
};

UI.htmlCarte = function () {
  const S = UI.S;
  if (UI.platCourant && B.carte.plat(S, UI.platCourant)) return UI.htmlFichePlat(B.carte.plat(S, UI.platCourant));
  const L = B.DATA.carte.limites;
  let h = '<p class="sous">' + UI.esc(B.t('carte_intro', { e: B.carte.surCarte(S, 'entree').length, p: B.carte.surCarte(S, 'plat').length, d: B.carte.surCarte(S, 'dessert').length,
    me: L.max.entree, mp: L.max.plat, md: L.max.dessert, indice: Math.round(B.carte.indicePrix(S) * 100) })) + '</p>';
  B.carte.CATS.forEach(function (c) {
    h += '<h3>' + UI.esc(B.t('carte_cat_' + c)) + '</h3>';
    B.carte.catalogue(S).filter(function (d) { return d.cat === c; }).forEach(function (d) {
      const p = S.carte.plats[d.id], m = B.carte.marge(S, d.id), conseille = B.carte.prixConseille(S, d);
      h += '<div class="plat' + (p.on ? ' on' : '') + '">' +
        '<button type="button" class="plat-nom" data-ca="fiche" data-id="' + d.id + '"><span class="nom">' + UI.esc(d.emoji + ' ' + d.nom) + '</span>' +
        '<span class="sous">' + UI.badgesPlat(S, d) + UI.esc(B.t('carte_ligne_chiffres', { conseille: B.prix(conseille), cout: B.prix(m.cout), pct: m.pct })) + '</span></button>' +
        '<div class="plat-prix"><button type="button" class="petit-btn mini" data-ca="moins" data-id="' + d.id + '" aria-label="' + UI.esc(B.t('carte_moins')) + '">−</button>' +
        '<b>' + UI.esc(B.prix(p.prix)) + '</b>' +
        '<button type="button" class="petit-btn mini" data-ca="plus" data-id="' + d.id + '" aria-label="' + UI.esc(B.t('carte_plus')) + '">+</button></div>' +
        '<button type="button" class="bascule' + (p.on ? ' on' : '') + '" data-ca="basculer" data-id="' + d.id + '">' + UI.esc(B.t(p.on ? 'carte_a_la_carte' : 'carte_pas_a_la_carte')) + '</button></div>';
      if (UI.carteRefus && UI.carteRefus.id === d.id) h += '<div class="refus">' + UI.esc(UI.carteRefus.texte) + '</div>';
    });
  });
  h += '<p class="sous">' + UI.esc(B.t('carte_note_cout')) + '</p>';
  return h;
};

UI.htmlFichePlat = function (d) {
  const S = UI.S, p = S.carte.plats[d.id], m = B.carte.marge(S, d.id), I = B.DATA.catalogue.ingredients;
  let h = '<p class="fiche-badges">' + UI.badgesPlat(S, d) + '<span class="badge">' + UI.esc(B.t('carte_cat1_' + d.cat)) + '</span></p>';
  h += '<div class="offre"><button type="button" class="petit-btn" data-ca="moins" data-id="' + d.id + '">' + UI.esc(B.t('carte_moins_50')) + '</button>' +
    '<b class="gros-prix">' + UI.esc(B.prix(p.prix)) + '</b>' +
    '<button type="button" class="petit-btn" data-ca="plus" data-id="' + d.id + '">' + UI.esc(B.t('carte_plus_50')) + '</button>' +
    '<button type="button" class="bascule' + (p.on ? ' on' : '') + '" data-ca="basculer" data-id="' + d.id + '">' + UI.esc(B.t(p.on ? 'carte_a_la_carte' : 'carte_pas_a_la_carte')) + '</button></div>';
  if (UI.carteRefus && UI.carteRefus.id === d.id) h += '<div class="refus">' + UI.esc(UI.carteRefus.texte) + '</div>';
  h += '<div class="fiche"><span>' + UI.esc(B.t('fiche_conseille')) + '</span><span>' + UI.esc(B.prix(B.carte.prixConseille(S, d))) + '</span>' +
    '<span>' + UI.esc(B.t('fiche_cout')) + '</span><span>' + UI.esc(B.t('fiche_cout_val', { cout: B.prix(m.cout), pct: m.pctCout })) + '</span>' +
    '<span>' + UI.esc(B.t('fiche_marge')) + '</span><span>' + UI.esc(B.t('fiche_marge_val', { marge: B.prix(m.marge), pct: m.pct })) + '</span></div>';
  h += '<h3>' + UI.esc(B.t('fiche_recette')) + '</h3><p>' + Object.keys(d.recette).map(function (k) {
    return UI.esc((d.recette[k] > 1 ? d.recette[k] + ' × ' : '') + (I[k] ? I[k].nom : k));
  }).join(' · ') + '</p>';
  h += '<h3>' + UI.esc(B.t('fiche_allergenes')) + '</h3><p>' + (d.allergenes.length ? UI.esc(d.allergenes.map(function (a) {
    const x = B.DATA.catalogue.allergenes.find(function (y) { return y.id === a; }); return x ? x.nom : a;
  }).join(' · ')) : UI.esc(B.t('fiche_aucun_allergene'))) + '</p>';
  const o = B.carte.origineViande(S, d);
  if (o) h += '<h3>' + UI.esc(B.t('fiche_origine')) + '</h3><p>' + UI.esc(B.t('fiche_origine_val', { origine: o })) + '</p>';
  h += '<h3>' + UI.esc(B.t('fiche_cuisson')) + '</h3><p>';
  if (d.cuisson) {
    const C = B.DATA.carte.cuissons;
    h += UI.esc(B.t('fiche_cuisson_val', { viande: C.nomsViande[d.cuisson], options: C.options[d.cuisson].map(function (x) { return C.noms[x]; }).join(' · ') }));
  } else h += UI.esc(B.t('fiche_pas_de_cuisson'));
  h += '</p>';
  if (B.DATA.carte.faitMaison) h += '<p class="sous">' + UI.esc(B.t('fiche_fait_maison')) + '</p>';
  h += '<button type="button" class="gros" data-ca="retour">' + UI.esc(B.t('carte_retour')) + '</button>';
  return h;
};

/* Ticket d'une table : commande, cuissons, total, et pourboire une fois payé. */
UI.htmlTicket = function (g) {
  const S = UI.S, N = B.DATA.carte.cuissons.noms;
  let h = '<div class="ticket"><p class="t-tete">' + UI.esc(B.t('ticket_tete', { nom: S.nom, table: B.salle.nomTables(g.tables || []), n: g.taille })) + '</p>';
  (g.commande || []).forEach(function (l) {
    h += '<div class="t-ligne"><span>' + UI.esc(l.nom + (l.cuisson ? ' (' + N[l.cuisson].toLowerCase() + ')' : '')) + '</span><b>' + UI.esc(B.prix(l.prix)) + '</b></div>';
    if (l.renvoye) h += '<div class="t-note">' + UI.esc(B.t('ticket_renvoye', { servie: N[l.servie] ? N[l.servie].toLowerCase() : '' })) + '</div>';
  });
  const total = (g.commande || []).reduce(function (s, l) { return s + l.prix; }, 0);
  h += '<div class="t-ligne t-total"><span>' + UI.esc(B.t('ticket_total')) + '</span><b>' + UI.esc(B.prix(total)) + '</b></div>';
  if (g.paye) h += '<p class="t-pied">' + UI.esc(g.pourboire > 0 ? B.t('ticket_paye_pourboire', { pourboire: B.prix(g.pourboire) }) : B.t('ticket_paye')) + '</p>';
  else h += '<p class="t-pied">' + UI.esc(B.t('ticket_a_payer')) + '</p>';
  return h + '</div>';
};

UI.rafraichirCarte = function (enHaut) {
  if (UI.voletOuvert !== 'carte') return;
  const d = UI.platCourant && B.carte.plat(UI.S, UI.platCourant);
  UI.$('volet-titre').textContent = d ? d.emoji + ' ' + d.nom : B.t('carte_titre');
  const corps = UI.$('volet-corps'), y = corps.scrollTop;
  corps.innerHTML = UI.htmlCarte();
  corps.scrollTop = enHaut ? 0 : y;
};

UI.ouvrirTicket = function (gid) {
  const g = UI.S.groupes.find(function (x) { return x.id === gid; });
  if (!g || !g.commande) return;
  UI.ticketGroupe = gid;
  UI.ouvrirVolet('ticket');
};

UI.initCarte = function () {
  UI.$('volet-corps').addEventListener('click', function (e) {
    const b = e.target.closest('[data-ca]');
    if (!b || !UI.S || b.disabled) return;
    const S = UI.S, a = b.dataset.ca, id = b.dataset.id;
    if (a === 'fiche') { UI.platCourant = id; UI.carteRefus = null; UI.rafraichirCarte(true); return; }
    if (a === 'retour') { UI.platCourant = null; UI.carteRefus = null; UI.rafraichirCarte(true); return; }
    if (a === 'moins' || a === 'plus') { B.carte.changerPrix(S, id, a === 'plus' ? 1 : -1); UI.carteRefus = null; }
    if (a === 'basculer') {
      const non = B.carte.basculer(S, id);
      UI.carteRefus = non ? { id: id, texte: B.t(non) } : null;
    }
    UI.sauver(); UI.rafraichirCarte();
  });
  UI.$('detail').addEventListener('click', function (e) {
    const b = e.target.closest('[data-ticket]');
    if (b && UI.S) UI.ouvrirTicket(+b.dataset.ticket);
  });
};
