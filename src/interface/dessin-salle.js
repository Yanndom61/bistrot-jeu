/* dessin-salle.js — dessine la salle en largeur (format paysage), les clients et les serveurs. */
UI.dessin = {};

UI.dessin.fond = function () {
  const P = B.DATA.salle, W = P.dessin.largeur, H = P.dessin.hauteur, e = P.entree, k = P.cuisine;
  let s = '';
  s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#3a2a22"/>';
  s += '<rect x="12" y="12" width="' + (W - 24) + '" height="' + (H - 24) + '" fill="#efe1c6"/>';
  for (let x = 12; x < k.x; x += 56) s += '<line x1="' + x + '" y1="12" x2="' + x + '" y2="' + (H - 12) + '" stroke="#e4d2b0" stroke-width="2"/>';
  /* Cuisine */
  s += '<rect x="' + k.x + '" y="' + k.y + '" width="' + k.largeur + '" height="' + k.hauteur + '" fill="#dfe4e6"/>';
  for (let y = k.y; y < k.y + k.hauteur; y += 33) s += '<line x1="' + k.x + '" y1="' + y + '" x2="' + (k.x + k.largeur) + '" y2="' + y + '" stroke="#cfd6d9" stroke-width="2"/>';
  s += '<rect x="' + (k.x + 30) + '" y="' + (k.y + 30) + '" width="80" height="56" rx="6" fill="#555"/>';
  s += '<circle cx="' + (k.x + 52) + '" cy="' + (k.y + 58) + '" r="13" fill="#333" stroke="#888" stroke-width="3"/><circle cx="' + (k.x + 88) + '" cy="' + (k.y + 58) + '" r="13" fill="#333" stroke="#888" stroke-width="3"/>';
  s += '<text x="' + (k.x + k.largeur / 2) + '" y="' + (k.y + 124) + '" class="lieu-txt">' + UI.esc(B.t('salle_cuisine')) + '</text>';
  /* Passe : le comptoir où les plats sortent de la cuisine */
  s += '<rect x="' + (k.x - 16) + '" y="' + (P.allee - 87) + '" width="16" height="174" rx="4" fill="#9b9b9b"/>';
  s += '<text x="' + (k.x - 8) + '" y="' + (P.allee - 97) + '" class="petit-txt">' + UI.esc(B.t('salle_passe')) + '</text>';
  /* Bar (en haut, près de la passe) et plonge (en bas de la cuisine) */
  s += '<rect x="' + (P.passe.x - 46) + '" y="22" width="92" height="14" rx="4" fill="#7a5233"/>';
  s += '<rect x="' + (k.x + 14) + '" y="' + (k.y + k.hauteur - 12) + '" width="104" height="10" rx="3" fill="#9fb8c8"/>';
  /* Murs avec la porte d'entrée à gauche */
  s += '<path d="M12 12 H' + (W - 12) + ' V' + (H - 12) + ' H12 V' + (e.y + 32) + ' M12 ' + (e.y - 32) + ' V12" fill="none" stroke="#5a4636" stroke-width="10"/>';
  s += '<text x="22" y="' + (e.y - 42) + '" class="petit-txt gauche">' + UI.esc(B.t('salle_entree')) + '</text>';
  /* Tables et chaises */
  P.tables.forEach(function (t) {
    B.salle.places(t.id).forEach(function (p) { s += '<rect x="' + (p.x - 13) + '" y="' + (p.y - 13) + '" width="26" height="26" rx="7" fill="#9a6a45"/>'; });
  });
  P.tables.forEach(function (t) {
    const c = B.salle.taille(t.places);
    s += '<rect x="' + (t.x - c / 2) + '" y="' + (t.y - c / 2) + '" width="' + c + '" height="' + c + '" rx="8" fill="#b9834f" stroke="#7a5233" stroke-width="3"/>';
  });
  UI.$('fond').innerHTML = s;
  /* Zones à toucher (plus grandes que les tables) */
  let h = '';
  P.tables.forEach(function (t) {
    const w = t.places <= 2 ? 136 : 128, hh = t.places <= 2 ? 100 : 150;
    h += '<rect data-table="' + t.id + '" x="' + (t.x - w / 2) + '" y="' + (t.y - hh / 2) + '" width="' + w + '" height="' + hh + '" fill="transparent"/>';
  });
  UI.$('touches').innerHTML = h;
};

/* Position verticale du n-ième groupe de la file (les gros groupes prennent plus de place). */
UI.dessin.yFile = function (S, rang) {
  let y = B.DATA.salle.file.y, i = 0;
  for (const g of S.groupes) {
    if (g.etat !== 'file') continue;
    if (i === rang) return y + (Math.ceil(g.taille / 2) - 1) * 11;
    y += Math.ceil(g.taille / 2) * 22 + 22; i++;
  }
  return y;
};

UI.dessin.couleur = function (g) { return B.clients.type(g.type).couleur; };

UI.dessin.client = function (x, y, couleur) {
  return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14" fill="' + couleur + '" stroke="#fff" stroke-width="3"/>';
};

/* Petit groupe qui marche : les personnes en paquet autour d'un point. */
UI.dessin.paquet = function (g, x, y) {
  let s = '';
  for (let i = 0; i < g.taille; i++) {
    const col = i % 2, lig = Math.floor(i / 2);
    s += UI.dessin.client(x - 11 + col * 22, y - (Math.ceil(g.taille / 2) - 1) * 11 + lig * 22, UI.dessin.couleur(g));
  }
  return s;
};

UI.dessin.etiquette = function (x, y, texte, couleur) {
  const w = Math.max(70, texte.length * 12.5 + 20);
  return '<rect x="' + (x - w / 2) + '" y="' + (y - 14) + '" width="' + w + '" height="28" rx="14" fill="' + couleur + '"/>' +
    '<text x="' + x + '" y="' + (y + 8) + '" class="etiq">' + UI.esc(texte) + '</text>';
};

UI.dessin.couleurs = { vert: '#2f8f55', orange: '#d9811c', rouge: '#c73a3a', neutre: '#5a463b', sale: '#8a8a8a' };

UI.dessin.dynamique = function () {
  const S = UI.S, P = B.DATA.salle;
  let bas = '', haut = '', etiq = '';
  /* Rallonges entre deux tables rapprochées, miettes sur les tables sales, assiettes */
  S.groupes.forEach(function (g) {
    if (g.tables && g.tables.length > 1 && g.etat !== 'file') {
      const a = B.salle.geo(g.tables[0]), b = B.salle.geo(g.tables[1]);
      bas += '<rect x="' + (Math.min(a.x, b.x) + 40) + '" y="' + (a.y - 30) + '" width="' + (Math.abs(b.x - a.x) - 80) + '" height="60" fill="#b9834f" stroke="#7a5233" stroke-width="3"/>';
    }
  });
  const choisie = UI.selection && B.salle.tableDe(S, UI.selection);
  const gChoisi = choisie && choisie.groupe && S.groupes.find(function (g) { return g.id === choisie.groupe; });
  const tablesChoisies = gChoisi ? gChoisi.tables : (choisie ? [choisie.id] : []);
  S.tables.forEach(function (t) {
    const geo = B.salle.geo(t.id);
    if (t.sale) {
      bas += '<circle cx="' + (geo.x - 12) + '" cy="' + (geo.y - 8) + '" r="9" fill="#f4f4f4" stroke="#999" stroke-width="2"/><circle cx="' + (geo.x + 14) + '" cy="' + (geo.y + 10) + '" r="9" fill="#f4f4f4" stroke="#999" stroke-width="2"/>';
    }
    if (tablesChoisies.indexOf(t.id) >= 0) {
      const c = B.salle.taille(geo.places) + 14;
      haut += '<rect x="' + (geo.x - c / 2) + '" y="' + (geo.y - c / 2) + '" width="' + c + '" height="' + c + '" rx="12" fill="none" stroke="#1d6fd8" stroke-width="5"/>';
    }
  });
  /* Numéros de table */
  P.tables.forEach(function (t) {
    haut += '<text x="' + t.x + '" y="' + (t.y + 11) + '" class="num">' + t.id + '</text>';
  });
  /* Clients */
  let rangFile = 0, nbFile = 0, touchesFile = '';
  const manuel = S.placement === 'manuel' && S.ouvert;
  S.groupes.forEach(function (g) {
    const assis = ['carte', 'commande', 'cuisine', 'pret', 'mange', 'addition'].indexOf(g.etat) >= 0;
    if (g.etat === 'file') {
      nbFile++;
      const yf = UI.dessin.yFile(S, rangFile), demi = Math.ceil(g.taille / 2) * 11;
      if (yf + demi <= 428) {
        if (UI.groupeChoisi === g.id) haut += '<rect x="' + (P.file.x - 30) + '" y="' + (yf - demi - 8) + '" width="60" height="' + (2 * demi + 16) + '" rx="10" fill="none" stroke="#1d6fd8" stroke-width="5"/>';
        bas += UI.dessin.paquet(g, P.file.x, yf);
        if (manuel) touchesFile += '<rect data-groupe="' + g.id + '" x="' + (P.file.x - 40) + '" y="' + (yf - demi - 11) + '" width="80" height="' + (2 * demi + 22) + '" fill="transparent"/>';
      }
      rangFile++;
    } else if (assis) {
      const places = [];
      g.tables.forEach(function (id) { B.salle.places(id).forEach(function (p) { places.push(p); }); });
      for (let i = 0; i < g.taille; i++) bas += UI.dessin.client(places[i].x, places[i].y, UI.dessin.couleur(g));
      if (g.etat === 'mange') g.tables.forEach(function (id) {
        const geo = B.salle.geo(id);
        bas += '<circle cx="' + geo.x + '" cy="' + (geo.y - 22) + '" r="10" fill="#fff" stroke="#ccc" stroke-width="2"/>';
      });
      const c = B.salle.centre(g.tables), geo = B.salle.geo(g.tables[0]);
      const y = geo.y < P.allee ? geo.y - 85 : geo.y + 89;
      etiq += UI.dessin.etiquette(c.x, y, B.t('etat_court_' + g.etat), UI.dessin.couleurs[UI.classeAttente(g)]);
    } else {
      bas += UI.dessin.paquet(g, g.x, g.y);
    }
  });
  S.tables.forEach(function (t) {
    if (!t.sale) return;
    const geo = B.salle.geo(t.id), y = geo.y < P.allee ? geo.y - 85 : geo.y + 89;
    etiq += UI.dessin.etiquette(geo.x, y, B.t('etat_court_sale'), UI.dessin.couleurs.sale);
  });
  if (nbFile) etiq += '<text x="22" y="' + (P.file.y - 30) + '" class="petit-txt gauche">' + UI.esc(B.t('salle_file', { n: nbFile })) + '</text>';
  /* Cuisine : veste blanche et toque */
  B.equipe.cuisine(S).forEach(function (w) {
    const x = w.x, y = w.y, occupe = S.groupes.some(function (g) { return g.cuisinier === w.id; });
    haut += '<rect x="' + (x - 11) + '" y="' + (y - 33) + '" width="22" height="14" rx="4" fill="#fff" stroke="#555" stroke-width="2"/>';
    haut += '<circle cx="' + x + '" cy="' + y + '" r="16" fill="' + (w.patron ? '#8e2a22' : '#ffffff') + '" stroke="' + (occupe ? '#d9811c' : '#555') + '" stroke-width="3"/>';
  });
  /* Bar : rond foncé cerclé de bleu, avec un verre ; plonge : rond blanc cerclé de bleu */
  B.equipe.duService(S, 'bar').forEach(function (w) {
    haut += '<circle cx="' + w.x + '" cy="' + w.y + '" r="16" fill="#1f1f1f" stroke="#5fb3d9" stroke-width="3"/>';
    haut += '<path d="M' + (w.x - 5) + ' ' + (w.y - 6) + ' h10 l-3 9 h-4 z" fill="#fff"/>';
  });
  B.equipe.duService(S, 'plonge').forEach(function (w) {
    haut += '<circle cx="' + w.x + '" cy="' + w.y + '" r="16" fill="#ffffff" stroke="#2f7fbf" stroke-width="3"/>';
    haut += '<rect x="' + (w.x - 7) + '" y="' + (w.y - 2) + '" width="14" height="12" rx="2" fill="#2f7fbf"/>';
  });
  /* Salle : rond foncé avec tablier blanc (le patron en rouge foncé) */
  B.equipe.salle(S).forEach(function (w) {
    const x = w.x.toFixed(1), y = w.y.toFixed(1);
    haut += '<circle cx="' + x + '" cy="' + y + '" r="17" fill="' + (w.patron ? '#8e2a22' : '#1f1f1f') + '" stroke="#f2c14e" stroke-width="3"/>';
    haut += '<rect x="' + (w.x - 7).toFixed(1) + '" y="' + (w.y - 2).toFixed(1) + '" width="14" height="14" rx="2" fill="#fff"/>';
    const e = w.tache && w.tache.etapes[0];
    if (e && e.porte === 'assiette') haut += '<circle cx="' + (w.x + 20).toFixed(1) + '" cy="' + (w.y - 14).toFixed(1) + '" r="10" fill="#fff" stroke="#bbb" stroke-width="2"/>';
    if (e && e.porte === 'addition') haut += '<rect x="' + (w.x + 12).toFixed(1) + '" y="' + (w.y - 26).toFixed(1) + '" width="14" height="20" fill="#fff" stroke="#bbb" stroke-width="2"/>';
  });
  const tf = UI.$('touches-file');
  if (tf._html !== touchesFile) { tf.innerHTML = touchesFile; tf._html = touchesFile; }
  const html = bas + haut + etiq;
  const dyn = UI.$('dyn');
  if (dyn._html !== html) { dyn.innerHTML = html; dyn._html = html; }
};

UI.dessin.initTouches = function () {
  UI.$('touches-file').addEventListener('click', function (e) {
    const r = e.target.closest('[data-groupe]');
    if (!r || !UI.S) return;
    const id = +r.dataset.groupe;
    UI.groupeChoisi = UI.groupeChoisi === id ? null : id;
    UI.selection = null;
    UI.majDetail(); UI.dessin.dynamique();
  });
  UI.$('touches').addEventListener('click', function (e) {
    const r = e.target.closest('[data-table]');
    if (!r || !UI.S) return;
    const id = +r.dataset.table;
    if (UI.groupeChoisi) {
      const res = B.clients.placerManuel(UI.S, UI.groupeChoisi, id);
      if (res.ok) UI.groupeChoisi = null;
      else B.flux.push({ jour: UI.S.jour, minute: Math.floor(UI.S.minute), texte: B.t(res.erreur, res.vars) });
      UI.majDetail(); UI.dessin.dynamique();
      return;
    }
    UI.selection = UI.selection === id ? null : id;
    UI.majDetail();
    UI.dessin.dynamique();
  });
};
