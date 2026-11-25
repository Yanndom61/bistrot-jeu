/* stocks.js (écran) — volet Stocks : la réserve (par rangement), passer une commande, réglages (commande automatique, marge).
   Le volet Carte reçoit aussi deux onglets : Boissons et Menu du jour. */
UI.stOnglet = 'reserve';   /* reserve | commander | reglages */
UI.panier = null;          /* { four, lignes: { ingrédient: portions } } */
UI.stMsg = null;           /* résultat de la dernière action (texte) */

UI.onglets = function (attr, liste, actif) {
  return '<div class="onglets">' + liste.map(function (o) {
    return '<button type="button" class="onglet' + (o[0] === actif ? ' actif' : '') + '" ' + attr + '="' + o[0] + '">' + UI.esc(o[1]) + '</button>';
  }).join('') + '</div>';
};
UI.jaugeHtml = function (n, max) {
  const p = Math.min(100, Math.round(n / max * 100));
  return '<span class="jauge"><i style="width:' + p + '%" class="' + (p > 90 ? 'rouge' : p > 70 ? 'orange' : '') + '"></i></span>';
};

UI.htmlStocks = function () {
  const S = UI.S;
  let h = UI.onglets('data-st-onglet', [['reserve', B.t('st_onglet_reserve')], ['commander', B.t('st_onglet_commander')], ['reglages', B.t('st_onglet_reglages')]], UI.stOnglet);
  if (UI.stMsg) h += '<div class="refus' + (UI.stMsg.ok ? ' ok' : '') + '">' + UI.esc(UI.stMsg.texte) + '</div>';
  if (UI.stOnglet === 'commander') return h + UI.htmlCommander();
  if (UI.stOnglet === 'reglages') return h + UI.htmlStReglages();
  return h + UI.htmlReserve();
};

UI.htmlReserve = function () {
  const S = UI.S, R = B.DATA.stocks.rangements, I = B.DATA.stocks.ingredients;
  let h = '<p class="sous">' + UI.esc(B.t('st_reserve_intro', { date: B.texteDate(S), auto: B.t(S.stocks.auto ? 'st_auto_oui' : 'st_auto_non') })) + '</p>';
  /* ruptures du jour */
  const rup = Object.keys(S.stocks.ruptures).map(function (k) { return S.stocks.ruptures[k]; });
  if (rup.length) {
    h += '<h3>' + UI.esc(B.t('st_ruptures')) + '</h3>';
    rup.forEach(function (r) {
      h += '<div class="alerte' + (r.fin != null ? ' finie' : '') + '"><b>' + UI.esc(r.nom) + '</b> · ' + UI.esc(B.t(r.fin != null ? 'st_rupture_finie' : 'st_rupture_en_cours', { debut: B.heure(r.debut), fin: r.fin != null ? B.heure(r.fin) : '', refus: r.refus, manque: r.manque.map(function (i) { return B.stock.ing(i).nom.toLowerCase(); }).join(', ') })) +
        '<br><span class="sous">' + UI.esc(B.t(r.cause, r.vars)) + '</span></div>';
    });
  }
  /* commandes en route */
  if (S.stocks.commandes.length) {
    h += '<h3>' + UI.esc(B.t('st_en_route')) + '</h3>';
    S.stocks.commandes.slice().sort(function (a, b) { return a.arrivee - b.arrivee; }).forEach(function (c) {
      const n = Object.keys(c.lignes).reduce(function (s, i) { return s + c.lignes[i]; }, 0);
      h += '<div class="ligne-st"><span>' + UI.esc(B.DATA.stocks.fournisseurs[c.four].emoji + ' ' + B.stock.nomFournisseur(S, c.four) + (c.auto ? ' · ' + B.t('st_auto_court') : '')) + '</span><span>' +
        UI.esc(B.t('st_route_val', { n: n, total: B.euros(c.cout), heure: B.stock.texteArrivee(S, c.arrivee) })) + '</span></div>';
    });
  }
  const P = B.stock.prevision(S);
  Object.keys(R).forEach(function (r) {
    const occ = B.stock.occupation(S, r);
    h += '<h3>' + UI.esc(R[r].emoji + ' ' + R[r].nom) + ' <span class="sous">· ' + UI.esc(B.t('st_place', { n: Math.round(occ), max: R[r].capacite })) + '</span>' + UI.jaugeHtml(occ, R[r].capacite) + '</h3>';
    const ids = Object.keys(S.stocks.lots).filter(function (i) { return B.stock.info(i).rangement === r && B.stock.quantite(S, i) >= 1; }).sort(function (a, b) { return B.stock.ing(a).nom.localeCompare(B.stock.ing(b).nom); });
    if (!ids.length) { h += '<p class="sous">' + UI.esc(B.t('st_vide')) + '</p>'; return; }
    ids.forEach(function (i) {
      const q = Math.round(B.stock.quantite(S, i)), lot = S.stocks.lots[i][0], ec = Math.round(B.stock.aEcouler(S, i));
      const jours = lot.dlc - S.jour, p = P[i] || 0;
      let badges = '';
      if (ec >= 1) badges += '<span class="badge rouge">' + UI.esc(B.t('st_badge_ecouler', { n: ec })) + '</span>';
      if (p && q < p) badges += '<span class="badge orange">' + UI.esc(B.t('st_badge_bas')) + '</span>';
      if (B.stock.enSaison(S, i)) badges += '<span class="badge veg">' + UI.esc(B.t('st_badge_saison')) + '</span>';
      h += '<div class="ligne-st"><span><b>' + UI.esc(B.stock.ing(i).emoji ? B.stock.ing(i).emoji + ' ' : '') + UI.esc(B.stock.ing(i).nom) + '</b> ' + badges + '<br><span class="sous">' +
        UI.esc(B.t('st_lot', { dlc: jours <= 0 ? B.t('st_dlc_aujourdhui') : jours === 1 ? B.t('st_dlc_demain') : B.t('st_dlc_jours', { n: jours }), prix: B.prix(lot.prix), four: B.stock.nomFournisseur(S, lot.four) })) +
        '</span></span><span class="qte"><b>' + q + '</b><span class="sous">' + UI.esc(p ? B.t('st_par_jour', { n: Math.round(p) }) : '') + '</span></span></div>';
    });
  });
  const b = S.bilan;
  if (b && b.jour === S.jour - 1 || S.stats.jour.gaspillage) h += '<p class="sous">' + UI.esc(B.t('st_gaspillage_matin', { n: S.stats.jour.gaspillagePortions || 0, valeur: B.euros(S.stats.jour.gaspillage || 0) })) + '</p>';
  return h;
};

/* Panier proposé : ce qu'il manque pour tenir jusqu'à la prochaine commande, chez ce fournisseur. */
UI.proposer = function (four) {
  const S = UI.S, b = B.stock.besoins(S), l = {};
  for (const i in b) if (B.stock.fourOk(four, i)) l[i] = Math.ceil(b[i] / 5) * 5;
  return l;
};
UI.totalPanier = function () {
  const S = UI.S, F = B.DATA.stocks.fournisseurs[UI.panier.four];
  let t = 0, n = 0;
  for (const i in UI.panier.lignes) { const q = UI.panier.lignes[i]; if (q > 0) { t += q * B.stock.prixAchat(S, i, UI.panier.four); n += q; } }
  return { total: B.r2(t + (n ? F.frais : 0)), n: n };
};

UI.htmlCommander = function () {
  const S = UI.S, FS = B.DATA.stocks.fournisseurs, R = B.DATA.stocks.rangements;
  if (!UI.panier) UI.panier = { four: S.stocks.habituel, lignes: {} };
  const four = UI.panier.four;
  let h = '<div class="fours">';
  Object.keys(FS).forEach(function (f) {
    const F = FS[f];
    h += '<button type="button" class="four' + (f === four ? ' actif' : '') + '" data-st-four="' + f + '"><b>' + UI.esc(F.emoji + ' ' + B.stock.nomFournisseur(S, f)) + '</b>' +
      '<span class="sous">' + UI.esc(B.t('st_four_val', { type: F.type, delai: B.t('st_delai_' + f), frais: B.euros(F.frais), origine: B.stock.origine(S, f) || '' })) + '</span></button>';
  });
  h += '</div>';
  const off = (S.stocks.offres || []).filter(function (o) { return o.jour === S.jour; });
  if (off.length) h += '<p class="offres">' + UI.esc(B.t('st_offres', { liste: off.map(function (o) { return B.stock.ing(o.ing).nom + ' −' + Math.round(o.remise * 100) + ' % (' + B.stock.nomFournisseur(S, o.four) + ')'; }).join(' · ') })) + '</p>';
  const t = UI.totalPanier();
  h += '<div class="pied-st"><span>' + UI.esc(B.t('st_total', { n: t.n, total: B.euros(t.total), frais: B.euros(FS[four].frais), heure: B.stock.texteArrivee(S, B.maintenant(S) + FS[four].delai) })) + '</span>' +
    '<button type="button" class="gros principal" data-st="commander"' + (t.n ? '' : ' disabled') + '>' + UI.esc(B.t('st_commander')) + '</button></div>';
  h += '<div class="actions-st"><button type="button" class="petit-btn" data-st="proposer">' + UI.esc(B.t('st_proposer')) + '</button>' +
    '<button type="button" class="petit-btn" data-st="vider">' + UI.esc(B.t('st_vider')) + '</button></div>';
  const P = B.stock.prevision(S), ids = Object.keys(B.DATA.stocks.ingredients).filter(function (i) { return P[i] || UI.panier.lignes[i] || B.stock.quantite(S, i) >= 1; });
  Object.keys(R).forEach(function (r) {
    const L = ids.filter(function (i) { return B.stock.info(i).rangement === r; }).sort(function (a, b) { return B.stock.ing(a).nom.localeCompare(B.stock.ing(b).nom); });
    if (!L.length) return;
    h += '<h3>' + UI.esc(R[r].emoji + ' ' + R[r].nom) + ' <span class="sous">· ' + UI.esc(B.t('st_place_libre', { n: Math.floor(B.stock.place(S, r)) })) + '</span></h3>';
    L.forEach(function (i) {
      const ok = B.stock.fourOk(four, i), q = UI.panier.lignes[i] || 0, o = B.stock.offre(S, i, four);
      h += '<div class="ligne-st' + (ok ? '' : ' grise') + '"><span><b>' + UI.esc(B.stock.ing(i).nom) + '</b>' + (o ? ' <span class="badge rouge">−' + Math.round(o * 100) + ' %</span>' : '') +
        '<br><span class="sous">' + UI.esc(ok ? B.t('st_cmd_val', { prix: B.prix(B.stock.prixAchat(S, i, four)), stock: Math.round(B.stock.quantite(S, i)), route: Math.round(B.stock.enRoute(S, i)), jour: Math.round(P[i] || 0), dlc: B.stock.info(i).dlc }) : B.t('st_pas_chez')) + '</span></span>';
      if (ok) h += '<span class="plat-prix"><button type="button" class="petit-btn mini" data-st="moins" data-id="' + i + '">−</button><b>' + q + '</b><button type="button" class="petit-btn mini" data-st="plus" data-id="' + i + '">+</button></span>';
      h += '</div>';
    });
  });
  return h;
};

UI.htmlStReglages = function () {
  const S = UI.S, FS = B.DATA.stocks.fournisseurs, A = B.DATA.stocks.auto;
  let h = '<div class="ligne-reglage"><span>' + UI.esc(B.t('st_reg_auto')) + '<br><span class="sous">' + UI.esc(B.t('st_reg_auto_aide')) + '</span></span>' +
    '<button type="button" class="bascule' + (S.stocks.auto ? ' on' : '') + '" data-st="auto">' + UI.esc(B.t(S.stocks.auto ? 'menu_oui' : 'menu_non')) + '</button></div>';
  h += '<div class="ligne-reglage"><span>' + UI.esc(B.t('st_reg_marge')) + '<br><span class="sous">' + UI.esc(B.t('st_reg_marge_aide')) + '</span></span>' +
    '<span class="plat-prix"><button type="button" class="petit-btn mini" data-st="marge-moins">−</button><b>' + S.stocks.marge + ' %</b><button type="button" class="petit-btn mini" data-st="marge-plus">+</button></span></div>';
  h += '<h3>' + UI.esc(B.t('st_reg_habituel')) + '</h3><div class="fours">';
  Object.keys(FS).forEach(function (f) {
    h += '<button type="button" class="four' + (f === S.stocks.habituel ? ' actif' : '') + '" data-st-habituel="' + f + '"><b>' + UI.esc(FS[f].emoji + ' ' + B.stock.nomFournisseur(S, f)) + '</b><span class="sous">' +
      UI.esc(B.t('st_four_qualite', { coef: Math.round((FS[f].coef - 1) * 100), q: FS[f].qualite })) + '</span></button>';
  });
  h += '</div>';
  if (S.stocks.derniereAuto) h += '<p class="sous">' + UI.esc(B.t('st_derniere_auto', { jour: S.stocks.derniereAuto.jour, total: B.euros(S.stocks.derniereAuto.total || 0) })) + '</p>';
  h += '<h3>' + UI.esc(B.t('st_source_titre')) + '</h3><p class="sous">' + UI.esc(B.DATA['prix-gros']._source) + '</p>';
  h += '<p class="sous">' + UI.esc(B.t('st_saison_aide')) + '</p>';
  return h;
};

UI.rafraichirStocks = function (enHaut) {
  if (UI.voletOuvert !== 'stocks') return;
  UI.$('volet-titre').textContent = B.t('st_titre');
  const corps = UI.$('volet-corps'), y = corps.scrollTop;
  corps.innerHTML = UI.htmlStocks();
  corps.scrollTop = enHaut ? 0 : y;
};

UI.initStocks = function () {
  UI.$('btn-stocks').textContent = B.t('btn_stocks');
  UI.$('btn-stocks').addEventListener('click', function () { UI.ouvrirVolet('stocks'); });
  UI.$('volet-corps').addEventListener('click', function (e) {
    if (UI.voletOuvert !== 'stocks' || !UI.S) return;
    const S = UI.S, b = e.target.closest('[data-st],[data-st-onglet],[data-st-four],[data-st-habituel]');
    if (!b || b.disabled) return;
    let haut = false;
    if (b.dataset.stOnglet) { UI.stOnglet = b.dataset.stOnglet; UI.stMsg = null; haut = true; }
    else if (b.dataset.stFour) { UI.panier = { four: b.dataset.stFour, lignes: UI.panier ? UI.panier.lignes : {} }; }
    else if (b.dataset.stHabituel) { S.stocks.habituel = b.dataset.stHabituel; }
    else {
      const a = b.dataset.st, id = b.dataset.id, A = B.DATA.stocks.auto;
      if (a === 'plus' || a === 'moins') { const q = (UI.panier.lignes[id] || 0) + (a === 'plus' ? 5 : -5); UI.panier.lignes[id] = Math.max(0, q); UI.stMsg = null; }
      else if (a === 'proposer') { UI.panier.lignes = UI.proposer(UI.panier.four); UI.stMsg = null; }
      else if (a === 'vider') { UI.panier.lignes = {}; UI.stMsg = null; }
      else if (a === 'commander') {
        const r = B.stock.commander(S, UI.panier.four, UI.panier.lignes, false);
        if (r.erreur) UI.stMsg = { texte: B.t(r.erreur) };
        else {
          UI.stMsg = { ok: true, texte: B.t('st_commande_ok', { total: B.euros(r.cout), heure: B.stock.texteArrivee(S, r.arrivee) }) + (r.coupes ? ' ' + B.t('st_commande_coupee') : '') };
          UI.panier.lignes = {};
          UI.majBarre();
        }
        haut = true;
      }
      else if (a === 'auto') S.stocks.auto = !S.stocks.auto;
      else if (a === 'marge-plus' || a === 'marge-moins') S.stocks.marge = Math.max(0, Math.min(A.max, S.stocks.marge + (a === 'marge-plus' ? A.pas : -A.pas)));
    }
    UI.sauver(); UI.rafraichirStocks(haut);
  });
};
