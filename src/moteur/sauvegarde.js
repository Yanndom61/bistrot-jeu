/* sauvegarde.js — enregistrer et relire une partie. Chaque sauvegarde porte un numéro de version.
   Quand le format change, on ajoute une étape dans B.MIGRATIONS (de la version n à n+1) :
   ainsi chaque nouvelle version du jeu sait relire toutes les anciennes. */
B.VERSION_SAUVEGARDE = 1;

B.MIGRATIONS = {
  /* Exemple pour plus tard :  1: function (S) { S.nouveauChamp = 0; S.version = 2; return S; } */
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
