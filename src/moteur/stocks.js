/* stocks.js — la réserve, les prix de gros, les fournisseurs, les commandes, les dates limites, le gaspillage,
   les ruptures et le menu du jour. Données : donnees/stocks.json, donnees/prix-gros.json (Rungis, RNM). */
B.stock = {};
B.R_STOCK = function () { return B.DATA.stocks; };
B.maintenant = function (S) { return (S.jour - 1) * 1440 + S.minute; };
B.r2 = function (n) { return Math.round(n * 100) / 100; };

/* ---------- Calendrier (simple) : le jour 1 est la date de création de la partie ---------- */
B.dateDuJour = function (S, decalage) {
  const d = new Date((S.calendrier && S.calendrier.debut || '2026-11-25') + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + S.jour - 1 + (decalage || 0));
  return d;
};
B.mois = function (S, decalage) { return B.dateDuJour(S, decalage).getUTCMonth(); };
B.texteDate = function (S, decalage) {
  const d = B.dateDuJour(S, decalage), T = B.DATA.textes;
  return T.jours_semaine[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + T.mois_noms[d.getUTCMonth()];
};
/* Mois « des produits » : décalé de 6 mois dans l'hémisphère sud. */
B.stock.moisProduits = function (S) { const m = B.mois(S); return B.lieu(S.lieu).hemisphereSud ? (m + 6) % 12 : m; };

/* ---------- Ingrédients et prix ---------- */
B.stock.ing = function (i) { return B.DATA.catalogue.ingredients[i] || { nom: i }; };
B.stock.info = function (i) { return B.DATA.stocks.ingredients[i] || { dlc: 5, rangement: 'froid' }; };
B.stock.coefSaison = function (S, i) {
  const p = B.DATA['prix-gros'].produits[i], Z = B.DATA['prix-gros'].saison;
  if (!p || !p.saison) return 1;
  return p.saison.indexOf(B.stock.moisProduits(S)) >= 0 ? Z.enSaison : Z.horsSaison;
};
B.stock.enSaison = function (S, i) { return B.stock.coefSaison(S, i) < 1; };
B.stock.offre = function (S, i, four) {
  return (S.stocks && S.stocks.offres || []).find(function (o) { return o.ing === i && (!four || o.four === four) && o.jour >= S.jour; }) || null;
};
B.stock.fourOk = function (four, i) { const F = B.DATA.stocks.fournisseurs[four]; return !!F && F.exclus.indexOf(i) < 0; };
/* Prix d'achat d'une portion chez un fournisseur, aujourd'hui (saison, offre du jour comprises). */
B.stock.prixAchat = function (S, i, four) {
  const p = B.DATA['prix-gros'].produits[i], F = B.DATA.stocks.fournisseurs[four || 'grossiste'];
  const base = (p ? p.prix : 0.5) * (B.lieu(S.lieu).prix || 1) * B.stock.coefSaison(S, i) * F.coef;
  const o = B.stock.offre(S, i, four);
  return Math.max(0.01, B.r2(base * (o ? 1 - o.remise : 1)));
};
B.stock.habituel = function (S, i) {
  const h = S.stocks && S.stocks.habituel || B.DATA.stocks.fournisseurHabituel;
  return B.stock.fourOk(h, i) ? h : 'grossiste';
};
B.stock.nomFournisseur = function (S, four) {
  const n = B.DATA.stocks.nomsFournisseurs[S.lieu];
  return n && n[four] || B.DATA.stocks.fournisseurs[four].nom;
};
B.stock.origine = function (S, four) {
  const o = B.DATA.catalogue.originesViande[S.lieu] || ['France · Label Rouge', 'France', 'Union européenne', 'Hors UE'];
  return o[B.DATA.stocks.fournisseurs[four].origine] || o[1];
};

/* ---------- La réserve : des lots, chacun avec sa date limite (dernier jour où il est bon) ---------- */
B.stock.lots = function (S, i) { return S.stocks.lots[i] || (S.stocks.lots[i] = []); };
B.stock.quantite = function (S, i) { return (S.stocks.lots[i] || []).reduce(function (s, l) { return s + l.q; }, 0); };
B.stock.peutFaire = function (S, recette, n) {
  n = n || 1;
  for (const i in recette) if (B.stock.quantite(S, i) < recette[i] * n - 1e-9) return false;
  return true;
};
B.stock.manque = function (S, recette) {
  return Object.keys(recette).filter(function (i) { return B.stock.quantite(S, i) < recette[i] - 1e-9; });
};
/* Retire une recette de la réserve (les lots qui périment le plus tôt d'abord). Renvoie le coût réel. */
B.stock.consommer = function (S, recette) {
  let cout = 0;
  for (const i in recette) {
    let reste = recette[i];
    const L = B.stock.lots(S, i);
    while (reste > 1e-9 && L.length) {
      const l = L[0], q = Math.min(l.q, reste);
      l.q -= q; reste -= q; cout += q * l.prix;
      if (l.q <= 1e-9) L.shift();
    }
    S.stocks.demandeJour[i] = (S.stocks.demandeJour[i] || 0) + recette[i];
  }
  return B.r2(cout);
};
/* Demande qu'on n'a pas pu servir (rupture) : comptée pour ne pas sous-estimer les prochaines commandes. */
B.stock.noterDemande = function (S, recette) {
  for (const i in recette) S.stocks.demandeJour[i] = (S.stocks.demandeJour[i] || 0) + recette[i];
};
B.stock.ajouterLot = function (S, i, q, prix, four) {
  const info = B.stock.info(i), F = B.DATA.stocks.fournisseurs[four], Q = B.DATA.stocks.qualiteDlc;
  let dlc = info.dlc;
  if (dlc <= 7 && F) dlc = Math.max(1, dlc + (F.qualite >= Q.haute ? 1 : F.qualite <= Q.basse ? -1 : 0));
  const L = B.stock.lots(S, i);
  const fin = S.jour + dlc - 1;
  const meme = L.find(function (l) { return l.dlc === fin && l.four === four && Math.abs(l.prix - prix) < 0.005; });
  if (meme) meme.q += q; else L.push({ q: q, dlc: fin, prix: prix, four: four });
  L.sort(function (a, b) { return a.dlc - b.dlc; });
};
B.stock.occupation = function (S, rang) {
  let n = 0;
  for (const i in S.stocks.lots) if (B.stock.info(i).rangement === rang) n += B.stock.quantite(S, i);
  return n;
};
B.stock.enRoute = function (S, i) {
  return S.stocks.commandes.reduce(function (s, c) { return s + (c.lignes[i] || 0); }, 0);
};
B.stock.enRouteRangement = function (S, rang) {
  return S.stocks.commandes.reduce(function (s, c) {
    for (const i in c.lignes) if (B.stock.info(i).rangement === rang) s += c.lignes[i];
    return s;
  }, 0);
};
B.stock.place = function (S, rang) {
  return Math.max(0, B.DATA.stocks.rangements[rang].capacite - B.stock.occupation(S, rang) - B.stock.enRouteRangement(S, rang));
};
B.stock.bonJusqua = function (S, i, jour) {
  return (S.stocks.lots[i] || []).reduce(function (s, l) { return s + (l.dlc >= jour ? l.q : 0); }, 0);
};
B.stock.aEcouler = function (S, i) {   /* portions qui ne seront plus bonnes après demain */
  return (S.stocks.lots[i] || []).reduce(function (s, l) { return s + (l.dlc <= S.jour + 1 ? l.q : 0); }, 0);
};

/* ---------- Commandes ---------- */
/* lignes = { ingrédient: portions }. Renvoie { ok, cout, arrivee, coupes } ou { erreur }. */
B.stock.commander = function (S, four, lignes, auto) {
  const F = B.DATA.stocks.fournisseurs[four];
  if (!F) return { erreur: 'stock_four_inconnu' };
  const out = {}, prix = {}, place = {};
  let coupes = 0, total = 0;
  Object.keys(B.DATA.stocks.rangements).forEach(function (r) { place[r] = B.stock.place(S, r); });
  for (const i in lignes) {
    let q = Math.floor(lignes[i]);
    if (!(q > 0)) continue;
    if (!B.stock.fourOk(four, i)) { coupes++; continue; }
    const r = B.stock.info(i).rangement;
    if (q > place[r]) { q = Math.floor(place[r]); coupes++; }
    if (q <= 0) continue;
    place[r] -= q;
    out[i] = q; prix[i] = B.stock.prixAchat(S, i, four); total += q * prix[i];
  }
  if (!Object.keys(out).length) return { erreur: coupes ? 'stock_plein' : 'stock_rien' };
  const cout = B.r2(total + F.frais);
  if (!B.argent.peutPayer(S, cout, true)) return { erreur: 'stock_pas_argent' };
  B.argent.payer(S, 'achats', cout);
  const c = { id: S.prochainId++, four: four, lignes: out, prix: prix, cout: cout, passee: B.maintenant(S), arrivee: B.maintenant(S) + F.delai, auto: !!auto };
  S.stocks.commandes.push(c);
  if (!auto) S.stocks.derniereManuelle = S.jour;
  if (!auto) B.message(S, 'msg_commande', { four: B.stock.nomFournisseur(S, four), total: B.euros(cout), heure: B.stock.texteArrivee(S, c.arrivee) });
  return { ok: true, cout: cout, arrivee: c.arrivee, coupes: coupes, commande: c };
};
B.stock.texteArrivee = function (S, t) {
  const j = Math.floor(t / 1440) + 1, m = t - (j - 1) * 1440;
  return (j === S.jour ? '' : j === S.jour + 1 ? B.t('demain') + ' ' : B.t('jour_n', { n: j }) + ' ') + B.heure(Math.max(m, j > S.jour ? 0 : m));
};
B.stock.livrer = function (S, discret) {
  const t = B.maintenant(S), arrivees = S.stocks.commandes.filter(function (c) { return c.arrivee <= t; });
  if (!arrivees.length) return 0;
  let n = 0;
  arrivees.forEach(function (c) {
    for (const i in c.lignes) { B.stock.ajouterLot(S, i, c.lignes[i], c.prix[i], c.four); n += c.lignes[i]; }
  });
  S.stocks.commandes = S.stocks.commandes.filter(function (c) { return c.arrivee > t; });
  if (!discret) B.message(S, 'msg_livraison', { four: arrivees.map(function (c) { return B.stock.nomFournisseur(S, c.four); }).filter(function (x, k, a) { return a.indexOf(x) === k; }).join(', '), n: Math.round(n) });
  B.stock.finRuptures(S);
  return n;
};

/* ---------- Prévision des besoins ---------- */
/* Portions vendues par client, pour chaque plat ou boisson à la carte (estimation tant qu'il n'y a pas d'historique). */
B.stock.parClient = function (S) {
  const R = B.DATA.carte.commande, Bo = B.DATA.stocks.boissons, out = {};
  const part = 1 - B.DATA.stocks.menuDuJour.probaClient * (S.stocks && S.stocks.mdjOn === false ? 0 : 1);
  const cats = { entree: R.probaEntree * part, plat: part, dessert: R.probaDessert * part };
  const poids = function (id) { const d = B.carte.plat(S, id); return d.popularite * Math.pow(B.carte.prixConseille(S, d) / S.carte.plats[id].prix, R.elasticiteChoix) * (d.saison ? R.bonusSaison || 1 : 1); };
  const repartir = function (ids, total) { const w = ids.map(poids), t = w.reduce(function (s, x) { return s + x; }, 0) || 1; ids.forEach(function (id, k) { out[id] = total * w[k] / t; }); };
  B.carte.CATS.forEach(function (c) { repartir(B.carte.surCarte(S, c), cats[c]); });
  const types = { apero: Bo.probaApero, vin: Bo.probaVin, froid: (1 - Bo.probaVin) * Bo.probaFraiche, chaud: Bo.probaChaude, bouteille: Bo.probaBouteille / 3 };
  const bo = B.carte.surCarte(S, 'boisson');
  Object.keys(types).forEach(function (ty) {
    repartir(bo.filter(function (id) { return B.carte.plat(S, id).type === ty; }), types[ty]);
  });
  return out;
};
B.stock.clientsPrevus = function (S) { return B.DATA.stocks.auto.clientsParAffluence * (B.lieu(S.lieu).affluence || 1); };
B.stock.estimation = function (S) {
  const pc = B.stock.parClient(S), n = B.stock.clientsPrevus(S), out = {};
  for (const id in pc) {
    const d = B.carte.plat(S, id);
    for (const i in d.recette) out[i] = (out[i] || 0) + d.recette[i] * pc[id] * n;
  }
  return out;
};
/* Besoin d'une journée pour chaque ingrédient : moyenne des 3 derniers jours (ventes + demandes en rupture),
   jamais moins de 70 % de l'estimation faite à partir de la carte (si la carte change). */
B.stock.prevision = function (S) {
  const est = B.stock.estimation(S), h = S.stocks.historique || {}, out = {};
  const ids = Object.keys(est).concat(Object.keys(h));
  ids.forEach(function (i) {
    const e = est[i] || 0;
    if (!e) return;   /* plus utilisé par la carte */
    const H = h[i] || [];
    out[i] = H.length ? Math.max(H.reduce(function (s, x) { return s + x; }, 0) / H.length, e * 0.7) : e;
  });
  return out;
};
B.stock.joursCouverture = function (i) {
  const d = B.stock.info(i).dlc, J = B.DATA.stocks.auto.joursCouverture;
  for (const x of J) if (d <= x[0]) return x[1];
  return 1;
};

/* Ce qu'il faudrait commander maintenant pour tenir jusqu'à la prochaine commande (même calcul que la commande automatique). */
B.stock.besoins = function (S) {
  const P = B.stock.prevision(S), marge = 1 + (S.stocks.marge || 0) / 100, besoinMdj = B.stock.besoinPlanMdj(S), out = {};
  Object.keys(P).concat(Object.keys(besoinMdj)).forEach(function (i) {
    const b = Math.ceil((P[i] || 0) * B.stock.joursCouverture(i) * marge + (besoinMdj[i] || 0)) - B.stock.bonJusqua(S, i, S.jour + 1) - B.stock.enRoute(S, i);
    if (b >= 1) out[i] = b;
  });
  return out;
};

/* ---------- Commande automatique (le soir) ---------- */
B.stock.commandeAuto = function (S) {
  const P = B.stock.prevision(S), marge = 1 + (S.stocks.marge || 0) / 100, demain = S.jour + 1;
  const besoinMdj = B.stock.besoinPlanMdj(S);
  const parFour = {}, lignes = [];
  const ids = Object.keys(P).concat(Object.keys(besoinMdj)).filter(function (x, k, a) { return a.indexOf(x) === k; });
  ids.forEach(function (i) {
    const cible = Math.ceil((P[i] || 0) * B.stock.joursCouverture(i) * marge + (besoinMdj[i] || 0));
    const besoin = cible - B.stock.bonJusqua(S, i, demain) - B.stock.enRoute(S, i);
    if (besoin < 1) return;
    let four = B.stock.habituel(S, i), meilleur = B.stock.prixAchat(S, i, four);
    (S.stocks.offres || []).forEach(function (o) {
      if (o.ing !== i || o.jour < S.jour || !B.stock.fourOk(o.four, i)) return;
      if (B.DATA.stocks.fournisseurs[o.four].delai > 720 && B.stock.info(i).dlc < 30) return;   /* arriverait trop tard */
      const p = B.stock.prixAchat(S, i, o.four);
      if (p < meilleur) { meilleur = p; four = o.four; }
    });
    lignes.push({ i: i, four: four, q: Math.ceil(besoin) });
  });
  /* place limitée : toutes les lignes d'un même rangement sont réduites dans la même proportion */
  let reduit = 0;
  Object.keys(B.DATA.stocks.rangements).forEach(function (r) {
    const L = lignes.filter(function (l) { return B.stock.info(l.i).rangement === r; });
    const tot = L.reduce(function (s, l) { return s + l.q; }, 0), place = B.stock.place(S, r);
    if (tot > place) { reduit++; L.forEach(function (l) { l.q = Math.floor(l.q * place / tot); }); }
  });
  lignes.forEach(function (l) { if (l.q >= 1) (parFour[l.four] = parFour[l.four] || {})[l.i] = l.q; });
  let total = 0, nb = 0, coupes = reduit;
  for (const f in parFour) {
    const r = B.stock.commander(S, f, parFour[f], true);
    if (r.ok) { total += r.cout; nb++; coupes += r.coupes; }
    else if (r.erreur === 'stock_plein') coupes++;
  }
  S.stocks.derniereAuto = { jour: S.jour, total: B.r2(total), fournisseurs: nb, coupes: coupes };
  if (nb) B.noter(S, 'msg_commande_auto', { n: nb, total: B.euros(total) });
  if (coupes) B.message(S, 'msg_commande_coupee');
  return total;
};

/* ---------- Offres des fournisseurs ---------- */
B.stock.genererOffres = function (S, jour) {
  const O = B.DATA.stocks.offres, F = Object.keys(B.DATA.stocks.fournisseurs);
  const utiles = Object.keys(B.stock.estimation(S)).concat(B.menuJour.ingredientsPool(S)).filter(function (x, k, a) { return a.indexOf(x) === k; });
  const n = B.entier(S, O.min, O.max), out = [];
  for (let k = 0; k < 20 && out.length < n && utiles.length; k++) {
    const i = utiles[B.entier(S, 0, utiles.length - 1)];
    if (out.some(function (o) { return o.ing === i; })) continue;
    const fs = F.filter(function (f) { return B.stock.fourOk(f, i); });
    out.push({ ing: i, four: fs[B.entier(S, 0, fs.length - 1)], remise: O.remises[B.entier(S, 0, O.remises.length - 1)], jour: jour });
  }
  S.stocks.offres = (S.stocks.offres || []).filter(function (o) { return o.jour >= S.jour && o.jour !== jour; }).concat(out);
};

/* ---------- Ruptures : un plat sans ingrédients disparaît de la carte, puis revient à la livraison ---------- */
B.stock.cause = function (S, i) {
  const t = B.maintenant(S);
  const route = S.stocks.commandes.filter(function (c) { return c.lignes[i] && c.arrivee > t; }).sort(function (a, b) { return a.arrivee - b.arrivee; })[0];
  if (route) return { cle: 'rupture_cause_route', vars: { heure: B.stock.texteArrivee(S, route.arrivee) } };
  if (!S.stocks.auto) return { cle: S.stocks.derniereManuelle >= S.jour - 1 ? 'rupture_cause_trop_peu' : 'rupture_cause_pas_commande', vars: {} };
  if (S.stocks.derniereAuto && S.stocks.derniereAuto.coupes && B.stock.place(S, B.stock.info(i).rangement) < 5) return { cle: 'rupture_cause_place', vars: {} };
  return { cle: 'rupture_cause_prevision', vars: {} };
};
B.stock.noterRupture = function (S, d) {
  const R = S.stocks.ruptures;
  let r = R[d.id];
  if (!r || r.fin != null) {
    const manque = B.stock.manque(S, d.recette);
    const c = B.stock.cause(S, manque[0]);
    r = R[d.id] = { id: d.id, nom: d.nom, debut: Math.floor(S.minute), fin: null, manque: manque, cause: c.cle, vars: c.vars, refus: (r ? r.refus : 0) };
    S.stats.jour.ruptures = (S.stats.jour.ruptures || 0) + 1;
    B.message(S, 'msg_rupture', { plat: d.nom, ing: manque.map(function (i) { return B.stock.ing(i).nom.toLowerCase(); }).join(', '), cause: B.t(c.cle, c.vars) });
  }
  r.refus++;
  B.stock.noterDemande(S, d.recette);
};
B.stock.finRuptures = function (S) {
  const R = S.stocks.ruptures;
  for (const id in R) {
    const r = R[id], d = B.carte.plat(S, id);
    if (r.fin == null && d && B.stock.peutFaire(S, d.recette)) { r.fin = Math.floor(S.minute); B.noter(S, 'msg_rupture_fin', { plat: d.nom }); }
  }
};

/* ---------- Création, matin et soir ---------- */
B.stock.creer = function (S, sansCourses) {
  const R = B.DATA.stocks;
  S.calendrier = S.calendrier || { debut: (S.creeLe || '2026-11-25').slice(0, 10) };
  S.stocks = { lots: {}, commandes: [], offres: [], historique: {}, demandeJour: {}, ruptures: {},
    auto: !!R.auto.parDefaut[S.difficulte || 'facile'], marge: R.auto.margeDefaut, habituel: R.fournisseurHabituel,
    mdj: null, mdjOn: true, mdjPrix: null, planMdj: null, premieresCourses: 0, derniereAuto: null, moisCarte: B.mois(S) };
  B.stock.genererOffres(S, S.jour);
  if (!sansCourses) B.stock.premieresCourses(S);
  B.menuJour.calculer(S);
};
/* Premières courses : 2 jours de besoins, livrées avant l'ouverture, payées (sans frais de livraison). */
B.stock.premieresCourses = function (S) {
  const P = B.stock.prevision(S), J = B.DATA.stocks.premieresCourses.jours;
  let total = 0;
  const plan = B.menuJour.planifier(S, S.jour), besoinMdj = B.stock.besoinPlan(S, plan);
  for (const i in Object.assign({}, P, besoinMdj)) {
    const r = B.stock.info(i).rangement;
    let q = Math.ceil((P[i] || 0) * Math.min(J, B.stock.joursCouverture(i) + 1) * 1.1 + (besoinMdj[i] || 0));
    q = Math.min(q, Math.floor(B.stock.place(S, r)));
    if (q <= 0) continue;
    const four = B.stock.habituel(S, i), prix = B.stock.prixAchat(S, i, four);
    B.stock.ajouterLot(S, i, q, prix, four);
    total += q * prix;
  }
  total = B.r2(total);
  S.argent = B.r2(S.argent - total);
  S.stocks.premieresCourses = total;
  S.stocks.planMdj = plan;
  B.noter(S, 'msg_premieres_courses', { total: B.euros(total) });
};
/* Le matin : livraisons de la nuit, produits périmés jetés, saisons, menu du jour. */
B.stock.matin = function (S) {
  S.stocks.demandeJour = {};
  S.stocks.ruptures = {};
  B.stock.livrer(S, true);
  const jetes = [];
  let valeur = 0, portions = 0;
  for (const i in S.stocks.lots) {
    const L = S.stocks.lots[i];
    const garde = L.filter(function (l) { return l.dlc >= S.jour; });
    L.filter(function (l) { return l.dlc < S.jour; }).forEach(function (l) { valeur += l.q * l.prix; portions += l.q; jetes.push({ i: i, q: l.q }); });
    S.stocks.lots[i] = garde;
  }
  S.stats.jour.gaspillage = B.r2(valeur);
  S.stats.jour.gaspillagePortions = Math.round(portions);
  S.stats.jour.jetes = jetes.sort(function (a, b) { return b.q - a.q; }).slice(0, 6).map(function (x) { return { nom: B.stock.ing(x.i).nom, q: Math.round(x.q) }; });
  if (portions >= 1) B.message(S, 'msg_gaspillage', { n: Math.round(portions), valeur: B.euros(valeur), liste: S.stats.jour.jetes.slice(0, 3).map(function (x) { return x.q + ' ' + x.nom.toLowerCase(); }).join(', ') });
  B.carte.verifierSaisons(S);
  B.menuJour.calculer(S);
};
/* Le soir : on retient la demande du jour, on prépare le menu du jour de demain et ses offres, puis commande automatique. */
B.stock.soir = function (S) {
  const H = S.stocks.historique;
  const ids = Object.keys(H).concat(Object.keys(S.stocks.demandeJour)).filter(function (x, k, a) { return a.indexOf(x) === k; });
  ids.forEach(function (i) { const h = H[i] || (H[i] = []); h.push(S.stocks.demandeJour[i] || 0); if (h.length > 3) h.shift(); });
  B.stock.genererOffres(S, S.jour + 1);
  S.stocks.planMdj = B.menuJour.planifier(S, S.jour + 1);
  if (S.stocks.auto) B.stock.commandeAuto(S);
};
B.stock.besoinPlan = function (S, plan) {
  const out = {}, M = B.DATA.stocks.menuDuJour, n = M.portionsSurPlace + M.portionsEmporter;
  if (!plan) return out;
  ['entree', 'plat', 'dessert'].forEach(function (c) {
    const d = plan[c] && B.menuJour.plat(S, plan[c]);
    if (!d) return;
    const part = c === 'plat' ? 1 : 0.7;
    for (const i in d.recette) out[i] = (out[i] || 0) + Math.ceil(d.recette[i] * n * part);
  });
  return out;
};
B.stock.besoinPlanMdj = function (S) { return S.stocks.mdjOn === false ? {} : B.stock.besoinPlan(S, S.stocks.planMdj); };

/* ================= Menu du jour ================= */
B.menuJour = {};
B.menuJour._cache = {};
B.menuJour.pool = function (S) {
  if (B.menuJour._cache[S.lieu]) return B.menuJour._cache[S.lieu];
  const M = B.DATA.catalogue.menuDuJour;
  const l = (M.lieux[S.lieu] || []).concat(B.lieu(S.lieu).groupe === 'france' ? M.bistrot : []);
  B.menuJour._cache[S.lieu] = l;
  return l;
};
B.menuJour.plat = function (S, id) { return B.menuJour.pool(S).find(function (d) { return d.id === id; }) || null; };
B.menuJour.ingredientsPool = function (S) {
  const o = {};
  B.menuJour.pool(S).forEach(function (d) { for (const i in d.recette) o[i] = 1; });
  return Object.keys(o);
};
/* Choisit entrée, plat et dessert du jour : produits à écouler (date limite proche), offres des fournisseurs, un peu de hasard. */
B.menuJour.score = function (S, d, jour, avecStock) {
  let s = B.hasard(S) * 1.5;
  const raisons = [];
  for (const i in d.recette) {
    if (avecStock && B.stock.aEcouler(S, i) >= 3) { s += 3; raisons.push({ cle: 'mdj_raison_ecouler', vars: { ing: B.stock.ing(i).nom.toLowerCase() } }); }
    const o = (S.stocks.offres || []).find(function (x) { return x.ing === i && x.jour === jour; });
    if (o) { s += 2; raisons.push({ cle: 'mdj_raison_offre', vars: { ing: B.stock.ing(i).nom.toLowerCase(), remise: Math.round(o.remise * 100), four: B.stock.nomFournisseur(S, o.four) } }); }
    if (B.stock.enSaison(S, i)) s += 0.5;
  }
  return { s: s, raisons: raisons };
};
B.menuJour.planifier = function (S, jour) {
  const plan = { jour: jour, raisons: {} };
  ['entree', 'plat', 'dessert'].forEach(function (c) {
    let best = null;
    B.menuJour.pool(S).filter(function (d) { return d.cat === c; }).forEach(function (d) {
      const x = B.menuJour.score(S, d, jour, true);
      if (!best || x.s > best.s) best = { id: d.id, s: x.s, raisons: x.raisons };
    });
    plan[c] = best ? best.id : null;
    if (best) plan.raisons[best.id] = best.raisons;
  });
  return plan;
};
/* Portions possibles d'un plat sans prendre ce dont la carte a besoin aujourd'hui. */
B.menuJour.possible = function (S, d, reserve) {
  let n = Infinity;
  for (const i in d.recette) n = Math.min(n, Math.floor(Math.max(0, B.stock.quantite(S, i) - (reserve[i] || 0)) / d.recette[i]));
  return n;
};
B.menuJour.calculer = function (S) {
  const M = B.DATA.stocks.menuDuJour, reserve = {}, P = B.stock.prevision(S);
  for (const i in P) reserve[i] = P[i] * 0.8;
  const plan = S.stocks.planMdj && S.stocks.planMdj.jour === S.jour ? S.stocks.planMdj : null;
  const mdj = { jour: S.jour, entree: null, plat: null, dessert: null, raisons: {}, portions: 0, emporter: 0, vendus: 0, emporterVendus: 0, prevues: 0 };
  ['plat', 'entree', 'dessert'].forEach(function (c) {
    const cands = B.menuJour.pool(S).filter(function (d) { return d.cat === c; }).map(function (d) {
      const sc = B.menuJour.score(S, d, S.jour, true);
      if (plan && plan[c] === d.id) { sc.s += 4; sc.raisons = (plan.raisons[d.id] || []).concat(sc.raisons); }
      return { d: d, n: B.menuJour.possible(S, d, reserve), s: sc.s, raisons: sc.raisons };
    }).filter(function (x) { return x.n >= M.minPortions; }).sort(function (a, b) { return b.s - a.s; });
    if (!cands.length) return;
    const x = cands[0];
    mdj[c] = x.d.id;
    const vus = {};
    mdj.raisons[x.d.id] = x.raisons.filter(function (r) { const k = r.cle + r.vars.ing; if (vus[k]) return false; vus[k] = 1; return true; }).slice(0, 2);
    for (const i in x.d.recette) reserve[i] = (reserve[i] || 0) + x.d.recette[i] * Math.min(x.n, M.portionsSurPlace + M.portionsEmporter);
    mdj['n_' + c] = x.n;
  });
  if (mdj.plat) {
    const n = Math.min(M.portionsSurPlace + M.portionsEmporter, mdj.n_plat);
    mdj.emporter = Math.min(M.portionsEmporter, Math.floor(n / 4));
    mdj.portions = n - mdj.emporter;
    mdj.prevues = n;
  } else B.message(S, 'msg_mdj_aucun');
  /* la proposition automatique est gardée pour le bouton « Revenir au menu proposé » */
  mdj.auto = { entree: mdj.entree, plat: mdj.plat, dessert: mdj.dessert, raisons: mdj.raisons };
  mdj.manuel = {};
  S.stocks.mdj = mdj;
  /* portions : le menu complet (entrée + plat + dessert) doit être faisable sans prendre ce dont la carte a besoin */
  if (mdj.plat) { B.menuJour.recompter(S); mdj.prevues = mdj.portions + mdj.emporter; }
  if (!S.stocks.mdjPrix) S.stocks.mdjPrix = B.menuJour.prixConseilles(S);
};
B.menuJour.prixConseilles = function (S) {
  const p = B.DATA.stocks.menuDuJour.prix, c = B.lieu(S.lieu).prix || 1, o = {};
  for (const k in p) o[k] = Math.round(p[k] * c * 2) / 2;
  return o;
};
B.menuJour.formules = function (S) {
  const m = S.stocks.mdj;
  if (!m || !m.plat || S.stocks.mdjOn === false) return [];
  const f = [];
  if (m.entree) f.push('ep');
  if (m.dessert) f.push('pd');
  if (m.entree && m.dessert) f.push('epd');
  if (!f.length) f.push('p');
  return f;
};
B.menuJour.lignesFormule = function (f) { return { ep: ['entree', 'plat'], pd: ['plat', 'dessert'], epd: ['entree', 'plat', 'dessert'], p: ['plat'] }[f]; };
B.menuJour.prixFormule = function (S, f) {
  const P = S.stocks.mdjPrix || B.menuJour.prixConseilles(S);
  return f === 'p' ? Math.max(1, P.pd - 4) : P[f];
};
B.menuJour.recette = function (S, f) {
  const r = {};
  B.menuJour.lignesFormule(f).forEach(function (c) { const d = B.menuJour.plat(S, S.stocks.mdj[c]); if (d) for (const i in d.recette) r[i] = (r[i] || 0) + d.recette[i]; });
  return r;
};
B.menuJour.changerPrix = function (S, f, sens) {
  const P = S.stocks.mdjPrix, c = B.menuJour.prixConseilles(S);
  P[f] = Math.round(Math.min(c[f] * 3, Math.max(1, P[f] + sens * B.DATA.carte.prix.pas)) * 100) / 100;
};
/* ---------- Menu du jour modifié par le joueur (v0.5.1) ---------- */
B.menuJour.CATS = ['entree', 'plat', 'dessert'];
/* Ce que la carte garde pour elle aujourd'hui (le menu ne le prend jamais) + ce que prennent les autres plats du menu. */
B.menuJour.reserve = function (S, sauf) {
  const P = B.stock.prevision(S), r = {}, m = S.stocks.mdj;
  for (const i in P) r[i] = P[i] * 0.8;
  if (m) B.menuJour.CATS.forEach(function (c) {
    const d = c !== sauf && m[c] && B.menuJour.plat(S, m[c]);
    if (d) for (const i in d.recette) r[i] = (r[i] || 0) + d.recette[i] * Math.max(0, (m.portions || 0) + (m.emporter || 0));
  });
  return r;
};
/* Les plats proposables pour une place du menu : portions possibles et ingrédients qui manquent. */
B.menuJour.choix = function (S, cat) {
  const M = B.DATA.stocks.menuDuJour, r = B.menuJour.reserve(S, cat), m = S.stocks.mdj || {};
  return B.menuJour.pool(S).filter(function (d) { return d.cat === cat; }).map(function (d) {
    const n = Math.max(0, B.menuJour.possible(S, d, r));
    const manque = Object.keys(d.recette).filter(function (i) { return B.stock.quantite(S, i) - (r[i] || 0) < d.recette[i] * M.minPortions - 1e-9; });
    return { d: d, n: n, faisable: n >= 1, assez: n >= M.minPortions, manque: manque, actuel: m[cat] === d.id, propose: !!(m.auto && m.auto[cat] === d.id) };
  }).sort(function (a, b) { return (b.actuel - a.actuel) || (b.assez - a.assez) || (b.n - a.n) || a.d.nom.localeCompare(b.d.nom); });
};
/* Recalcule les portions restantes du menu (les menus déjà vendus restent vendus). */
B.menuJour.recompter = function (S) {
  const m = S.stocks.mdj, M = B.DATA.stocks.menuDuJour;
  if (!m.plat) { m.portions = 0; m.emporter = 0; return; }
  const r = {}, P = B.stock.prevision(S);
  for (const i in P) r[i] = P[i] * 0.8;
  const rec = {};
  B.menuJour.CATS.forEach(function (c) { const d = m[c] && B.menuJour.plat(S, m[c]); if (d) for (const i in d.recette) rec[i] = (rec[i] || 0) + d.recette[i]; });
  const n = Math.max(0, B.menuJour.possible(S, { recette: rec }, r));
  const reste = Math.max(0, Math.min(M.portionsSurPlace + M.portionsEmporter - m.vendus - m.emporterVendus, n));
  m.emporter = Math.max(0, Math.min(M.portionsEmporter - m.emporterVendus, Math.floor(reste / 4)));
  m.portions = reste - m.emporter;
};
/* Le joueur change une place du menu. id = null pour « pas d'entrée » ou « pas de dessert » (le plat est obligatoire). */
B.menuJour.choisir = function (S, cat, id) {
  const m = S.stocks.mdj;
  if (!m || B.menuJour.CATS.indexOf(cat) < 0) return { erreur: 'mdj_err_inconnu' };
  if (id == null) {
    if (cat === 'plat') return { erreur: 'mdj_err_plat_obligatoire' };
  } else {
    const c = B.menuJour.choix(S, cat).find(function (x) { return x.d.id === id; });
    if (!c) return { erreur: 'mdj_err_inconnu' };
    if (!c.faisable) return { erreur: 'mdj_err_manque', vars: { plat: c.d.nom, manque: c.manque.map(function (i) { return B.stock.ing(i).nom.toLowerCase(); }).join(', ') } };
  }
  m[cat] = id;
  m.manuel = m.manuel || {};
  m.manuel[cat] = true;
  if (id) m.raisons[id] = [{ cle: 'mdj_raison_choisi', vars: {} }];
  B.menuJour.recompter(S);
  return { ok: true, portions: m.portions + m.emporter };
};
/* Bouton « Revenir au menu proposé » : la proposition automatique du matin revient (sans nouveau tirage). */
B.menuJour.revenirAuto = function (S) {
  const m = S.stocks.mdj;
  if (!m || !m.auto) return false;
  B.menuJour.CATS.forEach(function (c) { m[c] = m.auto[c]; });
  m.raisons = Object.assign({}, m.auto.raisons);
  m.manuel = {};
  B.menuJour.recompter(S);
  return true;
};
B.menuJour.estModifie = function (S) { const m = S.stocks.mdj; return !!(m && m.manuel && Object.keys(m.manuel).length); };
B.menuJour.prixModifies = function (S) {
  const P = S.stocks.mdjPrix, C = B.menuJour.prixConseilles(S);
  return !!P && Object.keys(C).some(function (k) { return P[k] !== C[k]; });
};
B.menuJour.prixConseillesRemettre = function (S) { S.stocks.mdjPrix = B.menuJour.prixConseilles(S); };

/* Un client prend-il le menu du jour ? Renvoie les lignes du ticket, ou null. */
B.menuJour.commander = function (S, g) {
  const m = S.stocks.mdj, M = B.DATA.stocks.menuDuJour;
  if (!m || m.portions <= 0) return null;
  const fs = B.menuJour.formules(S);
  if (!fs.length) return null;
  const C = B.menuJour.prixConseilles(S);
  const idx = fs.reduce(function (s, f) { return s + B.menuJour.prixFormule(S, f) / (f === 'p' ? Math.max(1, C.pd - 4) : C[f]); }, 0) / fs.length;
  if (B.hasard(S) >= M.probaClient * Math.max(0.2, Math.min(1.4, Math.pow(idx, -2)))) return null;
  const f = B.carte.tirer(S, fs.map(function (x) { return { v: x, w: (M.poidsFormules[x] || 0.3) }; }));
  const rec = B.menuJour.recette(S, f);
  if (!B.stock.peutFaire(S, rec)) { B.stock.noterDemande(S, rec); return null; }
  const cout = B.stock.consommer(S, rec), prix = B.menuJour.prixFormule(S, f);
  m.portions--; m.vendus++;
  S.stats.jour.mdjVendus = (S.stats.jour.mdjVendus || 0) + 1;
  const lignes = [{ id: 'mdj_' + f, nom: B.t('mdj_formule_' + f), cat: 'menu', prix: prix, cout: cout, mdj: true }];
  B.menuJour.lignesFormule(f).forEach(function (c) {
    const d = B.menuJour.plat(S, m[c]);
    const l = { id: d.id, nom: d.nom, cat: c, prix: 0, cout: 0, mdj: true };
    if (d.cuisson) { l.viande = d.cuisson; l.cuisson = B.carte.cuissonDemandee(S, d.cuisson); }
    lignes.push(l);
  });
  S.stats.jour.platsVendus[m.plat] = (S.stats.jour.platsVendus[m.plat] || 0) + 1;
  return lignes;
};
/* Vente à emporter : quelques menus du jour commandés par téléphone, payés au retrait. */
B.menuJour.emporter = function (S, h) {
  const m = S.stocks.mdj, M = B.DATA.stocks.menuDuJour;
  if (!m || m.emporter <= 0 || S.stocks.mdjOn === false || !m.plat) return;
  const fen = M.emporterHeures.find(function (w) { return S.minute >= w[0] && S.minute < w[1]; });
  if (!fen) return;
  const duree = M.emporterHeures.reduce(function (s, w) { return s + w[1] - w[0]; }, 0);
  if (B.hasard(S) >= M.portionsEmporter / 1.5 / duree * h) return;
  const n = Math.min(m.emporter, B.entier(S, 1, 2));
  const fs = B.menuJour.formules(S), f = fs.indexOf('pd') >= 0 ? 'pd' : fs[0];
  const rec = {}, r1 = B.menuJour.recette(S, f);
  for (const i in r1) rec[i] = r1[i] * n;
  if (!B.stock.peutFaire(S, rec)) return;
  const cout = B.stock.consommer(S, rec), prix = B.menuJour.prixFormule(S, f) * n;
  m.emporter -= n; m.emporterVendus += n;
  S.argent = B.r2(S.argent + prix);
  const st = S.stats.jour;
  st.recettes = B.r2(st.recettes + prix); st.emporter = (st.emporter || 0) + n; st.coutMatiere += cout;
  B.noter(S, 'msg_emporter', { n: n, total: B.euros(prix) });
};
