/* carte.js (écran) — volet Carte (prix, plats à la carte), fiche d'un plat, et ticket d'une table. */
UI.platCourant = null;   /* id du plat dont la fiche est ouverte */
UI.carteRefus = null;    /* { id, texte } : pourquoi on ne peut pas ajouter / retirer ce plat */
UI.ticketGroupe = null;  /* id du groupe dont on regarde le ticket */

UI.carteOnglet = 'plats';  /* plats | boissons | mdj */

UI.badgesPlat = function (S, d) {
  let h = '';
  if (S.stocks && S.carte.plats[d.id] && S.carte.plats[d.id].on && !B.carte.disponible(S, d.id)) h += '<span class="badge rouge">' + UI.esc(B.t('carte_badge_rupture')) + '</span>';
  if (d.saison) h += '<span class="badge ' + (B.carte.enSaison(S, d) ? 'veg' : 'gris') + '">' + UI.esc(B.t(B.carte.enSaison(S, d) ? 'carte_badge_saison' : 'carte_badge_hors_saison')) + '</span>';
  if (d.local) h += '<span class="badge local">' + UI.esc(B.t('carte_badge_local')) + '</span>';
  if (d.cat === 'boisson') { if (d.alcool) h += '<span class="badge">' + UI.esc(B.t('carte_badge_alcool')) + '</span>'; return h; }
  if (B.DATA.carte.faitMaison) h += '<span class="badge fm">' + UI.esc(B.t('carte_badge_fm')) + '</span>';
  if (d.vegetarien) h += '<span class="badge veg">' + UI.esc(B.t('carte_badge_veg')) + '</span>';
  return h;
};

UI.lignePlat = function (S, d) {
  const p = S.carte.plats[d.id], m = B.carte.marge(S, d.id), conseille = B.carte.prixConseille(S, d);
  let h = '<div class="plat' + (p.on ? ' on' : '') + '">' +
    '<button type="button" class="plat-nom" data-ca="fiche" data-id="' + d.id + '"><span class="nom">' + UI.esc(d.emoji + ' ' + d.nom) + '</span>' +
    '<span class="sous">' + UI.badgesPlat(S, d) + UI.esc(B.t('carte_ligne_chiffres', { conseille: B.prix(conseille), cout: B.prix(m.cout), pct: m.pct })) + '</span></button>' +
    '<div class="plat-prix"><button type="button" class="petit-btn mini" data-ca="moins" data-id="' + d.id + '" aria-label="' + UI.esc(B.t('carte_moins')) + '">−</button>' +
    '<b>' + UI.esc(B.prix(p.prix)) + '</b>' +
    '<button type="button" class="petit-btn mini" data-ca="plus" data-id="' + d.id + '" aria-label="' + UI.esc(B.t('carte_plus')) + '">+</button></div>' +
    '<button type="button" class="bascule' + (p.on ? ' on' : '') + '" data-ca="basculer" data-id="' + d.id + '">' + UI.esc(B.t(p.on ? 'carte_a_la_carte' : 'carte_pas_a_la_carte')) + '</button></div>';
  if (UI.carteRefus && UI.carteRefus.id === d.id) h += '<div class="refus">' + UI.esc(UI.carteRefus.texte) + '</div>';
  return h;
};
/* Les plats de saison hors de leurs mois ne sont montrés que s'ils sont encore à la carte. */
UI.visibles = function (S, filtre) {
  return B.carte.catalogue(S).filter(function (d) { return filtre(d) && (B.carte.enSaison(S, d) || S.carte.plats[d.id].on); });
};

UI.htmlCarte = function () {
  const S = UI.S;
  if (UI.platCourant && B.carte.plat(S, UI.platCourant)) return UI.htmlFichePlat(B.carte.plat(S, UI.platCourant));
  const L = B.DATA.carte.limites;
  let h = UI.onglets('data-ca-onglet', [['plats', B.t('carte_onglet_plats')], ['boissons', B.t('carte_onglet_boissons')], ['mdj', B.t('carte_onglet_mdj')]], UI.carteOnglet);
  if (UI.carteOnglet === 'mdj') return UI.mdjChoix && S.stocks.mdj ? UI.htmlChoixMdj(UI.mdjChoix) : h + UI.htmlMenuDuJour();
  if (UI.carteOnglet === 'boissons') {
    h += '<p class="sous">' + UI.esc(B.t('carte_intro_boissons', { n: B.carte.surCarte(S, 'boisson').length, max: L.max.boisson })) + '</p>';
    ['apero', 'vin', 'bouteille', 'froid', 'chaud'].forEach(function (ty) {
      const ds = UI.visibles(S, function (d) { return d.cat === 'boisson' && d.type === ty; });
      if (!ds.length) return;
      h += '<h3>' + UI.esc(B.t('carte_type_' + ty)) + '</h3>';
      ds.forEach(function (d) { h += UI.lignePlat(S, d); });
    });
    return h;
  }
  h += '<p class="sous">' + UI.esc(B.t('carte_intro', { e: B.carte.surCarte(S, 'entree').length, p: B.carte.surCarte(S, 'plat').length, d: B.carte.surCarte(S, 'dessert').length,
    me: L.max.entree, mp: L.max.plat, md: L.max.dessert, indice: Math.round(B.carte.indicePrix(S) * 100) })) + '</p>';
  B.carte.CATS.forEach(function (c) {
    h += '<h3>' + UI.esc(B.t('carte_cat_' + c)) + '</h3>';
    UI.visibles(S, function (d) { return d.cat === c; }).forEach(function (d) { h += UI.lignePlat(S, d); });
  });
  h += '<p class="sous">' + UI.esc(B.t('carte_note_cout')) + '</p>';
  return h;
};

UI.mdjChoix = null;   /* place du menu en cours de modification : entree | plat | dessert */
UI.mdjMsg = null;     /* { texte, ok } */

UI.htmlMenuDuJour = function () {
  const S = UI.S, m = S.stocks.mdj, on = S.stocks.mdjOn !== false;
  let h = '<p class="sous">' + UI.esc(B.t('mdj_intro')) + '</p>';
  if (UI.mdjMsg) h += '<div class="refus' + (UI.mdjMsg.ok ? ' ok' : '') + ' gros-texte">' + UI.esc(UI.mdjMsg.texte) + '</div>';
  h += '<div class="ligne-reglage"><span>' + UI.esc(B.t('mdj_actif')) + '</span><button type="button" class="bascule' + (on ? ' on' : '') + '" data-ca="mdj-on">' + UI.esc(B.t(on ? 'menu_oui' : 'menu_non')) + '</button></div>';
  h += '<h3>' + UI.esc(B.t('mdj_du_jour') + ' · ' + B.texteDate(S)) + (B.menuJour.estModifie(S) ? ' <span class="badge orange">' + UI.esc(B.t('mdj_badge_modifie')) + '</span>' : '') + '</h3>';
  if (!m || !m.plat) {
    h += '<p class="gros-texte">' + UI.esc(B.t('mdj_aucun')) + '</p>';
    if (m) h += '<button type="button" class="gros" data-ca="mdj-changer" data-id="plat">' + UI.esc(B.t('mdj_choisir_plat')) + '</button>';
  } else {
    B.menuJour.CATS.forEach(function (c) {
      const d = m[c] && B.menuJour.plat(S, m[c]);
      const r = d ? (m.raisons[d.id] || []).map(function (x) { return B.t(x.cle, x.vars); }).join(' · ') : '';
      const manque = d ? B.stock.manque(S, d.recette) : [];
      h += '<div class="mdj-place"><div class="mdj-texte"><span class="sous">' + UI.esc(B.t('mdj_cat_' + c)) + (m.manuel && m.manuel[c] ? ' · ' + B.t('mdj_choisi_par_toi') : '') + '</span>' +
        '<b class="mdj-nom">' + UI.esc(d ? d.emoji + ' ' + d.nom : B.t('mdj_sans_' + c)) + '</b>' + (r ? '<span class="sous">' + UI.esc(r) + '</span>' : '') +
        (manque.length ? '<span class="alerte-mdj">' + UI.esc(B.t('mdj_alerte_manque', { manque: manque.map(function (i) { return B.stock.ing(i).nom.toLowerCase(); }).join(', ') })) + '</span>' : '') +
        '</div><button type="button" class="petit-btn mdj-btn" data-ca="mdj-changer" data-id="' + c + '">' + UI.esc(B.t('mdj_changer')) + '</button></div>';
    });
    h += '<p class="gros-texte">' + UI.esc(B.t('mdj_restant', { n: m.portions, e: m.emporter, v: m.vendus, ve: m.emporterVendus })) + '</p>';
    if (m.portions + m.emporter <= 0) h += '<div class="alerte">' + UI.esc(B.t('mdj_alerte_epuise')) + '</div>';
  }
  if (m && m.auto && B.menuJour.estModifie(S)) h += '<button type="button" class="gros" data-ca="mdj-auto">' + UI.esc(B.t('mdj_revenir_auto')) + '</button>';
  if (m && m.plat) {
    h += '<h3>' + UI.esc(B.t('mdj_formules')) + '</h3>';
    B.menuJour.formules(S).forEach(function (f) {
      h += '<div class="ligne-st"><span class="gros-texte">' + UI.esc(B.t('mdj_formule_' + f)) + '</span><span class="plat-prix"><button type="button" class="petit-btn mini" data-ca="mdj-moins" data-id="' + f + '" aria-label="' + UI.esc(B.t('carte_moins')) + '">−</button><b>' +
        UI.esc(B.prix(B.menuJour.prixFormule(S, f))) + '</b><button type="button" class="petit-btn mini" data-ca="mdj-plus" data-id="' + f + '" aria-label="' + UI.esc(B.t('carte_plus')) + '">+</button></span></div>';
    });
    if (B.menuJour.prixModifies(S)) h += '<button type="button" class="gros" data-ca="mdj-prix-auto">' + UI.esc(B.t('mdj_prix_conseilles', { ep: B.prix(B.menuJour.prixConseilles(S).ep), epd: B.prix(B.menuJour.prixConseilles(S).epd) })) + '</button>';
  }
  const pl = S.stocks.planMdj;
  if (pl && pl.jour === S.jour + 1) {
    h += '<h3>' + UI.esc(B.t('mdj_demain')) + '</h3><p>' + B.menuJour.CATS.map(function (c) { const d = pl[c] && B.menuJour.plat(S, pl[c]); return d ? UI.esc(d.emoji + ' ' + d.nom) : ''; }).filter(Boolean).join(' · ') + '</p>';
  }
  return h;
};

/* Écran de modification d'une place du menu : les plats faisables d'abord, ceux qui manquent d'ingrédients grisés avec la raison. */
UI.htmlChoixMdj = function (cat) {
  const S = UI.S, M = B.DATA.stocks.menuDuJour, L = B.menuJour.choix(S, cat);
  let h = '<button type="button" class="gros" data-ca="mdj-retour">' + UI.esc(B.t('mdj_retour')) + '</button>';
  h += '<p class="gros-texte">' + UI.esc(B.t('mdj_choix_intro_' + cat, { min: M.minPortions })) + '</p>';
  if (UI.mdjMsg) h += '<div class="refus gros-texte">' + UI.esc(UI.mdjMsg.texte) + '</div>';
  if (cat !== 'plat') {
    const actuel = !S.stocks.mdj[cat];
    h += '<button type="button" class="mdj-choix' + (actuel ? ' actuel' : '') + '" data-ca="mdj-prendre" data-cat="' + cat + '" data-id=""><b>' + UI.esc(B.t('mdj_sans_' + cat)) + '</b>' +
      '<span>' + UI.esc(B.t('mdj_sans_aide_' + cat)) + '</span></button>';
  }
  L.forEach(function (x) {
    const etat = x.actuel ? B.t('mdj_etat_actuel') : x.propose ? B.t('mdj_etat_propose') : '';
    let info;
    if (!x.faisable) info = B.t('mdj_choix_impossible', { manque: x.manque.map(function (i) { return B.stock.ing(i).nom.toLowerCase(); }).join(', ') });
    else if (!x.assez) info = B.t('mdj_choix_peu', { n: x.n, manque: x.manque.map(function (i) { return B.stock.ing(i).nom.toLowerCase(); }).join(', ') });
    else info = B.t('mdj_choix_ok', { n: Math.min(x.n, M.portionsSurPlace + M.portionsEmporter) });
    h += '<button type="button" class="mdj-choix' + (x.actuel ? ' actuel' : '') + (x.faisable ? (x.assez ? '' : ' peu') : ' impossible') + '" data-ca="mdj-prendre" data-cat="' + cat + '" data-id="' + x.d.id + '"' + (x.faisable ? '' : ' aria-disabled="true"') + '>' +
      '<b>' + UI.esc(x.d.emoji + ' ' + x.d.nom) + (etat ? ' <span class="badge">' + UI.esc(etat) + '</span>' : '') + '</b><span>' + UI.esc(info) + '</span></button>';
  });
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
    const inclus = l.mdj && l.cat !== 'menu';
    h += '<div class="t-ligne' + (inclus ? ' t-inclus' : '') + '"><span>' + UI.esc((inclus ? '· ' : '') + l.nom + (l.cuisson ? ' (' + N[l.cuisson].toLowerCase() + ')' : '')) + '</span><b>' + UI.esc(inclus ? B.t('ticket_mdj_inclus') : B.prix(l.prix)) + '</b></div>';
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
  UI.$('volet-titre').textContent = d ? d.emoji + ' ' + d.nom : UI.carteOnglet === 'mdj' && UI.mdjChoix ? B.t('mdj_titre_choix_' + UI.mdjChoix) : B.t('carte_titre');
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
    const o = e.target.closest('[data-ca-onglet]');
    if (o && UI.voletOuvert === 'carte') { UI.carteOnglet = o.dataset.caOnglet; UI.platCourant = null; UI.carteRefus = null; UI.mdjChoix = null; UI.mdjMsg = null; UI.rafraichirCarte(true); return; }
    const b = e.target.closest('[data-ca]');
    if (!b || !UI.S || b.disabled) return;
    const S = UI.S, a = b.dataset.ca, id = b.dataset.id;
    if (a === 'mdj-changer') { UI.mdjChoix = id; UI.mdjMsg = null; UI.rafraichirCarte(true); return; }
    if (a === 'mdj-retour') { UI.mdjChoix = null; UI.mdjMsg = null; UI.rafraichirCarte(true); return; }
    if (a === 'mdj-prendre') {
      const r = B.menuJour.choisir(S, b.dataset.cat, b.dataset.id || null);
      if (r.erreur) { UI.mdjMsg = { texte: B.t(r.erreur, r.vars) }; UI.rafraichirCarte(true); return; }
      const d = b.dataset.id && B.menuJour.plat(S, b.dataset.id);
      UI.mdjChoix = null;
      UI.mdjMsg = { ok: r.portions >= B.DATA.stocks.menuDuJour.minPortions, texte: d ? B.t(r.portions >= B.DATA.stocks.menuDuJour.minPortions ? 'mdj_ok_change' : 'mdj_ok_peu', { plat: d.nom, n: r.portions }) : B.t('mdj_ok_sans_' + b.dataset.cat, { n: r.portions }) };
      UI.sauver(); UI.rafraichirCarte(true); return;
    }
    if (a === 'mdj-auto') { B.menuJour.revenirAuto(S); UI.mdjMsg = { ok: true, texte: B.t('mdj_ok_auto') }; UI.sauver(); UI.rafraichirCarte(true); return; }
    if (a === 'mdj-prix-auto') { B.menuJour.prixConseillesRemettre(S); UI.sauver(); UI.rafraichirCarte(); return; }
    if (a === 'mdj-on') { S.stocks.mdjOn = S.stocks.mdjOn === false; UI.sauver(); UI.rafraichirCarte(); return; }
    if (a === 'mdj-plus' || a === 'mdj-moins') { B.menuJour.changerPrix(S, id, a === 'mdj-plus' ? 1 : -1); UI.sauver(); UI.rafraichirCarte(); return; }
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
