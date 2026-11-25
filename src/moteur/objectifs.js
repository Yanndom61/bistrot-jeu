/* objectifs.js — v0.9 (étape 7) : objectifs simples et progressifs (donnees/objectifs.json).
   État gardé dans S.objectifs = { faits: { id: jour } } (champ facultatif : les sauvegardes 0.8 le reçoivent au chargement). */
B.objectifs = {};
B.objectifs.liste = function () { return B.DATA.objectifs.liste; };
B.objectifs.etat = function (S) {
  if (!S.objectifs) S.objectifs = { faits: {} };
  return S.objectifs;
};
B.objectifs.total = function (S) { return (S.stats.totalServis || 0) + (S.finJour ? 0 : (S.stats.jour.servis || 0)); };

/* Où on en est pour un objectif : { fait, n, sur } (n / sur pour afficher une progression quand il y en a une). */
B.objectifs.avance = function (S, o) {
  const E = B.objectifs.etat(S);
  if (E.faits[o.id]) return { fait: true };
  const reels = S.equipe.filter(function (p) { return !p.patron && !p.interim && !p.partant; });
  switch (o.type) {
    case 'equipe': { const n = reels.filter(function (p) { return p.service === o.service; }).length; return { fait: n >= o.n, n: n, sur: o.n }; }
    case 'poste': { const n = reels.filter(function (p) { return p.poste === o.poste; }).length; return { fait: n >= o.n, n: n, sur: o.n }; }
    case 'ouvert': return { fait: !!S.dejaOuvert };
    case 'servis': { const n = B.objectifs.total(S); return { fait: n >= o.n, n: Math.min(n, o.n), sur: o.n }; }
    case 'jours': { const n = S.stats.joursJoues || 0; return { fait: n >= o.n, n: Math.min(n, o.n), sur: o.n }; }
    case 'benefice_jour': return { fait: !!(S.bilan && S.bilan.resultat > 0) };
    case 'proprete': return { fait: !!(S.bilan && S.proprete >= o.n) };
    case 'prive': return { fait: !!(S.bilan && S.bilan.prives > 0) };
    case 'benefice_semaine': return { fait: !!(S.semaines && S.semaines.length && S.semaines[0].resultat > 0) };
  }
  return { fait: false };
};

/* Le premier objectif pas encore réussi (null quand tout est fait). */
B.objectifs.courant = function (S) {
  const E = B.objectifs.etat(S);
  return B.objectifs.liste().find(function (o) { return !E.faits[o.id]; }) || null;
};

/* Coche ce qui vient d'être réussi. silencieux = pas de message (reprise d'une ancienne partie). Renvoie les ids réussis. */
B.objectifs.verifier = function (S, silencieux) {
  const E = B.objectifs.etat(S), nouveaux = [];
  B.objectifs.liste().forEach(function (o) {
    if (!E.faits[o.id] && B.objectifs.avance(S, o).fait) { E.faits[o.id] = S.jour; nouveaux.push(o.id); }
  });
  if (nouveaux.length && !silencieux) {
    nouveaux.forEach(function (id) { B.message(S, 'msg_objectif_fait', { titre: B.t('obj_' + id) }); });
    const c = B.objectifs.courant(S);
    B.message(S, c ? 'msg_objectif_suivant' : 'msg_objectif_tous', { titre: c ? B.t('obj_' + c.id) : '' });
  }
  return nouveaux;
};
B.objectifs.nbFaits = function (S) { const E = B.objectifs.etat(S); return B.objectifs.liste().filter(function (o) { return E.faits[o.id]; }).length; };
