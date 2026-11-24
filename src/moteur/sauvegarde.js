/* sauvegarde.js — enregistrer et relire une partie. Chaque sauvegarde porte un numéro de version.
   Quand le format change, on ajoute une étape dans B.MIGRATIONS (de la version n à n+1) :
   ainsi chaque nouvelle version du jeu sait relire toutes les anciennes. */
B.VERSION_SAUVEGARDE = 2;

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
