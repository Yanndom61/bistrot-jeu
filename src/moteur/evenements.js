/* evenements.js — étape 6 (v0.8) : menus de fête proposés par le chef, événements du jour (bus de touristes,
   grand match, pluie battante, canicule) et événements privés (anniversaires, séminaires…). Repris de l'ancien jeu.
   Données : donnees/calendrier.json. État dans la partie : S.cal. */
B.evenements = {};
B.ev = B.evenements;
B.ev.D = function () { return B.DATA.calendrier; };
B.ev.etatVide = function () { return { fetes: {}, prives: [], prochainId: 1, prochain: null, attente: null, effets: [], recharge: {}, arrivees: [] }; };
B.ev.etat = function (S) { if (!S.cal) S.cal = B.ev.etatVide(); return S.cal; };

/* =================== Menus de fête =================== */
/* Menus possibles dans ce lieu (ceux que l'ancien jeu retirait ne sont pas proposés). */
B.ev.menusDuLieu = function (S) {
  const M = B.ev.D().menusDeFete, L = B.cal.lieu(S);
  return M.ordre.filter(function (k) {
    if ((L.menusRetires || []).indexOf(k) >= 0) return false;
    if (k === 'loc') return !!L.feteLocale;
    return true;
  });
};
B.ev.infoMenu = function (S, k) {
  const M = B.ev.D().menusDeFete, L = B.cal.lieu(S), base = M.menus[k] || {}, ren = (L.menusRenommes || {})[k];
  if (k === 'loc' && L.feteLocale) return { nom: L.feteLocale.nom, emoji: base.emoji };
  return { nom: ren ? ren.nom : base.nom, emoji: ren ? ren.emoji : base.emoji };
};
/* Plats d'un menu de fête pour ce lieu. La fête nationale d'un pays reprend ses spécialités (comme l'ancien jeu). */
B.ev._plats = {};
B.ev.platsDeFete = function (S) {
  if (B.ev._plats[S.lieu]) return B.ev._plats[S.lieu];
  const M = B.ev.D().menusDeFete, L = B.cal.lieu(S), out = [];
  B.ev.menusDuLieu(S).forEach(function (k) {
    let ds = M.plats[k] || [];
    if (k === 'loc') ds = L.feteLocale.plats;
    if (k === 'j14' && (L.menusRenommes || {}).j14) {
      const sp = (B.DATA.catalogue.specialites[S.lieu] || []).filter(function (s) { return !s.classique; });
      ds = ['plat', 'dessert'].map(function (c) { const s = sp.find(function (x) { return x.cat === c; }); return s ? Object.assign({}, s, { id: 'f_nat_' + S.lieu + '_' + c, popularite: 1.5 }) : null; }).filter(Boolean);
    }
    ds.forEach(function (d) { out.push(Object.assign({}, d, { fete: k })); });
  });
  B.ev._plats[S.lieu] = out;
  return out;
};
/* Fenêtres [début, fin] (numéros de jour depuis 1970) d'un menu, autour de la date n. */
B.ev.fenetres = function (S, k, n) {
  const M = B.ev.D().menusDeFete, L = B.cal.lieu(S), y = B.cal.date(n).y, out = [];
  if (k === 'vac') {
    [0, 7].forEach(function (dec) { const v = B.cal.vacances(S, n + dec); if (v && !out.some(function (w) { return w[0] === v.debut; })) out.push([v.debut, v.fin, v.nom]); });
    return out;
  }
  const f = k === 'loc' ? L.feteLocale.fenetre : (L.fenetres || {})[k] || M.menus[k].fenetre;
  [y - 1, y, y + 1].forEach(function (a) { out.push(B.cal.fenetre(f, a)); });
  return out;
};
/* Chaque matin : le chef propose les menus de fête 7 jours avant, et ceux acceptés passent à la carte pendant la fête. */
B.ev.matinFetes = function (S) {
  const C = B.ev.etat(S), n0 = B.cal.serieDuJour(S, 0), avant = B.ev.D().menusDeFete.proposerJoursAvant;
  B.ev.menusDuLieu(S).forEach(function (k) {
    B.ev.fenetres(S, k, n0).forEach(function (w) {
      if (w[1] < n0 || w[0] > n0 + avant) return;
      const id = k + ':' + w[0];
      if (C.fetes[id]) return;
      const debut = B.cal.jourDe(S, w[0]), fin = B.cal.jourDe(S, w[1]);
      C.fetes[id] = { id: id, k: k, debut: debut, fin: fin, etat: 'propose', vac: w[2] || null };
      const info = B.ev.infoMenu(S, k);
      B.message(S, 'msg_fete_propose', { emoji: info.emoji, nom: info.nom, de: B.ev.texteJour(S, debut), a: B.ev.texteJour(S, fin) });
    });
  });
  /* on oublie les fêtes passées depuis plus de 30 jours */
  for (const id in C.fetes) if (C.fetes[id].fin < S.jour - 30) delete C.fetes[id];
  B.ev.appliquerFetes(S, true);
};
B.ev.feteActive = function (S, k) {
  const C = S.cal;
  if (!C) return false;
  for (const id in C.fetes) { const f = C.fetes[id]; if (f.k === k && f.etat === 'oui' && S.jour >= f.debut && S.jour <= f.fin) return true; }
  return false;
};
/* Met à la carte les plats des menus acceptés en cours, et retire les autres. */
B.ev.appliquerFetes = function (S, annoncer) {
  if (!S.carte) return;
  const C = B.ev.etat(S);
  B.ev.platsDeFete(S).forEach(function (d) {
    const p = S.carte.plats[d.id];
    if (!p) return;
    const actif = B.ev.feteActive(S, d.fete);
    if (actif && !p.on) p.on = true;
    if (!actif && p.on) p.on = false;
  });
  if (annoncer) for (const id in C.fetes) {
    const f = C.fetes[id];
    if (f.etat === 'oui' && f.debut === S.jour) { const info = B.ev.infoMenu(S, f.k); B.message(S, 'msg_fete_debut', { emoji: info.emoji, nom: info.nom, a: B.ev.texteJour(S, f.fin) }); }
  }
};
B.ev.repondreFete = function (S, id, oui) {
  const f = B.ev.etat(S).fetes[id];
  if (!f || f.etat !== 'propose' || f.fin < S.jour) return false;
  f.etat = oui ? 'oui' : 'non';
  if (oui) {
    /* les plats arrivent avec leur prix conseillé */
    B.ev.platsDeFete(S).forEach(function (d) { if (d.fete === f.k && S.carte.plats[d.id]) S.carte.plats[d.id].prix = B.carte.prixConseille(S, d); });
    B.ev.appliquerFetes(S, false);
  }
  const info = B.ev.infoMenu(S, f.k);
  B.message(S, oui ? 'msg_fete_oui' : 'msg_fete_non', { emoji: info.emoji, nom: info.nom, de: B.ev.texteJour(S, f.debut), a: B.ev.texteJour(S, f.fin) });
  return true;
};
B.ev.fetesEnAttente = function (S) {
  const C = B.ev.etat(S);
  return Object.keys(C.fetes).map(function (id) { return C.fetes[id]; }).filter(function (f) { return f.etat === 'propose' && f.fin >= S.jour; }).sort(function (a, b) { return a.debut - b.debut; });
};
B.ev.texteJour = function (S, jour) { return B.texteDate(S, jour - S.jour); };

/* =================== Événements du jour =================== */
B.ev.defEvenement = function (id) { return B.ev.D().evenementsDuJour.liste.find(function (e) { return e.id === id; }); };
B.ev.matinDuJour = function (S) {
  const E = B.ev.D().evenementsDuJour, C = B.ev.etat(S), J = B.DATA.clients.journee;
  if (C.attente) { if (C.attente.id === 'canicule') B.ev.choisir(S, 1); C.attente = null; }   /* pas de réponse avant la fin du service : canicule = fenêtres ouvertes, le reste tombe */
  C.effets = C.effets.filter(function (f) { return f.jusqua >= S.jour; });
  C.arrivees = [];
  C.prochain = null;
  if (S.jour < E.aPartirDuJour || B.hasard(S) > E.proba) return;
  const pool = E.liste.filter(function (e) { return !(C.recharge[e.id] > S.jour); });
  if (!pool.length) return;
  let tot = 0; pool.forEach(function (e) { tot += e.poids; });
  let r = B.hasard(S) * tot, ev = pool[0];
  for (const e of pool) { r -= e.poids; if (r <= 0) { ev = e; break; } }
  if (!ev.actif) return;   /* événement d'une autre étape : rien encore */
  const met = B.meteo.aujourdhui(S);
  if (ev.id === 'pluie' && met.ciel !== 'pluie' && met.ciel !== 'neige') return;
  if (ev.id === 'canicule' && met.temp < ev.tempMin) return;
  const minute = ev.quand === 'matin' ? J.ouverture + B.entier(S, E.matin[0], E.matin[1])
    : J.ouverture + (B.hasard(S) < E.partMidi ? B.entier(S, E.serviceMidi[0], E.serviceMidi[1]) : B.entier(S, E.serviceSoir[0], E.serviceSoir[1]));
  C.prochain = { id: ev.id, minute: minute };
  if (ev.recharge) C.recharge[ev.id] = S.jour + ev.recharge;
};
B.ev.sport = function (S) { return B.cal.lieu(S).sport || B.ev.D().evenementsDuJour.sportParDefaut; };
/* L'événement arrive : il attend le choix du joueur (une fenêtre à l'écran ; le simulateur choisit tout seul). */
B.ev.declencher = function (S) {
  const C = S.cal, p = C.prochain;
  C.prochain = null;
  const def = B.ev.defEvenement(p.id), L = B.cal.lieu(S);
  const a = { id: p.id, minute: Math.floor(S.minute), variante: L.tropical && (p.id === 'pluie' || p.id === 'canicule') ? 'tropical' : '' };
  if (p.id === 'match') { const sp = B.ev.sport(S); a.sport = sp.nom; a.emoji = sp.emoji; }
  if (p.id === 'pluie') C.effets.push({ k: 'pluie', m: def.coef, de: 0, jusqua: S.jour });
  C.attente = a;
  B.message(S, 'msg_ev_' + p.id + (a.variante ? '_' + a.variante : ''), { sport: a.sport || '' });
  if (B.ev.choixAuto) B.ev.choisir(S, B.ev.choixAuto(S, a));
};
/* Les choix possibles : [{ cle du texte, prix }] */
B.ev.choix = function (S, a) {
  const d = B.ev.defEvenement(a.id);
  if (a.id === 'bus') return [{ cle: 'ev_bus_oui' }, { cle: 'ev_bus_non' }];
  if (a.id === 'match') return [{ cle: 'ev_match_ecran', prix: d.prixEcran }, { cle: 'ev_match_rien' }];
  if (a.id === 'canicule') return [{ cle: 'ev_canicule_clim', prix: d.prixClim }, { cle: 'ev_canicule_fenetres' }];
  return [{ cle: 'ev_ok' }];
};
B.ev.choisir = function (S, k) {
  const C = B.ev.etat(S), a = C.attente;
  if (!a) return false;
  const d = B.ev.defEvenement(a.id), E = B.ev.D().evenementsDuJour, ch = B.ev.choix(S, a)[k] || B.ev.choix(S, a)[0];
  C.attente = null;
  let payer = ch.prix || 0;
  if (payer && !B.argent.peutPayer(S, payer, false)) { B.message(S, 'msg_ev_pas_assez', { prix: B.euros(payer) }); payer = 0; k = 1; }
  if (payer) B.argent.payer(S, 'divers', payer);
  if (a.id === 'bus' && k === 0) {
    for (let i = 0; i < E.bus.groupes; i++) C.arrivees.push(Math.floor(S.minute) + i * E.bus.ecartMinutes + B.entier(S, 0, 3));
    B.message(S, 'msg_ev_bus_arrive');
  } else if (a.id === 'match') {
    C.effets.push({ k: 'match', m: k === 0 ? d.coefEcran : d.coefRien, de: d.aPartirDe, jusqua: S.jour });
  } else if (a.id === 'canicule') {
    C.effets.push({ k: 'canicule', m: k === 0 ? d.coefClim : d.coefFenetres, de: 0, jusqua: S.jour + d.jours - 1 });
  }
  return true;
};
B.ev.facteur = function (S, minute) {
  let f = 1;
  (S.cal ? S.cal.effets : []).forEach(function (x) { if (x.jusqua >= S.jour && minute >= (x.de || 0)) f *= x.m; });
  return f;
};

/* =================== Événements privés =================== */
B.ev.P = function () { return B.ev.D().evenementsPrives; };
B.ev.prive = function (S, id) { return B.ev.etat(S).prives.find(function (e) { return e.id === id; }); };
B.ev.typePrive = function (S, k) {
  const T = B.ev.P().types[k], L = B.cal.lieu(S);
  return k === 'loc' ? Object.assign({}, T, { nom: L.evenementPrive || T.nom, poids: L.evenementPrive ? T.poids : 0 }) : T;
};
B.ev.places = function (S) { return S.tables.reduce(function (s, t) { return s + t.places; }, 0); };
B.ev.ouverts = function (S) { return B.ev.etat(S).prives.filter(function (e) { return ['appel', 'nego', 'contre'].indexOf(e.etat) >= 0; }); };
B.ev.jourPris = function (S, jour) { return B.ev.etat(S).prives.some(function (e) { return e.jour === jour && ['appel', 'nego', 'contre', 'reserve'].indexOf(e.etat) >= 0; }); };
B.ev.genererPrive = function (S) {
  const P = B.ev.P(), C = B.ev.etat(S);
  if (S.jour < P.aPartirDuJour || B.ev.ouverts(S).length >= P.demandesMax) return;
  const mo = B.mois(S);
  if (B.hasard(S) > P.probaParJour * (mo >= 4 && mo <= 8 ? P.bonusMaiSeptembre : 1)) return;
  const ks = Object.keys(P.types);
  let tot = 0; ks.forEach(function (k) { tot += B.ev.typePrive(S, k).poids; });
  let r = B.hasard(S) * tot, k = ks[0];
  for (const x of ks) { r -= B.ev.typePrive(S, x).poids; if (r <= 0) { k = x; break; } }
  const cap = Math.floor(B.ev.places(S) * P.partDesPlaces);
  let T = B.ev.typePrive(S, k);
  const n = Math.min(B.entier(S, T.personnes[0], T.personnes[1]), Math.max(P.minimumPersonnes, cap));
  if (n < T.personnes[0] && k === 'mariage') { k = 'famille'; T = B.ev.typePrive(S, k); }
  for (let essai = 0; essai < 30; essai++) {
    const jour = S.jour + B.entier(S, T.delai[0], T.delai[1]), serie = B.cal.serieDuJour(S, jour - S.jour), js = B.cal.date(serie).js;
    if (T.samedi && js !== 6) continue;
    if (T.semaine && (js === 0 || js === 6 || B.cal.ferie(S, serie))) continue;
    if (B.ev.jourPris(S, jour)) continue;
    const budget = Math.round((T.budget[0] + B.hasard(S) * (T.budget[1] - T.budget[0])) * (B.lieu(S.lieu).prix || 1));
    const service = (k === 'sem' || ((js === 0 || js === 6) && B.hasard(S) < 0.5)) ? 'midi' : 'soir';
    const noms = B.lieu(S.lieu).nomsClients;
    const e = { id: C.prochainId++, type: k, nom: noms[B.entier(S, 0, noms.length - 1)], n: n, jour: jour, appel: S.jour, expire: S.jour + P.joursPourRepondre,
      etat: 'appel', plats: [], prix: 0, budget: budget, tours: 0, acompte: 0, service: service, debut: P[service].debut, fin: P[service].fin, tables: [] };
    e.plats = B.ev.menuPrive(S, e);
    e.prix = B.ev.prixConseille(S, e);
    C.prives.push(e);
    B.message(S, 'msg_prive_appel', { emoji: T.emoji, nom: e.nom, type: T.nom, n: n, date: B.ev.texteJour(S, jour) });
    return;
  }
};
B.ev.minuscule = function (t) { return /^[A-Z]{2,}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); };
/* Le chef propose un menu pris dans la carte (pas d'entrée pour un séminaire). */
B.ev.menuPrive = function (S, e) {
  return ['entree', 'plat', 'dessert'].map(function (c) {
    if (e.type === 'sem' && c === 'entree') return null;
    const ids = B.carte.surCarte(S, c).filter(function (id) { return !B.carte.plat(S, id).fete; });
    return ids.length ? ids[B.entier(S, 0, ids.length - 1)] : null;
  }).filter(Boolean);
};
B.ev.coutParPersonne = function (S, e) {
  const P = B.ev.P();
  return B.r2(e.plats.reduce(function (s, id) { const d = B.carte.plat(S, id); return s + (d ? B.carte.cout(S, d) : 0); }, 0) * P.margeCout + P.servicePersonne);
};
B.ev.prixConseille = function (S, e) { return Math.ceil(B.ev.coutParPersonne(S, e) * B.ev.P().coefConseille); };
B.ev.changerPrix = function (S, id, delta) {
  const e = B.ev.prive(S, id);
  if (!e || (e.etat !== 'appel' && e.etat !== 'nego')) return;
  e.prix = Math.max(Math.ceil(B.ev.coutParPersonne(S, e)), Math.min(999, e.prix + delta));
};
/* On envoie le prix : le client accepte, fait une contre-offre, demande de revoir, ou refuse (règle de l'ancien jeu). */
B.ev.proposer = function (S, id) {
  const e = B.ev.prive(S, id), P = B.ev.P();
  if (!e || (e.etat !== 'appel' && e.etat !== 'nego') || S.finJour) return null;
  e.tours++;
  const r = e.prix / e.budget;
  if (r <= 1) { B.ev.accepter(S, e, e.prix); return 'accepte'; }
  if (r <= P.contreOffreJusqua && e.tours <= P.toursMax) { e.contre = e.budget; e.etat = 'contre'; return 'contre'; }
  if (e.tours >= P.toursMax) { e.etat = 'perdu'; e.pourquoi = 'prix'; B.message(S, 'msg_prive_perdu_prix', { nom: e.nom }); return 'perdu'; }
  e.etat = 'nego';
  return 'nego';
};
B.ev.accepter = function (S, e, prix) {
  const P = B.ev.P(), T = B.ev.typePrive(S, e.type);
  e.prix = prix; e.etat = 'reserve';
  e.acompte = Math.round(e.n * prix * P.acompte);
  S.argent = B.r2(S.argent + e.acompte);
  B.argent.compter(S, 'recettes', e.acompte);
  B.message(S, 'msg_prive_reserve', { emoji: T.emoji, nom: e.nom, date: B.ev.texteJour(S, e.jour), n: e.n, prix: B.euros(prix), acompte: B.euros(e.acompte) });
};
B.ev.accepterContre = function (S, id) { const e = B.ev.prive(S, id); if (!e || e.etat !== 'contre' || S.finJour) return false; B.ev.accepter(S, e, e.contre); return true; };
B.ev.decliner = function (S, id) {
  const e = B.ev.prive(S, id);
  if (!e || ['appel', 'nego', 'contre'].indexOf(e.etat) < 0) return false;
  e.etat = 'perdu'; e.pourquoi = 'decline';
  B.message(S, 'msg_prive_decline', { nom: e.nom });
  return true;
};
B.ev.matinPrives = function (S) {
  const C = B.ev.etat(S);
  C.prives.forEach(function (e) {
    if (['appel', 'nego', 'contre'].indexOf(e.etat) >= 0 && (S.jour > e.expire || S.jour >= e.jour)) { e.etat = 'perdu'; e.pourquoi = 'sans_reponse'; B.message(S, 'msg_prive_sans_reponse', { nom: e.nom }); }
    else if (e.etat === 'reserve' && e.jour < S.jour) {
      e.etat = 'perdu'; e.pourquoi = 'annule';
      B.argent.payer(S, 'divers', e.acompte);
      B.message(S, 'msg_prive_annule', { nom: e.nom, acompte: B.euros(e.acompte) });
    } else if (e.etat === 'reserve' && e.jour === S.jour) {
      const T = B.ev.typePrive(S, e.type);
      B.message(S, 'msg_prive_aujourdhui', { emoji: T.emoji, nom: e.nom, n: e.n, heure: B.heure(e.debut) });
    }
  });
  /* on garde les 12 derniers événements terminés ou perdus */
  const vivants = C.prives.filter(function (e) { return e.etat !== 'fini' && e.etat !== 'perdu'; });
  const morts = C.prives.filter(function (e) { return e.etat === 'fini' || e.etat === 'perdu'; }).slice(-12);
  C.prives = morts.concat(vivants);
  B.ev.genererPrive(S);
};
/* Le jour J : des tables sont gardées une heure avant, les convives mangent, puis le solde est payé. */
B.ev.pasPrives = function (S) {
  const P = B.ev.P();
  S.cal.prives.forEach(function (e) {
    if (e.etat !== 'reserve' || e.jour !== S.jour) return;
    if (S.minute >= e.debut - P.reserverAvant && S.minute < e.fin) B.ev.tenirTables(S, e);
    if (S.minute >= e.debut && !e.installe) {
      e.installe = true;
      const T = B.ev.typePrive(S, e.type);
      B.message(S, e.places >= e.n ? 'msg_prive_installe' : 'msg_prive_installe_manque', { emoji: T.emoji, nom: e.nom, n: e.n, places: e.places || 0 });
    }
    if (S.minute >= e.fin) B.ev.finirPrive(S, e);
  });
};
B.ev.tenirTables = function (S, e) {
  let cap = 0;
  S.tables.forEach(function (t) { if (t.reserve === e.id) cap += t.places; });
  for (const t of S.tables) {
    if (cap >= e.n) break;
    if (!t.groupe && !t.reserve && !t.sale) { t.reserve = e.id; cap += t.places; }
  }
  e.places = cap;
};
B.ev.libererTables = function (S, e) { S.tables.forEach(function (t) { if (t.reserve === e.id) t.reserve = null; }); };
B.ev.finirPrive = function (S, e) {
  const st = S.stats.jour, T = B.ev.typePrive(S, e.type);
  let cout = 0, servis = 0, total = 0;
  e.plats.forEach(function (id) {
    const d = B.carte.plat(S, id);
    if (!d) return;
    for (let i = 0; i < e.n; i++) {
      total++;
      if (B.stock.peutFaire(S, d.recette)) { cout += B.stock.consommer(S, d.recette); servis++; st.platsVendus[id] = (st.platsVendus[id] || 0) + 1; }
    }
  });
  const solde = Math.max(0, B.r2(e.n * e.prix - e.acompte));
  S.argent = B.r2(S.argent + solde);
  st.recettes = B.r2(st.recettes + solde);
  st.coutMatiere = B.r2(st.coutMatiere + cout);
  st.arrives += e.n; st.servis += e.n; st.couverts += e.n; st.tickets++;
  st.prives = (st.prives || 0) + 1;
  e.etat = 'fini'; e.ratio = total ? servis / total : 1; e.cout = B.r2(cout);
  B.ev.libererTables(S, e);
  B.message(S, e.ratio < 1 ? 'msg_prive_fini_manque' : 'msg_prive_fini', { emoji: T.emoji, nom: e.nom, total: B.euros(e.n * e.prix), solde: B.euros(solde), pct: Math.round(e.ratio * 100) });
};
/* Besoin d'ingrédients des événements privés d'un jour (pour la commande automatique). */
B.ev.besoinPrives = function (S, jour) {
  const out = {};
  (S.cal ? S.cal.prives : []).forEach(function (e) {
    if (e.etat !== 'reserve' || e.jour !== jour) return;
    e.plats.forEach(function (id) { const d = B.carte.plat(S, id); if (d) for (const i in d.recette) out[i] = (out[i] || 0) + d.recette[i] * e.n; });
  });
  return out;
};

/* =================== Chaque matin, et à chaque pas =================== */
B.ev.matin = function (S) {
  B.ev.etat(S);
  B.ev.matinFetes(S);
  B.ev.matinPrives(S);
  B.ev.matinDuJour(S);
  const i = B.cal.infos(S, 0);
  if (i.ferie) B.message(S, 'msg_cal_ferie', { nom: i.ferie.nom });
  else if (i.fete) B.message(S, 'msg_cal_fete', { emoji: i.fete.emoji, nom: i.fete.nom });
  if (i.vacances && i.vacances.debut === i.serie) B.message(S, 'msg_cal_vacances', { emoji: i.vacances.emoji, nom: i.vacances.nom });
  B.message(S, 'msg_meteo_jour', { emoji: i.meteo.emoji, temp: i.meteo.temp, ciel: B.t('ciel_' + i.meteo.ciel) });
};
B.ev.pas = function (S) {
  const C = S.cal;
  if (!C) return;
  if (C.prochain && !C.attente && S.minute >= C.prochain.minute) B.ev.declencher(S);
  if (C.arrivees.length) {
    const garde = [];
    C.arrivees.forEach(function (m) { if (S.minute >= m && S.minute < B.DATA.clients.journee.fermeture) B.clients.arrivee(S, { type: 'touristes', patience: B.ev.D().evenementsDuJour.bus.patience }); else if (S.minute < m) garde.push(m); });
    C.arrivees = garde;
  }
  if (C.prives.length) B.ev.pasPrives(S);
};
