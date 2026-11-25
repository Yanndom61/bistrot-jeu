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
  B.carte.creer(S);
  const carte = B.ancien.reprendreCarte(S, o);
  S.equipeReprise = n;
  S.jour = Math.max(1, r.jour);
  S.argent = r.argent;
  S.note = Math.max(0, Math.min(5, r.note));
  B.stock.creer(S, true);
  const stocks = B.ancien.reprendreStocks(S, o);
  if (!stocks.produits) { B.stock.premieresCourses(S); B.menuJour.calculer(S); }
  S.origine = {
    jeu: 'Chez YaYa', versionSauvegarde: r.versionSauvegarde,
    cle: infos && infos.cle || null, reprisLe: infos && infos.date || null,
    reprisPourLinstant: ['nom', 'lieu', 'jour', 'argent', 'note', 'equipe', 'carte', 'stocks'],
    carte: carte, stocks: stocks
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

/* Reprend la carte de l'ancienne partie : plats présents dans Bistrot (mêmes identifiants), à la carte ou non, et leur prix.
   Les plats de saison, du menu du jour et les boissons de l'ancien jeu ne sont pas encore dans Bistrot. */
B.ancien.reprendreCarte = function (S, o) {
  const m = o && o.menu && typeof o.menu === 'object' ? o.menu : null;
  const r = { lus: 0, ignores: 0, ajustes: 0 };
  if (!m) return r;
  const P = B.DATA.carte.prix;
  let touche = false;
  B.carte.catalogue(S).forEach(function (d) {
    const a = m[d.id];
    if (!a || typeof a !== 'object' || typeof a.on !== 'boolean') return;
    if (!touche) {
      /* on repart de zéro pour chaque catégorie présente dans l'ancienne carte */
      const presentes = {};
      B.carte.catalogue(S).forEach(function (x) { if (m[x.id] && typeof m[x.id].on === 'boolean') presentes[x.cat] = 1; });
      B.carte.TOUTES.forEach(function (c) { if (presentes[c]) B.carte.surCarte(S, c).forEach(function (id) { S.carte.plats[id].on = false; }); });
      touche = true;
    }
    S.carte.plats[d.id].on = a.on && B.carte.enSaison(S, d);
    const conseille = B.carte.prixConseille(S, d), prix = +a.price;
    if (isFinite(prix) && prix >= P.minimum && prix <= conseille * P.maxFoisConseille) S.carte.plats[d.id].prix = Math.round(prix * 2) / 2;
    r.lus++;
  });
  if (!touche) return r;
  Object.keys(m).forEach(function (id) { if (m[id] && m[id].on && !S.carte.plats[id]) r.ignores++; });
  const avant = JSON.stringify(B.carte.surCarte(S));
  B.carte.completer(S);
  if (JSON.stringify(B.carte.surCarte(S)) !== avant) r.ajustes = 1;
  return r;
};

/* Reprend la réserve de l'ancienne partie : quantités, dates limites (lots), prix payés, commandes en route,
   commande automatique. Les produits que Bistrot ne connaît pas sont ignorés. Renvoie un résumé. */
B.ancien.reprendreStocks = function (S, o) {
  const r = { produits: 0, portions: 0, perimes: 0, commandes: 0 };
  if (!o || !o.stock || typeof o.stock !== 'object') return r;
  const jourAncien = Math.floor((+o.t || 0) / 1440);
  S.stocks.lots = {};
  for (const i in o.stock) {
    const st = o.stock[i];
    if (!B.DATA.stocks.ingredients[i] || !st || !(+st.q >= 1)) continue;
    const prix = isFinite(+st.cost) && +st.cost > 0 ? B.r2(+st.cost) : B.stock.prixAchat(S, i, 'grossiste');
    const lots = Array.isArray(o.lots && o.lots[i]) ? o.lots[i].filter(function (l) { return l && +l.q > 0 && isFinite(+l.exp); }) : [];
    let reste = Math.floor(+st.q);
    lots.sort(function (a, b) { return a.exp - b.exp; }).forEach(function (l) {
      const q = Math.min(reste, Math.floor(+l.q));
      if (q <= 0) return;
      const dlc = S.jour + (Math.floor(+l.exp) - jourAncien);
      if (dlc < S.jour) { r.perimes += q; reste -= q; return; }
      B.stock.lots(S, i).push({ q: q, dlc: dlc, prix: prix, four: 'grossiste' });
      reste -= q;
    });
    if (reste > 0) B.stock.lots(S, i).push({ q: reste, dlc: S.jour + B.stock.info(i).dlc - 1, prix: prix, four: 'grossiste' });
    B.stock.lots(S, i).sort(function (a, b) { return a.dlc - b.dlc; });
    r.produits++; r.portions += Math.floor(+st.q) - 0;
  }
  r.portions -= r.perimes;
  const F = { marche: 'marche', gros: 'grossiste', disc: 'discount', bio: 'bio' };
  (Array.isArray(o.orders) ? o.orders : []).forEach(function (c) {
    if (!c || !c.items) return;
    const lignes = {}, prix = {};
    for (const i in c.items) if (B.DATA.stocks.ingredients[i] && +c.items[i] > 0) { lignes[i] = Math.floor(+c.items[i]); prix[i] = B.r2(+(c.unit && c.unit[i]) || B.stock.prixAchat(S, i, 'grossiste')); }
    if (!Object.keys(lignes).length) return;
    S.stocks.commandes.push({ id: S.prochainId++, four: F[c.sup] || 'grossiste', lignes: lignes, prix: prix, cout: B.r2(+c.cost || 0), passee: B.maintenant(S), arrivee: B.maintenant(S), auto: false });
    r.commandes++;
  });
  if (o.auto && typeof o.auto === 'object') S.stocks.auto = Object.keys(o.auto).some(function (i) { return o.auto[i] && o.auto[i].on; });
  B.stock.livrer(S, true);
  B.menuJour.calculer(S);
  return r;
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
