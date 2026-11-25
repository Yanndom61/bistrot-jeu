/* cuisine.js — la cuisine prépare les commandes. Chaque personne en cuisine prépare 2 commandes à la fois (l'apprenti 1).
   S'il n'y a personne de libre, les commandes attendent leur tour (premier arrivé, premier servi).
   Sans plongeur, les cuisiniers font aussi la vaisselle et vont moins vite. */
B.cuisine = {};

B.cuisine.avancer = function (S) {
  const cuisiniers = B.equipe.actifs(S, 'cuisine');
  if (!cuisiniers.length) return;
  const plonge = B.equipe.facteurPlonge(S);
  const enCours = {};
  S.groupes.forEach(function (g) { if (g.etat === 'cuisine' && g.cuisinier) enCours[g.cuisinier] = (enCours[g.cuisinier] || 0) + 1; });
  const attente = S.groupes.filter(function (g) { return g.etat === 'cuisine' && !g.cuisinier; })
    .sort(function (a, b) { return a.depuis - b.depuis || a.id - b.id; });
  for (const g of attente) {
    let choix = null;
    for (const c of cuisiniers) {
      const n = enCours[c.id] || 0;
      if (n < B.equipe.capaciteCuisinier(c) && (!choix || n < (enCours[choix.id] || 0) || (n === (enCours[choix.id] || 0) && c.vitesse > choix.vitesse))) choix = c;
    }
    if (!choix) break;
    enCours[choix.id] = (enCours[choix.id] || 0) + 1;
    g.cuisinier = choix.id;
    g.pret = S.minute + B.duree(S, B.DATA.clients.durees.cuisine) * B.equipe.facteurCuisine(choix) * plonge * (S.cal ? B.ev.facteurCuisine(S) : 1) * (g.refait ? B.DATA.carte.cuissons.refaireFacteur : 1);
  }
};
