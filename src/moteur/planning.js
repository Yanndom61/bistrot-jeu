/* planning.js — étape 4 (équipe) : jours de repos, absences, formations, cagnotte des pourboires,
   propreté, et effet des postes et des qualités sur le service. Données : donnees/equipe.json. */
B.planning = {};

/* Jour de la semaine (0 = dimanche) du jour de jeu n (par défaut aujourd'hui). */
B.jourSemaine = function (S, n) { return B.dateDuJour(S, (n == null ? S.jour : n) - S.jour).getUTCDay(); };
B.equipe.famille = function (service) { return B.DATA.equipe.familles[service] || 'cuisine'; };
B.equipe.present = function (p) { return !p.absent; };
B.equipe.aDesRepos = function (p) { return !p.patron && !p.interim; };

/* ---------- Jours de repos : 2 jours qui se suivent ---------- */
B.planning.paires = function () { return B.DATA.equipe.planning.ordrePreference; };
B.planning.estRepos = function (p, js) { return !!(p.repos && p.repos.indexOf(js) >= 0); };
/* Choisit les 2 jours de repos qui gênent le moins : le moins de collègues du même service déjà absents ces jours-là. */
B.planning.choisirRepos = function (S, p) {
  let best = null, bestScore = Infinity;
  B.planning.paires().forEach(function (pr, k) {
    let meme = 0, tous = 0;
    S.equipe.forEach(function (x) {
      if (x === p || !B.equipe.aDesRepos(x) || x.partant || !x.repos) return;
      const n = pr.filter(function (j) { return x.repos.indexOf(j) >= 0; }).length;
      tous += n; if (x.service === p.service) meme += n;
    });
    const score = meme * 100 + tous * 10 + k;
    if (score < bestScore) { bestScore = score; best = pr; }
  });
  return best.slice();
};
/* Décale les jours de repos d'un jour (sens +1 ou −1). Prend effet dès le lendemain. */
B.planning.decaler = function (S, p, sens) {
  if (!B.equipe.aDesRepos(p) || !p.repos) return false;
  const a = (p.repos[0] + (sens < 0 ? 6 : 1)) % 7;
  p.repos = [a, (a + 1) % 7];
  return true;
};
/* Combien de personnes travaillent ce jour de la semaine, par service (le patron compte dans le sien). */
B.planning.couverture = function (S, js) {
  const r = { salle: 0, bar: 0, cuisine: 0, plonge: 0, nettoyage: 0 };
  S.equipe.forEach(function (p) {
    if (p.interim || p.partant) return;
    if (B.planning.estRepos(p, js)) return;
    r[p.service] = (r[p.service] || 0) + 1;
  });
  return r;
};

/* Le matin : formations terminées, puis qui est absent aujourd'hui (repos ou formation). */
B.planning.matin = function (S) {
  const js = B.jourSemaine(S);
  const repos = [], formation = [];
  S.equipe.forEach(function (p) {
    if (p.absent === 'formation' && p.formation) B.planning.finirFormation(S, p);
    p.absent = null;
    if (!B.equipe.aDesRepos(p)) return;
    if (!p.repos) p.repos = B.planning.choisirRepos(S, p);
    if (B.planning.estRepos(p, js)) { p.absent = 'repos'; repos.push(B.prenom(p)); }
    else if (p.formation) { p.absent = 'formation'; p.formation.jour = S.jour; formation.push(B.prenom(p)); }
  });
  if (repos.length) B.message(S, 'msg_repos_du_jour', { liste: repos.join(', ') });
  if (formation.length) B.message(S, 'msg_formation_du_jour', { liste: formation.join(', ') });
};
B.prenom = function (p) { return String(p.nom).split(' ')[0]; };

/* ---------- Formations ---------- */
B.planning.formation = function (id) { return B.DATA.equipe.formations.liste.find(function (f) { return f.id === id; }); };
/* Formations proposées à une personne, avec leur prix et pourquoi elles ne sont pas possibles (clé de texte) . */
B.planning.formationsPour = function (S, p) {
  const F = B.DATA.equipe.formations;
  return F.liste.filter(function (f) { return f.services.indexOf(p.service) >= 0; }).map(function (f) {
    let prix, non = null;
    if (f.stat) {
      prix = f.prixParPoint * ((p[f.stat] || 5) + 1);
      if ((p[f.stat] || 0) >= F.max) non = 'form_non_max';
    } else { prix = f.prix; if (p.sommelier) non = 'form_non_deja'; }
    if (!non && p.formation) non = 'form_non_inscrit';
    if (!non && p.partant) non = 'form_non_partant';
    if (!non && S.argent < prix) non = 'form_non_argent';
    return { id: f.id, stat: f.stat || null, prix: prix, non: non };
  });
};
B.planning.inscrire = function (S, p, id) {
  if (!B.equipe.aDesRepos(p)) return { erreur: 'form_non_partant' };
  const o = B.planning.formationsPour(S, p).find(function (x) { return x.id === id; });
  if (!o) return { erreur: 'form_non_partant' };
  if (o.non) return { erreur: o.non };
  B.argent.payer(S, 'formations', o.prix);
  p.formation = { id: id, prix: o.prix, jour: null };
  B.message(S, 'msg_formation_inscrit', { nom: p.nom, formation: B.t('form_nom_' + id), prix: B.euros(o.prix) });
  return { ok: true };
};
/* Annuler avant qu'elle commence : remboursée. */
B.planning.annuler = function (S, p) {
  if (!p.formation || p.absent === 'formation') return false;
  B.argent.payer(S, 'formations', -p.formation.prix);
  B.message(S, 'msg_formation_annulee', { nom: p.nom, prix: B.euros(p.formation.prix) });
  p.formation = null;
  return true;
};
B.planning.finirFormation = function (S, p) {
  const f = B.planning.formation(p.formation.id);
  p.formations = (p.formations || []).concat([p.formation.id]);
  if (f && f.stat) {
    p[f.stat] = Math.min(B.DATA.equipe.formations.max, (p[f.stat] || 5) + 1);
    p.note = Math.max(p.note || 0, Math.min(10, Math.round((p.vitesse + p.amabilite + p.qualite) / 3)));
  } else if (f) p.sommelier = true;
  B.message(S, 'msg_formation_finie', { nom: p.nom, formation: B.t('form_nom_' + p.formation.id) });
  p.formation = null;
};

/* ---------- Cagnotte des pourboires : partagée le dernier soir du mois ---------- */
B.planning.beneficiaires = function (S) { return S.equipe.filter(function (p) { return B.equipe.aDesRepos(p) && !p.partant; }); };
B.planning.dernierJourDuMois = function (S) { return B.mois(S, 1) !== B.mois(S); };
B.planning.partager = function (S) {
  const pot = B.r2(S.cagnotte || 0), gens = B.planning.beneficiaires(S);
  if (!(pot > 0) || !gens.length) return null;
  const part = Math.floor(pot / gens.length * 100) / 100;
  if (!(part > 0)) return null;
  gens.forEach(function (p) { p.pourboires = B.r2((p.pourboires || 0) + part); });
  S.cagnotte = B.r2(pot - part * gens.length);
  const d = B.dateDuJour(S);
  const r = { jour: S.jour, mois: d.getUTCMonth(), annee: d.getUTCFullYear(), total: pot, n: gens.length, part: part, reste: S.cagnotte, noms: gens.map(function (p) { return p.nom; }) };
  S.partages = [r].concat(S.partages || []).slice(0, B.DATA.equipe.cagnotte.historique);
  B.message(S, 'msg_cagnotte_partagee', { total: B.prix(pot), n: gens.length, part: B.prix(part) });
  return r;
};

/* ---------- Propreté du restaurant (0 à 100) ---------- */
B.planning.nettoyageDuSoir = function (S) {
  const P = B.DATA.equipe.effets.proprete;
  const sale = (S.stats.jour.couverts || 0) * P.salissureParCouvert;
  let propre = P.nettoyageEquipe;
  B.equipe.presents(S, 'nettoyage').forEach(function (p) { propre += P.agentBase + P.agentParVitesse * (p.vitesse || 5) + P.agentParQualite * (p.qualite || 5); });
  const avant = S.proprete == null ? P.depart : S.proprete;
  S.proprete = Math.round(Math.max(0, Math.min(100, avant - sale + propre)));
  return { avant: avant, apres: S.proprete, sale: Math.round(sale), propre: Math.round(propre) };
};
/* Étoiles perdues quand la salle est sale (0 au-dessus du seuil). */
B.planning.malusProprete = function (S) {
  const P = B.DATA.equipe.effets.proprete, v = S.proprete == null ? P.depart : S.proprete;
  return v >= P.seuilEtoiles ? 0 : P.etoilesMax * (P.seuilEtoiles - v) / P.seuilEtoiles;
};
/* Chance qu'un groupe qui arrive fasse demi-tour en voyant la salle sale. */
B.planning.fuiteProprete = function (S) {
  const P = B.DATA.equipe.effets.proprete, v = S.proprete == null ? P.depart : S.proprete;
  return v >= P.seuilDepart ? 0 : P.departMax * (P.seuilDepart - v) / P.seuilDepart;
};

/* ---------- Effets des postes et des qualités ---------- */
B.equipe.presents = function (S, service) { return S.equipe.filter(function (p) { return p.service === service && !p.absent && !p.partant; }); };
B.equipe.aLePoste = function (S, poste) { return S.equipe.some(function (p) { return p.poste === poste && !p.absent && !p.partant; }); };
/* Bonus de qualité en cuisine : le chef relit les assiettes des autres ; le second le remplace s'il n'est pas là. */
B.equipe.qualiteCuisson = function (S, cuisinier) {
  const E = B.DATA.equipe.effets;
  if (!cuisinier) return 5;
  let q = cuisinier.qualite || 5;
  const chef = B.equipe.aLePoste(S, 'chef'), second = B.equipe.aLePoste(S, 'second');
  if ((chef && cuisinier.poste !== 'chef') || (!chef && second && cuisinier.poste !== 'second')) q += E.chefBonusQualite;
  return Math.min(10, q);
};
/* Plonge : sans plongeur, les cuisiniers lavent eux-mêmes la vaisselle et vont moins vite. */
B.equipe.facteurPlonge = function (S) {
  const E = B.DATA.equipe.effets;
  const v = B.equipe.presents(S, 'plonge').reduce(function (s, p) { return s + (p.vitesse || 5); }, 0);
  return E.sansPlongeur - (E.sansPlongeur - 1) * Math.min(1, v / E.plongeVitessePleine);
};
/* Bar : un barman prépare les boissons, le serveur n'a plus qu'à les prendre. */
B.equipe.tempsBoisson = function (S) {
  const T = B.DATA.stocks.boissons.tempsParBoisson, bar = B.equipe.presents(S, 'bar');
  if (!bar.length) return T;
  const v = Math.max.apply(null, bar.map(function (p) { return p.vitesse || 5; }));
  return T * B.DATA.equipe.effets.barmanTempsBoisson * B.equipe.facteurCuisine({ vitesse: v });
};
B.equipe.sommelierPresent = function (S) {
  return S.equipe.some(function (p) { return p.sommelier && !p.absent && !p.partant && (p.service === 'salle' || p.service === 'bar'); });
};
B.equipe.capaciteCuisinier = function (p) { return p.poste === 'appr' ? B.DATA.equipe.effets.apprentiCommandes : B.DATA.equipe.commandesParCuisinier; };
