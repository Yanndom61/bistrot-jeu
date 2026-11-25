/* argent.js — étape 5 « Argent » : niveaux de difficulté, salaires payés, loyer, charges, cotisations, TVA, prêt,
   indemnités de renvoi, découvert et faillite, bilans du jour et de la semaine.
   Tout ce qui coûte chaque mois est payé chaque soir, au jour le jour (1 mois = 30,42 jours). */
B.argent = {};
B.argent.D = function () { return B.DATA.argent; };
B.argent.niveau = function (S) { return B.DATA.argent.niveaux[S.difficulte] || B.DATA.argent.niveaux.facile; };
B.argent.POSTES = ['achats', 'salaires', 'interim', 'cotisations', 'loyer', 'charges', 'tva', 'pret', 'indemnites', 'formations'];

/* ---------- Salaires ---------- */
/* Salaire d'une journée : 1/30,42 du salaire du mois (39 h) pour un employé (repos compris) ; une journée de 7 h 53 pour un intérimaire. */
B.argent.salaireJour = function (p) {
  if (!p || p.patron) return 0;
  if (p.interim) return p.salaire * B.DATA.argent.heuresInterimParJour;
  return p.salaire * B.DATA.equipe.heuresParMois39h / B.DATA.argent.joursParMois;
};
B.argent.payes = function (S) { return S.equipe.filter(function (p) { return !p.patron && !p.partant; }); };

/* ---------- Loyer, charges, prêt ---------- */
B.argent.loyerMois = function (S) {
  if (B.argent.niveau(S).proprietaire) return 0;
  return Math.round(B.lieu(S.lieu).valeurLocal * B.DATA.argent.loyer.partDeLaValeurParAn / 12);
};
B.argent.chargesMois = function (S) {
  const k = B.lieu(S.lieu).prix;
  return B.DATA.argent.charges.liste.map(function (c) { return { id: c.id, mois: Math.round(c.mois * k) }; });
};
B.argent.mensualite = function (montant, tauxAnnuel, mois) {
  const r = tauxAnnuel / 12;
  if (!r) return montant / mois;
  return montant * r / (1 - Math.pow(1 + r, -mois));
};
B.argent.creerPret = function (S) {
  const P = B.argent.niveau(S).pret;
  if (!P) return null;
  return { montant: P.montant, restant: P.montant, taux: P.tauxAnnuel, mois: P.mois,
    mensualite: B.r2(B.argent.mensualite(P.montant, P.tauxAnnuel, P.mois)), interets: 0, jourDebut: S.jour };
};

/* Ce que coûte une journée avec l'équipe d'aujourd'hui (sans les achats, la TVA ni les intérimaires). */
B.argent.prevision = function (S) {
  const N = B.argent.niveau(S), jm = B.DATA.argent.joursParMois;
  const sal = B.argent.payes(S).filter(function (p) { return !p.interim; }).reduce(function (s, p) { return s + B.argent.salaireJour(p); }, 0);
  const ch = B.argent.chargesMois(S).reduce(function (s, c) { return s + c.mois; }, 0);
  const o = { salaires: B.r2(sal), cotisations: B.r2(sal * N.cotisations), loyer: B.r2(B.argent.loyerMois(S) / jm), charges: B.r2(ch / jm),
    pret: S.pret && S.pret.restant > 0 ? B.r2(S.pret.mensualite / jm) : 0 };
  o.total = B.r2(o.salaires + o.cotisations + o.loyer + o.charges + o.pret);
  return o;
};

/* ---------- Dépenses ponctuelles (achats, formations, indemnités) ---------- */
/* Une fois le bilan du soir fait, ce qui est payé dans la nuit compte pour le lendemain. */
B.argent.compter = function (S, cle, montant) {
  if (S.finJour && S.bilan) {
    S.reporte = S.reporte || {};
    S.reporte[cle] = B.r2((S.reporte[cle] || 0) + montant);
  } else {
    S.stats.jour[cle] = B.r2((S.stats.jour[cle] || 0) + montant);
  }
};
B.argent.payer = function (S, cle, montant) {
  S.argent = B.r2(S.argent - montant);
  B.argent.compter(S, cle, montant);
};
/* Peut-on payer cette somme ? Les achats de produits peuvent aller jusqu'au découvert autorisé par la banque. */
B.argent.peutPayer = function (S, montant, avecDecouvert) {
  return S.argent - montant >= (avecDecouvert ? -B.DATA.argent.decouvertAutorise : 0) - 1e-9;
};

/* ---------- Indemnité de renvoi ---------- */
B.argent.anciennete = function (S, p) { return Math.max(0, S.jour - (p.embauche || S.jour)); };
B.argent.indemnite = function (S, p) {
  const I = B.DATA.argent.indemnites;
  if (!p || p.patron || p.interim) return { montant: 0, raison: 'indem_interim' };
  const anc = B.argent.anciennete(S, p);
  if (anc < I.essaiJours) return { montant: 0, raison: 'indem_essai', jours: I.essaiJours - anc };
  const jour = B.argent.salaireJour(p);
  let m = jour * I.joursDeSalaire, raison = 'indem_jours';
  if (anc >= I.loiApresJours) { m += B.equipe.parMois(p.salaire) * I.loiPartDeMoisParAn * anc / 365; raison = 'indem_loi'; }
  return { montant: B.r2(m), raison: raison, jours: I.joursDeSalaire, anciennete: anc };
};

/* ---------- Le soir : on paie la journée ---------- */
B.argent.soir = function (S) {
  const st = S.stats.jour, N = B.argent.niveau(S), jm = B.DATA.argent.joursParMois;
  let sal = 0, inter = 0;
  B.argent.payes(S).forEach(function (p) { if (p.interim) inter += B.argent.salaireJour(p); else sal += B.argent.salaireJour(p); });
  /* les personnes renvoyées aujourd'hui ont déjà reçu leur journée au moment du renvoi */
  const d = {
    salaires: B.r2(sal), interim: B.r2(inter), cotisations: B.r2(sal * N.cotisations),
    loyer: B.r2(B.argent.loyerMois(S) / jm),
    charges: B.r2(B.argent.chargesMois(S).reduce(function (s, c) { return s + c.mois; }, 0) / jm),
    tva: B.r2(st.recettes * N.tva / (1 + N.tva)), pret: 0
  };
  if (S.pret && S.pret.restant > 0.005) {
    const interet = B.r2(S.pret.restant * S.pret.taux / 12 / jm);
    const capital = Math.min(S.pret.restant, B.r2(S.pret.mensualite / jm - interet));
    S.pret.restant = B.r2(S.pret.restant - capital);
    S.pret.interets = B.r2(S.pret.interets + interet);
    d.pret = B.r2(interet + capital);
    if (S.pret.restant <= 0.005) { S.pret.restant = 0; B.message(S, 'msg_pret_fini'); }
  }
  let total = 0;
  for (const k in d) { st[k] = B.r2((st[k] || 0) + d[k]); total += d[k]; }
  S.argent = B.r2(S.argent - total);
  return B.argent.journee(S);
};
/* Les comptes de la journée (recettes, chaque dépense, bénéfice). */
B.argent.journee = function (S) {
  const st = S.stats.jour, dep = {};
  let tot = 0;
  B.argent.POSTES.forEach(function (k) { dep[k] = B.r2(st[k] || 0); tot += dep[k]; });
  return { recettes: B.r2(st.recettes), depenses: dep, totalDepenses: B.r2(tot), resultat: B.r2(st.recettes - tot), caisse: S.argent };
};

/* ---------- Découvert, faillite, semaine (après le paiement du soir) ---------- */
B.argent.semaineVide = function (S, numero, debut) {
  const dep = {};
  B.argent.POSTES.forEach(function (k) { dep[k] = 0; });
  return { numero: numero, debut: debut, fin: debut, jours: 0, servis: 0, repartis: 0, recettes: 0, depenses: dep, resultat: 0, caisseDebut: null, caisseFin: null };
};
B.argent.cloturer = function (S, j, servis, repartis) {
  const A = B.DATA.argent;
  /* historique des derniers jours */
  S.historique = S.historique || [];
  S.historique.push({ jour: S.jour, servis: servis, recettes: j.recettes, depenses: j.depenses, resultat: j.resultat, caisse: S.argent });
  if (S.historique.length > A.historiqueJours) S.historique.splice(0, S.historique.length - A.historiqueJours);
  /* semaine */
  if (!S.semaine) S.semaine = B.argent.semaineVide(S, 1, S.jour);
  const w = S.semaine;
  if (w.caisseDebut == null) w.caisseDebut = B.r2(S.argent + j.totalDepenses - j.recettes);
  w.jours++; w.fin = S.jour; w.servis += servis; w.repartis += repartis;
  w.recettes = B.r2(w.recettes + j.recettes);
  B.argent.POSTES.forEach(function (k) { w.depenses[k] = B.r2((w.depenses[k] || 0) + j.depenses[k]); });
  w.resultat = B.r2(w.resultat + j.resultat);
  w.caisseFin = S.argent;
  let semaine = null;
  if (w.jours >= A.semaine.jours) {
    semaine = JSON.parse(JSON.stringify(w));
    S.semaines = S.semaines || [];
    semaine.avant = S.semaines.length ? S.semaines[0].resultat : null;
    S.semaines.unshift(semaine);
    if (S.semaines.length > A.semaine.historique) S.semaines.length = A.semaine.historique;
    S.semaine = B.argent.semaineVide(S, w.numero + 1, S.jour + 1);
  }
  /* découvert et faillite */
  let alerte = null;
  if (S.argent < 0) {
    S.decouvert = (S.decouvert || 0) + 1;
    alerte = { soir: S.decouvert, max: A.faillite.soirsDeSuite, argent: S.argent };
    if (S.decouvert >= A.faillite.soirsDeSuite) S.faillite = B.argent.raisonsFaillite(S);
  } else S.decouvert = 0;
  return { semaine: semaine, alerte: alerte, faillite: S.faillite || null };
};
/* Les 3 plus grosses dépenses des derniers jours, pour expliquer la faillite. */
B.argent.raisonsFaillite = function (S) {
  const A = B.DATA.argent, H = (S.historique || []).slice(-A.faillite.soirsDeSuite), som = {};
  let rec = 0, res = 0;
  H.forEach(function (h) { rec += h.recettes; res += h.resultat; for (const k in h.depenses) som[k] = (som[k] || 0) + h.depenses[k]; });
  const top = Object.keys(som).filter(function (k) { return som[k] > 0.5; }).sort(function (a, b) { return som[b] - som[a]; }).slice(0, 3)
    .map(function (k) { return { poste: k, montant: B.r2(som[k]) }; });
  return { jour: S.jour, argent: S.argent, soirs: S.decouvert, jours: H.length, recettes: B.r2(rec), resultat: B.r2(res), top: top };
};
