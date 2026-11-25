/* carte.js — la carte des plats, les prix, les commandes des clients, les cuissons et le paiement.
   Catalogue repris de l'ancien jeu (donnees/catalogue.json) ; règles dans donnees/carte.json. */
B.carte = {};
B.carte.CATS = ['entree', 'plat', 'dessert'];
B.carte.TOUTES = ['entree', 'plat', 'dessert', 'boisson'];
B.carte.R = function () { return B.DATA.carte; };

/* ---------- Catalogue du lieu : ses spécialités + les classiques du bistrot ---------- */
B.carte._cache = {};
B.carte.catalogue = function (S) {
  if (B.carte._cache[S.lieu]) return B.carte._cache[S.lieu];
  const C = B.DATA.catalogue, classiques = {}, out = [], vus = {};
  C.classiques.forEach(function (d) { classiques[d.id] = d; });
  (C.specialites[S.lieu] || []).forEach(function (s) {
    const d = s.classique ? classiques[s.classique] : s;
    if (!d || vus[d.id]) return;
    vus[d.id] = true;
    out.push(Object.assign({}, d, { local: true }));
  });
  C.classiques.forEach(function (d) { if (!vus[d.id]) { vus[d.id] = true; out.push(Object.assign({}, d, { local: false })); } });
  (C.saisonniers && C.saisonniers[S.lieu] || []).forEach(function (d) { out.push(Object.assign({}, d, { local: true })); });
  (C.boissonsLocales && C.boissonsLocales[S.lieu] || []).forEach(function (d) { out.push(Object.assign({}, d, { local: true })); });
  (C.boissons || []).forEach(function (d) { out.push(Object.assign({}, d, { local: false })); });
  /* v0.8 : plats des menus de fête (à la carte seulement pendant la fête, si tu as dit oui) */
  if (B.ev) B.ev.platsDeFete(S).forEach(function (d) { if (!vus[d.id]) { vus[d.id] = true; out.push(Object.assign({}, d, { local: false })); } });
  out.forEach(function (d, i) { d.ordre = i; });
  B.carte._cache[S.lieu] = out;
  return out;
};
B.carte.plat = function (S, id) {
  const cat = B.carte.catalogue(S);
  if (!cat._index) { cat._index = {}; cat.forEach(function (d) { cat._index[d.id] = d; }); }
  return cat._index[id] || null;
};
B.carte.coefPrix = function (S) { return B.lieu(S.lieu).prix || 1; };
B.carte.prixConseille = function (S, d) {
  const a = B.DATA.carte.prix.arrondiConseille;
  return Math.max(B.DATA.carte.prix.minimum, Math.round(d.prixRef * B.carte.coefPrix(S) / a) * a);
};
/* Coût matière du jour : recette × prix de gros (Rungis) chez le fournisseur habituel, saison comprise. */
B.carte.cout = function (S, d) {
  let c = 0;
  for (const k in d.recette) c += B.stock.prixAchat(S, k, B.stock.habituel(S, k)) * d.recette[k];
  return Math.round(c * 100) / 100;
};
B.carte.enSaison = function (S, d) { if (d.fete) return B.ev.feteActive(S, d.fete); return !d.saison || d.saison.indexOf(B.mois(S)) >= 0; };
/* Les plats de fête viennent en plus de la carte : ils ne comptent pas dans le maximum. */
B.carte.horsFete = function (S, cat) { return B.carte.surCarte(S, cat).filter(function (id) { return !B.carte.plat(S, id).fete; }); };
B.carte.disponible = function (S, id) { const d = B.carte.plat(S, id); return !!d && (!S.stocks || B.stock.peutFaire(S, d.recette)); };
B.carte.marge = function (S, id) {
  const d = B.carte.plat(S, id), prix = S.carte.plats[id].prix, cout = B.carte.cout(S, d);
  return { prix: prix, cout: cout, marge: Math.round((prix - cout) * 100) / 100, pct: prix > 0 ? Math.round((prix - cout) / prix * 100) : 0, pctCout: prix > 0 ? Math.round(cout / prix * 100) : 0 };
};
B.carte.origineViande = function (S, d) {
  const I = B.DATA.catalogue.ingredients;
  const viandes = Object.keys(d.recette).filter(function (k) { return I[k] && I[k].viande; });
  if (!viandes.length) return null;
  /* origine du lot en réserve (le premier servi), sinon celle du fournisseur habituel */
  const lot = S.stocks && (S.stocks.lots[viandes[0]] || [])[0];
  return B.stock.origine(S, lot ? lot.four : B.stock.habituel(S, viandes[0]));
};

/* ---------- La carte du restaurant ---------- */
B.carte.creer = function (S) {
  const cat = B.carte.catalogue(S), L = B.DATA.carte.limites.max, plats = {};
  const depart = B.DATA.catalogue.carteDepartClassiques[S.lieu] || {};
  const n = { entree: 0, plat: 0, dessert: 0, boisson: 0 };
  cat.forEach(function (d) { plats[d.id] = { on: false, prix: B.carte.prixConseille(S, d) }; });
  const allumer = function (d) { if (!plats[d.id].on && n[d.cat] < L[d.cat]) { plats[d.id].on = true; n[d.cat]++; } };
  cat.forEach(function (d) { if (d.saison && B.carte.enSaison(S, d)) allumer(d); });
  B.carte.CATS.forEach(function (c) { (depart[c] || []).forEach(function (id) { const d = B.carte.plat(S, id); if (d) allumer(d); }); });
  cat.forEach(function (d) { if (d.local && d.cat !== 'boisson' && !d.saison) allumer(d); });
  cat.forEach(function (d) { if (d.cat === 'boisson' && !d.saison) allumer(d); });
  S.carte = { plats: plats };
  B.carte.completer(S);
};
/* Garantit le minimum par catégorie (et le maximum), sans rien inventer. */
B.carte.completer = function (S) {
  const cat = B.carte.catalogue(S), Lmin = B.DATA.carte.limites.min, Lmax = B.DATA.carte.limites.max;
  cat.forEach(function (d) { if (!S.carte.plats[d.id]) S.carte.plats[d.id] = { on: false, prix: B.carte.prixConseille(S, d) }; });
  cat.forEach(function (d) { if (S.carte.plats[d.id].on && !B.carte.enSaison(S, d)) S.carte.plats[d.id].on = false; });
  B.carte.TOUTES.forEach(function (c) {
    let on = B.carte.surCarte(S, c);
    for (const d of cat) { if (on.length >= Lmin[c]) break; if (d.cat === c && !S.carte.plats[d.id].on && B.carte.enSaison(S, d)) { S.carte.plats[d.id].on = true; on = B.carte.surCarte(S, c); } }
    on = B.carte.horsFete(S, c);
    while (on.length > Lmax[c]) { S.carte.plats[on[on.length - 1]].on = false; on = B.carte.horsFete(S, c); }
  });
};
B.carte.surCarte = function (S, cat) {
  return B.carte.catalogue(S).filter(function (d) { return (cat ? d.cat === cat : d.cat !== 'boisson') && S.carte.plats[d.id] && S.carte.plats[d.id].on; }).map(function (d) { return d.id; });
};
/* Ajoute ou retire un plat. Renvoie null, ou la clé du texte qui explique pourquoi c'est impossible. */
B.carte.basculer = function (S, id) {
  const d = B.carte.plat(S, id), p = S.carte.plats[id], L = B.DATA.carte.limites;
  if (!d || !p) return 'carte_inconnu';
  const n = B.carte.surCarte(S, d.cat).length;
  if (p.on && n <= L.min[d.cat]) return 'carte_min_' + d.cat;
  if (!p.on && !B.carte.enSaison(S, d)) return d.fete ? 'carte_hors_fete' : 'carte_hors_saison';
  if (!p.on && !d.fete && B.carte.horsFete(S, d.cat).length >= L.max[d.cat]) return 'carte_max_' + d.cat;
  p.on = !p.on;
  return null;
};
B.carte.changerPrix = function (S, id, sens) {
  const d = B.carte.plat(S, id), p = S.carte.plats[id], P = B.DATA.carte.prix;
  if (!d || !p) return;
  const max = Math.max(P.minimum, B.carte.prixConseille(S, d) * P.maxFoisConseille);
  p.prix = Math.round(Math.min(max, Math.max(P.minimum, p.prix + sens * P.pas)) * 100) / 100;
};
B.carte.indicePrix = function (S) {
  const ids = B.carte.surCarte(S);
  if (!ids.length) return 1;
  return ids.reduce(function (s, id) { return s + S.carte.plats[id].prix / B.carte.prixConseille(S, B.carte.plat(S, id)); }, 0) / ids.length;
};
B.carte.facteurAffluence = function (S) {
  const A = B.DATA.carte.affluencePrix;
  return Math.max(A.bornes[0], Math.min(A.bornes[1], Math.pow(B.carte.indicePrix(S), -A.elasticite)));
};

/* ---------- Commande : chacun choisit selon les prix et ses goûts ---------- */
B.carte.tirer = function (S, poids) {
  let tot = 0; poids.forEach(function (p) { tot += p.w; });
  if (tot <= 0) return null;
  let r = B.hasard(S) * tot;
  for (const p of poids) { r -= p.w; if (r < 0) return p.v; }
  return poids[poids.length - 1].v;
};
/* Le client choisit parmi la carte. Si son choix est en rupture, on le note (et la cause), puis il choisit autre chose. */
B.carte.choisirPlat = function (S, g, cat, type) {
  const R = B.DATA.carte.commande;
  const poids = B.carte.surCarte(S, cat).filter(function (id) { return !type || B.carte.plat(S, id).type === type; }).map(function (id) {
    const d = B.carte.plat(S, id), rapport = B.carte.prixConseille(S, d) / S.carte.plats[id].prix;
    let w = d.popularite * Math.pow(rapport, R.elasticiteChoix);
    if (d.local && g.type === 'touristes') w *= R.bonusSpecialiteTouristes;
    if (d.saison) w *= R.bonusSaison || 1.25;
    if (S.cal && cat !== 'boisson') w *= B.meteo.coefPlat(S, d);
    return { v: id, w: w };
  });
  const v = B.carte.tirer(S, poids);
  if (!v || !S.stocks || B.carte.disponible(S, v)) return v;
  B.stock.noterRupture(S, B.carte.plat(S, v));
  return B.carte.tirer(S, poids.filter(function (p) { return B.carte.disponible(S, p.v); }));
};
B.carte.indiceType = function (S, cat, type) {
  const ids = B.carte.surCarte(S, cat).filter(function (id) { return !type || B.carte.plat(S, id).type === type; });
  if (!ids.length) return null;
  return ids.reduce(function (s, id) { return s + S.carte.plats[id].prix / B.carte.prixConseille(S, B.carte.plat(S, id)); }, 0) / ids.length;
};
B.carte.probaCategorie = function (S, cat) {
  const R = B.DATA.carte.commande, ids = B.carte.surCarte(S, cat);
  if (!ids.length) return 0;
  const idx = ids.reduce(function (s, id) { return s + S.carte.plats[id].prix / B.carte.prixConseille(S, B.carte.plat(S, id)); }, 0) / ids.length;
  const f = Math.max(R.bornesEntreeDessert[0], Math.min(R.bornesEntreeDessert[1], Math.pow(idx, -R.elasticiteEntreeDessert)));
  return Math.min(0.95, (cat === 'entree' ? R.probaEntree : R.probaDessert) * f);
};
B.carte.zone = function (S) {
  const Z = B.DATA.carte.cuissons.zoneDuLieu;
  if (Z[S.lieu]) return Z[S.lieu];
  return B.lieu(S.lieu).groupe === 'outre-mer' ? 'dom' : 'fr';
};
B.carte.cuissonDemandee = function (S, type) {
  const C = B.DATA.carte.cuissons, opts = C.options[type], z = B.carte.zone(S);
  const w = type === 'boeuf' ? C.poidsBoeuf[z] || C.poidsBoeuf.fr : type === 'veau' ? C.poidsVeau : type === 'agneau' ? C.poidsAgneau : type === 'canard' ? C.poidsCanard : C.poidsBlanc[z] || C.poidsBlanc.fr;
  return B.carte.tirer(S, opts.map(function (o, i) { return { v: o, w: w[i] || 0 }; }));
};
B.carte.ligne = function (S, id) {
  const d = B.carte.plat(S, id);
  const cout = S.stocks ? B.stock.consommer(S, d.recette) : B.carte.cout(S, d);
  const l = { id: id, nom: d.nom, cat: d.cat, prix: S.carte.plats[id].prix, cout: cout };
  if (d.cuisson) { l.viande = d.cuisson; l.cuisson = B.carte.cuissonDemandee(S, d.cuisson); }
  return l;
};
/* Boissons : apéritif, vin ou boisson fraîche, boisson chaude. Un sommelier en salle ou au bar fait vendre plus de vin. */
B.carte.probaBoisson = function (S, base, type) {
  const idx = B.carte.indiceType(S, 'boisson', type);
  if (idx == null) return 0;
  const R = B.DATA.carte.commande;
  return base * (S.cal ? B.meteo.coefBoisson(S, type) : 1) * Math.max(R.bornesEntreeDessert[0], Math.min(R.bornesEntreeDessert[1], Math.pow(idx, -R.elasticiteEntreeDessert)));
};
B.carte.boissons = function (S, g) {
  const Bo = B.DATA.stocks.boissons, out = [];
  const prendre = function (type) { const id = B.carte.choisirPlat(S, g, 'boisson', type); if (id) out.push(B.carte.ligne(S, id)); };
  const som = B.equipe.sommelierPresent(S) ? B.DATA.equipe.effets.sommelierVin : 1;
  const bouteille = g.taille >= 2 && B.hasard(S) < som * B.carte.probaBoisson(S, Bo.probaBouteille, 'bouteille');
  if (bouteille) prendre('bouteille');
  for (let i = 0; i < g.taille; i++) {
    if (B.hasard(S) < B.carte.probaBoisson(S, Bo.probaApero, 'apero')) prendre('apero');
    if (!bouteille && B.hasard(S) < som * B.carte.probaBoisson(S, Bo.probaVin, 'vin')) prendre('vin');
    else if (B.hasard(S) < B.carte.probaBoisson(S, Bo.probaFraiche, 'froid')) prendre('froid');
    if (B.hasard(S) < B.carte.probaBoisson(S, Bo.probaChaude, 'chaud')) prendre('chaud');
  }
  return out;
};
B.carte.commander = function (S, g) {
  let lignes = [];
  for (let i = 0; i < g.taille; i++) {
    const m = S.stocks ? B.menuJour.commander(S, g) : null;
    if (m) { lignes = lignes.concat(m); continue; }
    if (B.hasard(S) < B.carte.probaCategorie(S, 'entree')) { const e = B.carte.choisirPlat(S, g, 'entree'); if (e) lignes.push(B.carte.ligne(S, e)); }
    const p = B.carte.choisirPlat(S, g, 'plat'); if (p) lignes.push(B.carte.ligne(S, p));
    if (B.hasard(S) < B.carte.probaCategorie(S, 'dessert')) { const d = B.carte.choisirPlat(S, g, 'dessert'); if (d) lignes.push(B.carte.ligne(S, d)); }
  }
  const aManger = lignes.some(function (l) { return l.cat === 'plat' || l.cat === 'menu'; });
  if (aManger) lignes = lignes.concat(B.carte.boissons(S, g));
  const ordre = { menu: 0, entree: 1, plat: 2, dessert: 3, boisson: 4 };
  lignes.forEach(function (l, k) { l.k = k; });
  lignes.sort(function (a, b) { return (a.mdj && b.mdj) ? a.k - b.k : (a.mdj ? 0 : ordre[a.cat] + 1) - (b.mdj ? 0 : ordre[b.cat] + 1) || a.k - b.k; });
  lignes.forEach(function (l) { delete l.k; });
  g.commande = lignes;
  const st = S.stats.jour;
  lignes.forEach(function (l) {
    st.coutMatiere += l.cout;
    if (l.cat === 'boisson') st.boissons = (st.boissons || 0) + 1;
    else if (!l.mdj) st.platsVendus[l.id] = (st.platsVendus[l.id] || 0) + 1;
  });
  return aManger;
};
/* Changement de mois : les plats et boissons de saison passés quittent la carte ; ceux qui arrivent sont signalés. */
B.carte.verifierSaisons = function (S) {
  const m = B.mois(S);
  if (S.stocks.moisCarte === m) return;
  S.stocks.moisCarte = m;
  const fin = [], debut = [], sansPlace = [], L = B.DATA.carte.limites.max;
  B.carte.catalogue(S).forEach(function (d) {
    if (!d.saison) return;
    const p = S.carte.plats[d.id];
    if (p && p.on && !B.carte.enSaison(S, d)) { p.on = false; fin.push(d.nom); }
  });
  /* les nouveautés de saison prennent la place libre (celle des plats qui viennent de partir) */
  B.carte.catalogue(S).forEach(function (d) {
    if (!d.saison || !B.carte.enSaison(S, d) || d.saison.indexOf((m + 11) % 12) >= 0) return;
    const p = S.carte.plats[d.id];
    if (p.on) return;
    if (B.carte.surCarte(S, d.cat).length < L[d.cat]) { p.on = true; debut.push(d.nom); } else sansPlace.push(d.nom);
  });
  B.carte.completer(S);
  if (fin.length) B.message(S, 'msg_fin_saison', { liste: fin.join(', ') });
  if (debut.length) B.message(S, 'msg_debut_saison', { liste: debut.join(', ') });
  if (sansPlace.length) B.message(S, 'msg_debut_saison_place', { liste: sansPlace.join(', ') });
};

/* ---------- Cuissons : réussies ou ratées selon la qualité du cuisinier (+1 si le chef, ou à défaut le second, est là) ---------- */
B.carte.finirCuisson = function (S, g) {
  const E = B.DATA.carte.cuissons.erreur, C = B.DATA.carte.cuissons;
  const cuisinier = S.equipe.find(function (p) { return p.id === g.cuisinier; });
  const q = B.equipe.qualiteCuisson(S, cuisinier);
  const proba = Math.max(E.min, Math.min(E.max, E.base - E.parPointDeQualite * q));
  (g.commande || []).forEach(function (l) {
    if (!l.cuisson) return;
    if (l.renvoye || g.refait) { l.servie = l.cuisson; return; }   /* le plat refait est juste */
    if (B.hasard(S) >= proba) { l.servie = l.cuisson; return; }
    const o = C.options[l.viande], k = o.indexOf(l.cuisson);
    let j = B.hasard(S) < E.versTropCuit ? k + 1 : k - 1;
    if (j < 0 || j >= o.length) j = j < 0 ? k + 1 : k - 1;
    l.servie = o[Math.max(0, Math.min(o.length - 1, j))];
    l.cuisinier = cuisinier ? cuisinier.nom : null;
  });
};
/* Au service : un plat dont la cuisson est ratée est renvoyé en cuisine et refait. Renvoie true si renvoi. */
B.carte.verifierService = function (S, g) {
  const rate = (g.commande || []).filter(function (l) { return l.cuisson && l.servie && l.servie !== l.cuisson && !l.renvoye; });
  if (!rate.length) return false;
  const N = B.DATA.carte.cuissons.noms;
  rate.forEach(function (l) {
    l.renvoye = true; S.stats.jour.platsRenvoyes++;
    const d = B.carte.plat(S, l.id) || B.menuJour.plat(S, l.id);
    const c = d && S.stocks && B.stock.peutFaire(S, d.recette) ? B.stock.consommer(S, d.recette) : l.cout;
    S.stats.jour.coutMatiere += c;
    B.message(S, 'msg_plat_renvoye', { table: g.tables[0], plat: l.nom, demande: N[l.cuisson].toLowerCase(), servie: N[l.servie].toLowerCase() });
  });
  g.refait = true; g.etat = 'cuisine'; g.cuisinier = null; g.pret = null;
  return true;
};

/* ---------- Paiement à la fin du repas ---------- */
B.carte.etoiles = function (S, g) {
  const R = B.DATA.carte.satisfaction;
  let s = R.base;
  if (g.attenteCommande != null && g.attenteCommande > B.DATA.clients.alertes.attenteRouge) s += R.attenteLongue;
  if ((g.commande || []).some(function (l) { return l.renvoye; })) s += R.platRenvoye;
  /* équipe : amabilité de ceux qui ont pris la commande et l'addition, responsable de salle, propreté */
  const E = B.DATA.equipe.effets;
  if (g.amabN) s += E.amabiliteParPoint * (g.amabS / g.amabN - 5);
  if (B.equipe.aLePoste(S, 'resp')) s += E.respEtoiles;
  s -= B.planning.malusProprete(S);
  if (g.critique && S.cal) s += B.ev.etoilesCritique(g);   /* v0.8.1 : le critique est exigeant ; l'apéritif offert aide */
  const lignes = g.commande || [];
  if (lignes.length) {
    const pay = lignes.filter(function (l) { return l.prix > 0; });
    const idx = pay.length ? pay.reduce(function (a, l) {
      if (l.cat === 'menu') return a + l.prix / (B.menuJour.prixConseilles(S)[l.id.slice(4)] || l.prix);
      const d = B.carte.plat(S, l.id); return a + (d ? l.prix / B.carte.prixConseille(S, d) : 1);
    }, 0) / pay.length : 1;
    s += R.prixParPoint * (idx - 1);
  }
  return Math.max(1, Math.min(5, Math.round(s * 10) / 10));
};
B.carte.pourboire = function (S, g, total, etoiles) {
  const P = B.DATA.carte.pourboires, T = B.DATA.catalogue.pourboires[S.lieu];
  const tm = { famille: 0.9, touristes: 1.15, affaires: 0.9 }[g.type] || 1;
  const monnaie = function () { return P.monnaies[B.entier(S, 0, P.monnaies.length - 1)]; };
  let t;
  if (!(total > 0)) return 0;
  if (!T) {
    const F = P.france;
    const p = Math.max(F.min, Math.min(F.max, (F.base + F.parEtoile * (etoiles - 3)) * tm));
    if (B.hasard(S) > p) return 0;
    t = total * (F.pctBase + F.pctParEtoile * Math.max(0, Math.min(1.5, etoiles - 3.5)) + B.hasard(S) * F.pctHasard);
    if (etoiles < 4.3 && B.hasard(S) < F.monnaie) t = monnaie();
  } else {
    if (!T[0]) return 0;
    const p = Math.max(0.01, Math.min(T[0] >= 2.5 ? 0.95 : 0.85, (0.10 + 0.22 * (etoiles - 3)) * tm * T[0]));
    if (B.hasard(S) > p) return 0;
    if (T[3] && B.hasard(S) < 0.7) t = monnaie();
    else t = total * (T[1] + (T[2] - T[1]) * (0.6 * Math.max(0, Math.min(1, (etoiles - 3) / 2)) + 0.4 * B.hasard(S)));
  }
  t = Math.max(0.5, t);
  t = t < 5 ? Math.round(t * 2) / 2 : Math.round(t);
  return Math.min(400, t);
};
B.carte.payer = function (S, g) {
  if (g.paye) return;
  if (!g.commande) B.carte.commander(S, g);
  const total = Math.round(g.commande.reduce(function (s, l) { return s + l.prix; }, 0) * 100) / 100;
  const etoiles = B.carte.etoiles(S, g);
  const tip = B.carte.pourboire(S, g, total, etoiles);
  g.paye = true; g.total = total; g.pourboire = tip; g.etoiles = etoiles;
  if (g.critique && S.cal) B.ev.avisCritique(S, g, etoiles);
  S.argent = Math.round((S.argent + total) * 100) / 100;
  S.cagnotte = Math.round(((S.cagnotte || 0) + tip) * 100) / 100;
  const st = S.stats.jour;
  st.recettes = Math.round((st.recettes + total) * 100) / 100;
  st.pourboires = Math.round((st.pourboires + tip) * 100) / 100;
  st.couverts += g.taille; st.tickets++;
  S.tickets = (S.tickets || []);
  S.tickets.unshift({ jour: S.jour, minute: Math.floor(S.minute), table: (g.tables || [])[0], taille: g.taille, nom: g.nom, type: g.type, lignes: g.commande, total: total, pourboire: tip });
  if (S.tickets.length > 30) S.tickets.length = 30;
  B.noter(S, tip > 0 ? 'msg_paiement_pourboire' : 'msg_paiement', { table: (g.tables || [])[0], total: B.euros(total), pourboire: B.euros(tip), n: g.taille });
};

B.carte.meilleurPlat = function (S) {
  const v = S.stats.jour.platsVendus || {};
  let best = null;
  for (const id in v) if (!best || v[id] > v[best]) best = id;
  const d = best && B.carte.plat(S, best);
  return d ? { nom: d.nom, n: v[best] } : null;
};
