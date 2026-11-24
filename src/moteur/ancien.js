/* ancien.js — lecture des parties de l'ancien jeu « Chez YaYa » (v1 à v10.2).
   Règle d'or : on LIT seulement. Aucune écriture, aucune suppression sur les cases de l'ancien jeu. */
B.ancien = {};

/* Cases utilisées par l'ancien jeu : 5 emplacements + la sauvegarde principale. */
B.ancien.cles = ['bistrot_slot1', 'bistrot_slot2', 'bistrot_slot3', 'bistrot_slot4', 'bistrot_slot5', 'bistrot_save_v1'];
B.ancien.cleActive = 'bistrot_active_slot';

B.ancien.lire = function (texte) {
  try {
    const o = JSON.parse(texte);
    if (!o || typeof o !== 'object' || typeof o.t !== 'number' || typeof o.cash !== 'number') return null;
    return o;
  } catch (e) { return null; }
};

/* Résumé lisible d'une ancienne partie. */
B.ancien.resumer = function (o) {
  const lieu = B.lieu(o.v96loc || 'paris');
  return {
    nom: (o.rName || 'Chez YaYa').trim(),
    lieu: lieu.id,
    lieuNom: lieu.nom,
    jour: Math.floor(o.t / 1440) + 1,
    argent: Math.round(o.cash * 100) / 100,
    note: typeof o.rep === 'number' && isFinite(o.rep) ? Math.round(o.rep * 100) / 100 : 3,
    versionSauvegarde: o.v || 0
  };
};

/* Crée une partie Bistrot à partir d'une ancienne partie (copie, l'originale reste intacte). */
B.ancien.convertir = function (o, infos) {
  const r = B.ancien.resumer(o);
  const S = B.nouvellePartie({ nom: r.nom, lieu: r.lieu, graine: infos && infos.graine, date: infos && infos.date });
  S.jour = Math.max(1, r.jour);
  S.argent = r.argent;
  S.note = Math.max(0, Math.min(5, r.note));
  S.origine = {
    jeu: 'Chez YaYa', versionSauvegarde: r.versionSauvegarde,
    cle: infos && infos.cle || null, reprisLe: infos && infos.date || null,
    reprisPourLinstant: ['nom', 'lieu', 'jour', 'argent', 'note']
  };
  return S;
};

/* Liste les anciennes parties trouvées, sans doublon (la sauvegarde principale recopie souvent un emplacement). */
B.ancien.trouver = function (lireCase) {
  const vues = {}, out = [];
  let active = null;
  try { active = lireCase(B.ancien.cleActive); } catch (e) { active = null; }
  B.ancien.cles.forEach(function (cle) {
    let txt = null;
    try { txt = lireCase(cle); } catch (e) { txt = null; }
    if (!txt) return;
    const o = B.ancien.lire(txt);
    if (!o) return;
    if (vues[txt]) return;
    vues[txt] = true;
    const n = cle.indexOf('slot') >= 0 ? +cle.slice(-1) : null;
    out.push({ cle: cle, emplacement: n, derniere: n === null || String(n) === String(active), texte: txt, resume: B.ancien.resumer(o) });
  });
  return out;
};
