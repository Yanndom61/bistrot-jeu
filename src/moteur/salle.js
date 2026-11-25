/* salle.js — le plan de la salle : tables, places, rallonges, chemins. */
B.salle = {};

B.salle.plan = function () { return B.DATA.salle; };
B.salle.geo = function (id) {
  return B.DATA.salle.tables.find(function (t) { return t.id === id; });
};
B.salle.taille = function (places) { return places <= 2 ? 60 : 84; };

/* Places autour d'une table : sur les côtés pour 2, dessus/dessous pour 4. */
B.salle.places = function (id) {
  const g = B.salle.geo(id), d = B.salle.taille(g.places) / 2 + 16;
  if (g.places <= 2) return [{ x: g.x - d, y: g.y }, { x: g.x + d, y: g.y }];
  return [
    { x: g.x - 21, y: g.y - d }, { x: g.x + 21, y: g.y - d },
    { x: g.x - 21, y: g.y + d }, { x: g.x + 21, y: g.y + d }
  ];
};

/* Centre d'un groupe de tables (une table seule, ou deux tables rapprochées). */
B.salle.centre = function (ids) {
  let x = 0, y = 0;
  ids.forEach(function (id) { const g = B.salle.geo(id); x += g.x; y += g.y; });
  return { x: x / ids.length, y: y / ids.length };
};
B.salle.nomTables = function (ids) { return ids.slice().sort(function (a, b) { return a - b; }).join('-'); };

/* Chemin simple : on rejoint l'allée centrale, on la longe, puis on va au but. */
B.salle.chemin = function (de, vers) {
  const A = B.DATA.salle.allee, pts = [];
  if (Math.abs(de.y - A) > 1) pts.push({ x: de.x, y: A });
  pts.push({ x: vers.x, y: A });
  if (Math.abs(vers.y - A) > 1) pts.push({ x: vers.x, y: vers.y });
  return pts;
};

/* Fait avancer une personne le long de son chemin. Renvoie vrai quand elle est arrivée. */
B.salle.bouger = function (p, dist) {
  while (dist > 0 && p.chemin.length) {
    const c = p.chemin[0], dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy);
    if (d <= dist) { p.x = c.x; p.y = c.y; p.chemin.shift(); dist -= d; }
    else { p.x += dx / d * dist; p.y += dy / d * dist; dist = 0; }
  }
  return p.chemin.length === 0;
};

/* Cherche une table libre : la plus petite qui suffit, sinon deux tables rapprochées. */
B.salle.chercher = function (S, taille) {
  const libre = function (id) {
    const t = S.tables.find(function (x) { return x.id === id; });
    return t && !t.groupe && !t.sale && !t.reserve;
  };
  const seules = S.tables.filter(function (t) { return libre(t.id) && t.places >= taille; })
    .sort(function (a, b) { return a.places - b.places || a.id - b.id; });
  if (seules.length) return [seules[0].id];
  for (const r of B.DATA.salle.rallonges) {
    const total = r.reduce(function (s, id) { return s + B.salle.geo(id).places; }, 0);
    if (total >= taille && r.every(libre)) return r.slice();
  }
  return null;
};
B.salle.tableDe = function (S, id) { return S.tables.find(function (t) { return t.id === id; }); };
