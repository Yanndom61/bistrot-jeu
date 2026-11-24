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
  B.equipe.creerPatron(S);
  const n = B.ancien.reprendreEquipe(S, o);
  const patron = B.equipe.patron(S);
  if (!B.equipe.salle(S).filter(function (p) { return !p.patron; }).length) patron.service = 'salle';
  else if (!B.equipe.cuisine(S).length) patron.service = 'cuisine';
  B.equipe.replacer(S);
  B.equipe.genererDepart(S);
  S.ouvert = B.equipe.peutOuvrir(S);
  S.dejaOuvert = S.ouvert;
  S.equipeReprise = n;
  S.jour = Math.max(1, r.jour);
  S.argent = r.argent;
  S.note = Math.max(0, Math.min(5, r.note));
  S.origine = {
    jeu: 'Chez YaYa', versionSauvegarde: r.versionSauvegarde,
    cle: infos && infos.cle || null, reprisLe: infos && infos.date || null,
    reprisPourLinstant: ['nom', 'lieu', 'jour', 'argent', 'note', 'equipe']
  };
  return S;
};

/* Reprend les employés lisibles de l'ancien jeu. Salaire recalculé sur la grille HCR (poste + expérience).
   Bar, plonge et nettoyage sont gardés dans l'équipe, leur rôle viendra plus tard. Renvoie le nombre repris. */
B.ancien.reprendreEquipe = function (S, o) {
  const staff = Array.isArray(o.staff) ? o.staff : [];
  const fem = B.DATA.equipe.prenomsFemininsAncienJeu.concat(B.DATA.equipe.prenoms.filter(function (p) { return p[1] === 'f'; }).map(function (p) { return p[0]; }));
  const borne = function (v, d) { v = Math.round(+v); return isFinite(v) ? Math.max(1, Math.min(10, v)) : d; };
  const persos = { 'sérieux': 'serieux', 'souriant': 'souriant', 'ambitieux': 'ambitieux', 'discret': 'discret', 'stressé': 'stresse', 'blagueur': 'blagueur', 'posé': 'pose' };
  let n = 0;
  staff.forEach(function (s) {
    if (!s || typeof s.name !== 'string' || !s.name.trim()) return;
    if (s.tmp || (s.ct && s.ct.k === 'interim')) return; /* intérimaires d'un jour : pas repris */
    let poste = B.DATA.equipe.postes[s.post] ? s.post : (s.role === 'cook' ? 'commis' : s.role === 'waiter' ? 'serv' : null);
    if (!poste) return;
    const sub = s.sub || {}, note = borne(s.skill, 5), exp = Math.max(0, Math.min(45, Math.round(+s.exp) || 0));
    B.equipe.nouveauMembre(S, {
      nom: s.name.trim().slice(0, 40), genre: fem.indexOf(s.name.split(' ')[0]) >= 0 ? 'f' : 'm', poste: poste,
      note: note, vitesse: borne(sub.vit, note), amabilite: borne(sub.ami, note), qualite: borne(sub.qua, note),
      salaire: B.equipe.minimum(S, poste, exp), experience: exp, perso: persos[s.pers] || null
    });
    n++;
  });
  return n;
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
