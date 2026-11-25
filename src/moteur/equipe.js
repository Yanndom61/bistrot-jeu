/* equipe.js — l'équipe : le patron, les employés, les candidats, les entretiens et l'embauche.
   Plannings, formations, cagnotte et effets des postes : voir planning.js. */
B.equipe = {};

B.equipe.D = function () { return B.DATA.equipe; };
B.equipe.poste = function (id) { return B.DATA.equipe.postes[id]; };
B.equipe.nomPoste = function (p) {
  const P = B.equipe.poste(p.poste);
  if (!P) return p.poste;
  return p.genre === 'f' ? P.nomF : P.nom;
};

/* Texte au choix dans une liste de textes.json, avec accords selon le genre. */
B.tChoix = function (cle, n, vars, genre) {
  let s = B.DATA.textes[cle];
  if (s == null) { B.textesManquants[cle] = true; return ''; }
  if (Array.isArray(s)) s = s[Math.abs(n | 0) % s.length];
  const f = genre === 'f';
  const accords = { e: f ? 'e' : '', ere: f ? 'ère' : 'er', le: f ? 'la' : 'le', nerveux: f ? 'nerveuse' : 'nerveux', il: f ? 'elle' : 'il', Il: f ? 'Elle' : 'Il' };
  return String(s).replace(/\{(\w+)\}/g, function (m, k) {
    if (vars && vars[k] != null) return vars[k];
    if (accords[k] != null) return accords[k];
    return m;
  });
};

/* ---------- Salaires : grille officielle HCR × coefficient du lieu ---------- */
B.equipe.echelon = function (exp) {
  for (const e of B.DATA.equipe.echelonSelonExperience) if (exp <= e.jusqua) return e.echelon;
  return 3;
};
B.equipe.minimum = function (S, poste, exp) {
  const P = B.equipe.poste(poste), G = B.DATA.equipe.grilleHCR;
  let h = G[P.niveauHCR][B.equipe.echelon(exp) - 1];
  if (P.partDuMinimum) h = G.I[0] * P.partDuMinimum;
  return Math.round(h * Math.max(1, B.lieu(S.lieu).salaires) * 100) / 100;
};
B.equipe.parMois = function (horaire) { return horaire * B.DATA.equipe.heuresParMois39h; };
B.equipe.euroHeure = function (n) { return n.toFixed(2).replace('.', ',') + '\u00A0€'; };

/* ---------- Composition ---------- */
/* Ceux qui sont au travail aujourd'hui (pas en repos ni en formation). */
B.equipe.salle = function (S) { return S.equipe.filter(function (p) { return p.service === 'salle' && !p.absent; }); };
B.equipe.cuisine = function (S) { return S.equipe.filter(function (p) { return p.service === 'cuisine' && !p.absent; }); };
B.equipe.duService = function (S, service) { return S.equipe.filter(function (p) { return p.service === service && !p.absent; }); };
/* Ceux qui restent (sans compter les absents du jour ni les personnes renvoyées qui finissent leur tâche). */
B.equipe.actifs = function (S, service) { return S.equipe.filter(function (p) { return p.service === service && !p.partant && !p.absent; }); };
B.equipe.patron = function (S) { return S.equipe.find(function (p) { return p.patron; }); };
B.equipe.peutOuvrir = function (S) { return B.equipe.actifs(S, 'salle').length > 0 && B.equipe.actifs(S, 'cuisine').length > 0; };
B.equipe.coutMensuel = function (S) {
  return S.equipe.reduce(function (s, p) { return s + (p.patron || p.partant || p.interim ? 0 : B.equipe.parMois(p.salaire)); }, 0);
};

/* Place de repos d'une personne de salle (près de la passe) ou de cuisine (près des fourneaux). */
B.equipe.base = function (S, p) {
  const P = B.DATA.salle;
  if (p.service === 'salle') {
    const i = B.equipe.salle(S).indexOf(p);
    return { x: P.passe.x - 12 - Math.floor(i / 2) * 36, y: i % 2 ? P.allee + 20 : P.allee - 20 };
  }
  const k = P.cuisine;
  if (p.service === 'bar') { const b = Math.max(0, B.equipe.duService(S, 'bar').indexOf(p)); return { x: P.passe.x - 22 + (b % 2) * 44, y: 50 + Math.floor(b / 2) * 40 }; }
  if (p.service === 'plonge') { const b = Math.max(0, B.equipe.duService(S, 'plonge').indexOf(p)); return { x: k.x + 36 + (b % 2) * 60, y: k.y + k.hauteur - 34 }; }
  if (p.service === 'nettoyage') { const b = Math.max(0, B.equipe.duService(S, 'nettoyage').indexOf(p)); return { x: 60 + b * 44, y: 40 }; }
  const j = Math.max(0, B.equipe.cuisine(S).indexOf(p));
  return { x: k.x + 36 + (j % 2) * 60, y: k.y + 178 + Math.floor(j / 2) * 58 };
};

B.equipe.nouveauMembre = function (S, o) {
  const p = {
    id: S.prochainId++, nom: o.nom, genre: o.genre || 'm', poste: o.poste, patron: !!o.patron,
    service: o.service || (B.equipe.poste(o.poste) ? B.equipe.poste(o.poste).service : 'salle'),
    note: o.note, vitesse: o.vitesse, amabilite: o.amabilite, qualite: o.qualite,
    salaire: o.salaire || 0, experience: o.experience || 0, perso: o.perso || null,
    x: 0, y: 0, chemin: [], tache: null
  };
  if (o.interim) { p.interim = true; p.jourInterim = S.jour; }
  if (B.equipe.aDesRepos(p)) {
    p.repos = B.planning.choisirRepos(S, p); p.absent = null; p.formation = null; p.formations = []; p.sommelier = false; p.pourboires = 0;
  }
  S.equipe.push(p);
  const b = B.equipe.base(S, p); p.x = b.x; p.y = b.y;
  return p;
};

B.equipe.creerPatron = function (S) {
  const d = B.DATA.equipe.patron;
  return B.equipe.nouveauMembre(S, { nom: d.nom, poste: 'patron', patron: true, service: 'salle', note: 5, vitesse: d.vitesse, qualite: d.qualite, amabilite: d.amabilite });
};

/* Le patron change de poste (salle ↔ cuisine), sauf s'il laisserait un poste vide. */
B.equipe.patronPeutChanger = function (S) {
  const p = B.equipe.patron(S);
  if (!p) return false;
  return B.equipe.actifs(S, p.service).length > 1;
};
B.equipe.changerPatron = function (S) {
  const p = B.equipe.patron(S);
  if (!B.equipe.patronPeutChanger(S)) return false;
  B.equipe.liberer(S, p);
  p.service = p.service === 'salle' ? 'cuisine' : 'salle';
  B.equipe.replacer(S);
  return true;
};

/* ---------- Effectif : les 16 places fixées dans Chez YaYa (le patron et les intérimaires en plus) ---------- */
B.equipe.place = function (poste) {
  return B.DATA.equipe.effectif.places.find(function (pl) { return pl.postes.indexOf(poste) >= 0; }) || null;
};
B.equipe.placeRecrutable = function (pl) { return pl.postes.some(function (k) { return B.equipe.poste(k).recrutable; }); };
B.equipe.titulaires = function (S) { return S.equipe.filter(function (p) { return !p.patron && !p.interim && !p.partant; }); };
B.equipe.occupes = function (S, pl) { return B.equipe.titulaires(S).filter(function (p) { return pl.postes.indexOf(p.poste) >= 0; }).length; };
B.equipe.placeLibre = function (S, poste) { const pl = B.equipe.place(poste); return !pl || B.equipe.occupes(S, pl) < pl.nombre; };
B.equipe.effectif = function (S) {
  const E = B.DATA.equipe.effectif, r = { n: 0, total: E.total, groupes: {} };
  Object.keys(E.groupes).forEach(function (g) { r.groupes[g] = 0; });
  E.places.forEach(function (pl) { const n = B.equipe.occupes(S, pl); r.groupes[pl.groupe] += n; r.n += n; });
  return r;
};

/* ---------- Intérim : un remplaçant pour la journée, sur une place vide ---------- */
/* Places vides ou dont le titulaire est absent aujourd'hui, pour les postes de ce service (salle ou cuisine). */
B.equipe.placesVides = function (S, service) {
  return B.DATA.equipe.effectif.places.reduce(function (s, pl) {
    if (!pl.postes.some(function (k) { return B.equipe.poste(k).service === service; })) return s;
    const la = B.equipe.titulaires(S).filter(function (p) { return pl.postes.indexOf(p.poste) >= 0 && !p.absent; }).length;
    return s + Math.max(0, pl.nombre - la);
  }, 0);
};
B.equipe.interimaires = function (S, service) { return S.equipe.filter(function (p) { return p.interim && !p.partant && (!service || p.service === service); }); };
B.equipe.salaireInterim = function (S, service) {
  return Math.round(B.equipe.minimum(S, B.DATA.equipe.interim.postes[service], B.DATA.equipe.interim.experience) * (1 + B.DATA.equipe.interim.majoration) * 100) / 100;
};
/* Renvoie null si on peut appeler un intérimaire pour ce service, sinon la clé du texte qui explique pourquoi. */
B.equipe.interimPossible = function (S, service) {
  if (!S.dejaOuvert) return 'interim_jour1';
  if (B.equipe.placesVides(S, service) <= B.equipe.interimaires(S, service).length) return 'interim_complet_' + service;
  return null;
};
B.equipe.appelerInterim = function (S, service, auto) {
  if (B.equipe.interimPossible(S, service)) return null;
  const I = B.DATA.equipe.interim, D = B.DATA.equipe, poste = I.postes[service];
  const pr = D.prenoms[B.entier(S, 0, D.prenoms.length - 1)];
  const noms = D.noms.concat(B.lieu(S.lieu).nomsClients);
  const p = B.equipe.nouveauMembre(S, {
    nom: pr[0] + ' ' + noms[B.entier(S, 0, noms.length - 1)], genre: pr[1], poste: poste, service: service,
    note: I.note, vitesse: I.vitesse, qualite: I.qualite, amabilite: I.amabilite, experience: I.experience,
    salaire: B.equipe.salaireInterim(S, service), interim: true
  });
  B.equipe.replacer(S);
  if (auto) B.message(S, 'msg_interim_auto', { nom: p.nom });
  else B.message(S, 'msg_interim', { nom: p.nom, poste: B.equipe.nomPoste(p), salaire: B.equipe.euroHeure(p.salaire) });
  return p;
};
/* Le matin : les intérimaires de la veille repartent, on regarde qui est en repos ou en formation ;
   si l'option est active et qu'il manque quelqu'un pour ouvrir, un intérimaire est appelé automatiquement (dernier recours). */
B.equipe.matin = function (S) {
  S.equipe = S.equipe.filter(function (p) { return !p.partant && !p.interim; });
  B.planning.matin(S);
  B.equipe.replacer(S);
  if (S.proprete != null && S.proprete < B.DATA.equipe.effets.proprete.seuilEtoiles) B.message(S, 'msg_salle_sale', { n: S.proprete });
  if (S.interimAuto && S.dejaOuvert) {
    ['salle', 'cuisine'].forEach(function (sv) {
      if (!B.equipe.actifs(S, sv).length) B.equipe.appelerInterim(S, sv, true);
    });
  }
};

/* ---------- Renvoyer un employé ---------- */
B.equipe.enService = function (S) { return !!S.ouvert && !S.finJour; };
/* Renvoie null si c'est possible, sinon la clé du texte qui explique pourquoi. */
B.equipe.peutRenvoyer = function (S, p) {
  if (!p || p.patron) return 'renvoi_patron';
  if (p.partant) return 'renvoi_deja';
  if (B.equipe.enService(S) && (p.service === 'salle' || p.service === 'cuisine') &&
      B.equipe.actifs(S, p.service).length <= 1) return p.service === 'salle' ? 'renvoi_salle_vide' : 'renvoi_cuisine_vide';
  return null;
};
/* Hors service, il part tout de suite. En plein service, il finit sa tâche en cours puis part. */
B.equipe.renvoyer = function (S, p) {
  if (B.equipe.peutRenvoyer(S, p)) return false;
  p.partant = true;
  B.message(S, 'msg_renvoi', { nom: p.nom, e: p.genre === 'f' ? 'e' : '' });
  if (!B.equipe.enService(S) || !B.equipe.occupe(S, p)) B.equipe.retirer(S, p, false);
  return true;
};
B.equipe.occupe = function (S, p) {
  if (p.service === 'salle') return !!p.tache;
  if (p.service === 'cuisine') return S.groupes.some(function (g) { return g.etat === 'cuisine' && g.cuisinier === p.id; });
  return false;
};
B.equipe.retirer = function (S, p, apresTache) {
  B.equipe.liberer(S, p);
  if (p.formation && p.absent !== 'formation') B.planning.annuler(S, p);
  S.equipe = S.equipe.filter(function (x) { return x.id !== p.id; });
  B.equipe.replacer(S);
  if (apresTache) B.message(S, 'msg_renvoi_parti', { nom: p.nom });
};
/* Appelé à chaque pas : les personnes renvoyées qui ont fini leur tâche s'en vont. */
B.equipe.departs = function (S) {
  S.equipe.filter(function (p) { return p.partant && !B.equipe.occupe(S, p); })
    .forEach(function (p) { B.equipe.retirer(S, p, true); });
};

/* Quand quelqu'un quitte son poste : ce qu'il faisait est repris par les autres. */
B.equipe.liberer = function (S, p) {
  if (p.tache) {
    if (p.tache.groupe) { const g = S.groupes.find(function (x) { return x.id === p.tache.groupe; }); if (g) g.serveur = null; }
    if (p.tache.table) { const t = B.salle.tableDe(S, p.tache.table); if (t) t.serveur = null; }
  }
  p.tache = null; p.chemin = [];
  S.groupes.forEach(function (g) { if (g.cuisinier === p.id && g.etat === 'cuisine') { g.cuisinier = null; g.pret = null; } });
};
B.equipe.replacer = function (S) {
  S.equipe.forEach(function (p) {
    if (p.service !== 'salle') { const b = B.equipe.base(S, p); p.x = b.x; p.y = b.y; p.chemin = []; p.tache = null; }
    else if (p.x > B.DATA.salle.cuisine.x - 20) { p.x = B.DATA.salle.passe.x; p.y = B.DATA.salle.allee; p.chemin = []; }
  });
};

/* ---------- Candidats ---------- */
B.equipe.candidat = function (S, poste) {
  const D = B.DATA.equipe, P = D.postes[poste];
  const noms = D.noms.concat(B.lieu(S.lieu).nomsClients);
  const pris = S.equipe.map(function (x) { return x.nom; }).concat(S.candidats.map(function (x) { return x.nom; }));
  let pr, nom, essai = 0;
  do { pr = D.prenoms[B.entier(S, 0, D.prenoms.length - 1)]; nom = pr[0] + ' ' + noms[B.entier(S, 0, noms.length - 1)]; } while (pris.indexOf(nom) >= 0 && ++essai < 8);
  const note = B.entier(S, P.niveauJeu[0], P.niveauJeu[1]);
  const age = B.entier(S, 19, 55);
  const exp = Math.max(0, Math.min(age - 18, Math.round((note - 2) * 1.6 + B.entre(S, -2, 3))));
  const varie = function () { return Math.max(1, Math.min(10, note + B.entier(S, -2, 2))); };
  const perso = D.personnalites[B.entier(S, 0, D.personnalites.length - 1)];
  const min = B.equipe.minimum(S, poste, exp);
  const demande = Math.round(min * (1 + Math.max(0, (note - 4) * 0.03) + perso.exigence + B.entre(S, 0, 0.06)) * 10) / 10;
  return {
    id: S.prochainId++, nom: nom, genre: pr[1], poste: poste,
    age: age, experience: exp, note: note, vitesse: varie(), amabilite: varie(), qualite: varie(),
    perso: perso.id, minimum: min, demande: Math.max(min, demande), offre: min,
    reponses: [], revele: {}, refus: 0, dernierMot: null, graineTexte: B.entier(S, 0, 9999)
  };
};

B.equipe.genererDepart = function (S) {
  S.candidats = [];
  B.DATA.equipe.candidatsDepart.forEach(function (p) { S.candidats.push(B.equipe.candidat(S, p)); });
};

B.equipe.nouveauxCandidats = function (S) {
  const N = B.DATA.equipe.nouveauxCandidatsParJour;
  let n = Math.min(B.entier(S, N.min, N.max), Math.max(0, N.plafond - S.candidats.length));
  const postes = Object.keys(B.DATA.equipe.postes).filter(function (k) { return B.DATA.equipe.postes[k].recrutable && B.equipe.placeLibre(S, k); });
  if (!postes.length) n = 0;
  for (let i = 0; i < n; i++) S.candidats.push(B.equipe.candidat(S, postes[B.entier(S, 0, postes.length - 1)]));
  if (n > 0) B.message(S, 'msg_nouveaux_candidats', { n: n });
};

B.equipe.perso = function (id) { return B.DATA.equipe.personnalites.find(function (p) { return p.id === id; }) || B.DATA.equipe.personnalites[0]; };
B.equipe.adj = function (c) { const p = B.equipe.perso(c.perso); return c.genre === 'f' ? p.adjF : p.adj; };
B.equipe.texteExperience = function (c) {
  if (c.experience === 0) return B.t(c.genre === 'f' ? 'equipe_experience_0F' : 'equipe_experience_0');
  if (c.experience === 1) return B.t('equipe_experience_1');
  return B.t('equipe_experience_n', { n: c.experience });
};

/* ---------- Entretien ---------- */
B.equipe.questions = function (c) {
  const service = B.equipe.famille(B.equipe.poste(c.poste).service);
  return ['parcours', 'rush', service === 'cuisine' ? 'qualite_cuisine' : 'qualite_salle', 'salaire'];
};
B.equipe.niveau3 = function (v) { return v <= 3 ? 0 : v <= 6 ? 1 : 2; };

B.equipe.repondre = function (S, c, q) {
  if (c.reponses.some(function (r) { return r.q === q; })) return null;
  const service = B.equipe.famille(B.equipe.poste(c.poste).service), g = c.genre, n = c.graineTexte + c.reponses.length * 7;
  let corps;
  if (q === 'parcours') corps = B.tChoix('r_parcours_' + service + '_' + (c.experience === 0 ? 0 : c.experience < 5 ? 1 : 2), n, { exp: c.experience }, g);
  else if (q === 'rush') { corps = B.tChoix('r_rush_' + B.equipe.niveau3(c.vitesse), n, null, g); c.revele.vitesse = true; }
  else if (q === 'qualite_salle') { corps = B.tChoix('r_qualite_salle_' + B.equipe.niveau3(c.amabilite), n, null, g); c.revele.amabilite = true; }
  else if (q === 'qualite_cuisine') { corps = B.tChoix('r_qualite_cuisine_' + B.equipe.niveau3(c.qualite), n, null, g); c.revele.qualite = true; }
  else if (q === 'salaire') { corps = B.tChoix('r_salaire', n, { salaire: B.equipe.euroHeure(c.demande) }, g); c.revele.salaire = true; c.offre = Math.max(c.offre, c.demande); }
  else return null;
  const intro = B.tChoix('intro_' + c.perso, n + 1, null, g);
  if (intro && !/[.!?…]\s*$/.test(intro)) corps = corps.charAt(0).toLowerCase() + corps.slice(1);
  const fin = B.DATA.textes['fin_' + c.perso] ? B.tChoix('fin_' + c.perso, n + 2, null, g) : '';
  const texte = '« ' + intro + corps + fin + ' »';
  c.reponses.push({ q: q, texte: texte });
  return texte;
};

/* Le joueur propose un salaire horaire. Réponse : accepte, contre-proposition ou refus. */
B.equipe.proposer = function (S, c, offre) {
  if (!B.equipe.placeLibre(S, c.poste)) { c.dernierMot = B.t('entretien_complet'); return { r: 'complet' }; }
  offre = Math.max(c.minimum, Math.round(offre * 100) / 100);
  c.offre = offre;
  const perso = B.equipe.perso(c.perso);
  if (offre >= c.demande * (1 - perso.souplesse) - 0.001) {
    const p = B.equipe.nouveauMembre(S, { nom: c.nom, genre: c.genre, poste: c.poste, note: c.note, vitesse: c.vitesse, amabilite: c.amabilite, qualite: c.qualite, salaire: offre, experience: c.experience, perso: c.perso });
    S.candidats = S.candidats.filter(function (x) { return x.id !== c.id; });
    B.message(S, 'msg_embauche', { nom: c.nom, poste: B.equipe.nomPoste(p), salaire: B.equipe.euroHeure(offre) });
    c.dernierMot = B.t('entretien_accepte');
    return { r: 'accepte', membre: p };
  }
  if (offre >= c.demande * 0.92) {
    c.dernierMot = B.t('entretien_contre', { salaire: B.equipe.euroHeure(c.demande) });
    c.revele.salaire = true;
    return { r: 'contre' };
  }
  c.refus++;
  if (c.refus >= B.DATA.equipe.refusAvantDepart) {
    S.candidats = S.candidats.filter(function (x) { return x.id !== c.id; });
    B.message(S, 'msg_candidat_parti', { nom: c.nom });
    c.dernierMot = B.t('entretien_part');
    return { r: 'part' };
  }
  c.dernierMot = B.t('entretien_refus');
  return { r: 'refus' };
};

/* Facteur de vitesse d'une personne : 1 pour une vitesse de 5, plus rapide au-dessus. */
B.equipe.facteurSalle = function (p) { return 0.8 + 0.04 * (p.vitesse || 5); };
B.equipe.facteurCuisine = function (p) { return 1.25 - 0.05 * (p.vitesse || 5); };
