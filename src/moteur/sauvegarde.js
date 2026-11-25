/* sauvegarde.js — enregistrer et relire une partie. Chaque sauvegarde porte un numéro de version.
   Quand le format change, on ajoute une étape dans B.MIGRATIONS (de la version n à n+1) :
   ainsi chaque nouvelle version du jeu sait relire toutes les anciennes. */
B.VERSION_SAUVEGARDE = 7;

B.MIGRATIONS = {
  /* v1 → v2 (Bistrot 0.2) : l'équipe arrive. Le patron démarre seul (Léa n'est plus là), avec des candidats.
     La journée en cours repart au matin, car le service ne peut pas continuer sans cuisine. */
  1: function (S) {
    delete S.serveurs;
    S.equipe = []; S.candidats = []; S.placement = 'auto';
    S.groupes = [];
    S.tables.forEach(function (t) { t.groupe = null; t.sale = false; t.serveur = null; });
    S.minute = B.DATA.clients.journee.ouverture;
    S.stats.jour = B.statsVides();
    S.finJour = false; S.bilan = null;
    B.equipe.creerPatron(S);
    B.equipe.genererDepart(S);
    S.ouvert = false;
    B.message(S, 'msg_lea_partie');
    S.version = 2;
    return S;
  },
  /* v2 → v3 (Bistrot 0.3) : effectif de 16, intérim et renvoi. L'option d'intérim automatique prend la valeur
     par défaut de la difficulté. Les « Intérimaire » repris par erreur de l'ancien jeu (remplaçants d'un jour) partent. */
  2: function (S) {
    S.dejaOuvert = !!S.ouvert || S.jour > 1;
    S.interimAuto = !!B.DATA.equipe.interim.autoParDefaut[S.difficulte || 'facile'];
    const avant = S.equipe.length;
    S.equipe = S.equipe.filter(function (p) { return p.patron || p.nom !== 'Intérimaire'; });
    if (S.equipe.length < avant) {
      B.equipe.replacer(S);
      S.groupes.forEach(function (g) { if (g.cuisinier && !S.equipe.some(function (p) { return p.id === g.cuisinier; })) { g.cuisinier = null; g.pret = null; } if (g.serveur && !S.equipe.some(function (p) { return p.id === g.serveur; })) g.serveur = null; });
      S.tables.forEach(function (t) { if (t.serveur && !S.equipe.some(function (p) { return p.id === t.serveur; })) t.serveur = null; });
      S.ouvert = S.ouvert && B.equipe.peutOuvrir(S);
    }
    S.version = 3;
    return S;
  },
  /* v3 → v4 (Bistrot 0.4) : la carte, les prix et le paiement arrivent. Carte de départ du lieu ;
     les clients déjà attablés reçoivent leur commande (sans erreur de cuisson) et paieront à la fin. */
  3: function (S) {
    B.carte.creer(S);
    S.cagnotte = 0; S.tickets = [];
    const v = B.statsVides();
    for (const k in v) if (S.stats.jour[k] == null) S.stats.jour[k] = v[k];
    S.groupes.forEach(function (g) {
      if (['cuisine', 'pret', 'mange', 'addition'].indexOf(g.etat) >= 0 && !g.commande) {
        B.carte.commander(S, g);
        g.commande.forEach(function (l) { if (l.cuisson) l.servie = l.cuisson; });
      }
    });
    S.version = 4;
    return S;
  },
  /* v4 → v5 (Bistrot 0.5) : stocks, boissons, plats de saison, menu du jour. Le calendrier démarre à la date de création ;
     la carte reçoit les boissons ; premières courses livrées et payées ; les commandes déjà prises ne touchent pas la réserve. */
  4: function (S) {
    S.calendrier = { debut: (S.creeLe || '2026-11-25').slice(0, 10) };
    const v = B.statsVides();
    for (const k in v) if (S.stats.jour[k] == null) S.stats.jour[k] = v[k];
    B.carte.catalogue(S).forEach(function (d) {
      if (!S.carte.plats[d.id]) S.carte.plats[d.id] = { on: d.cat === 'boisson' && !d.saison, prix: B.carte.prixConseille(S, d) };
    });
    B.carte.completer(S);
    B.stock.creer(S);
    S.version = 5;
    return S;
  },
  /* v5 → v6 (Bistrot 0.6) : étape Équipe. Barmans, plongeurs et agents de nettoyage (« rôle à venir ») prennent leur poste ;
     chacun reçoit 2 jours de repos qui se suivent (personne n'est absent le jour de la reprise) ; propreté de départ ;
     la cagnotte garde son montant ; un candidat pour chaque nouveau poste ouvert à l'embauche (s'il reste une place). */
  5: function (S) {
    S.equipe.forEach(function (p) {
      const P = B.equipe.poste(p.poste);
      if (P && !p.patron) p.service = P.service;
    });
    S.equipe.forEach(function (p) {
      if (!B.equipe.aDesRepos(p)) { p.absent = null; return; }
      p.absent = null; p.formation = null; p.formations = []; p.sommelier = false; p.pourboires = 0;
      p.repos = null;
    });
    S.equipe.forEach(function (p) { if (B.equipe.aDesRepos(p)) p.repos = B.planning.choisirRepos(S, p); });
    S.partages = [];
    S.proprete = B.DATA.equipe.effets.proprete.depart;
    S.cagnotte = B.r2(S.cagnotte || 0);
    const v = B.statsVides();
    for (const k in v) if (S.stats.jour[k] == null) S.stats.jour[k] = v[k];
    ['barman', 'plong', 'nett', 'appr'].forEach(function (poste) {
      if (B.equipe.placeLibre(S, poste) && !S.candidats.some(function (c) { return c.poste === poste; })) S.candidats.push(B.equipe.candidat(S, poste));
    });
    B.equipe.replacer(S);
    S.version = 6;
    return S;
  },
  /* v6 → v7 (Bistrot 0.7) : étape Argent. Les parties d'avant restent en Facile (propriétaire, pas de prêt).
     Les salaires et les charges seront payés à partir du prochain soir ; l'ancienneté des employés compte
     à partir de la mise à jour (période d'essai) ; les comptes de la semaine démarrent aujourd'hui. */
  6: function (S) {
    S.difficulte = B.DATA.argent.niveaux[S.difficulte] ? S.difficulte : 'facile';
    S.pret = null; S.decouvert = 0; S.faillite = null;
    S.historique = []; S.semaines = []; S.reporte = {};
    S.semaine = B.argent.semaineVide(S, 1, S.jour);
    S.equipe.forEach(function (p) { if (!p.patron && !p.interim && !(p.embauche >= 1)) p.embauche = S.jour; });
    const v = B.statsVides();
    for (const k in v) if (S.stats.jour[k] == null) S.stats.jour[k] = v[k];
    if (S.bilan && S.bilan.resultat != null && !S.bilan.depenses) S.bilan.ancienFormat = true;
    S.version = 7;
    return S;
  }
};

B.serialiser = function (S) { return JSON.stringify(S); };

/* Relit un texte de sauvegarde. Renvoie { partie } ou { erreur: 'cle_du_texte' }. Ne modifie jamais le texte d'origine. */
B.relire = function (texte) {
  let S;
  try { S = JSON.parse(texte); } catch (e) { return { erreur: 'erreur_sauvegarde_illisible' }; }
  if (!S || S.format !== 'bistrot' || typeof S.version !== 'number') return { erreur: 'erreur_sauvegarde_illisible' };
  if (S.version > B.VERSION_SAUVEGARDE) return { erreur: 'erreur_sauvegarde_recente' };
  while (S.version < B.VERSION_SAUVEGARDE) {
    const m = B.MIGRATIONS[S.version];
    if (!m) return { erreur: 'erreur_sauvegarde_illisible' };
    S = m(S);
  }
  S.jeu = B.VERSION_JEU;
  return { partie: S };
};

/* Noms des cases de rangement du téléphone. Le lien TEST et le lien OFFICIEL ont chacun les leurs. */
B.cles = function (canal) {
  const p = 'bistrotjeu.' + canal + '.';
  return { partie: p + 'partie', secours: p + 'partie-precedente', reglages: p + 'reglages', copieAncien: p + 'copie-ancien-jeu', copieFaillite: p + 'copie-faillite' };
};
