/* sauvegarde.js — enregistrer et relire une partie. Chaque sauvegarde porte un numéro de version.
   Quand le format change, on ajoute une étape dans B.MIGRATIONS (de la version n à n+1) :
   ainsi chaque nouvelle version du jeu sait relire toutes les anciennes. */
B.VERSION_SAUVEGARDE = 3;

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
  return { partie: p + 'partie', secours: p + 'partie-precedente', reglages: p + 'reglages', copieAncien: p + 'copie-ancien-jeu' };
};
