"""Étape 3 (stocks) : extrait de l'ancien jeu « Chez YaYa » (bistrot.html v10.2, lecture seule) les plats de saison,
les plats du menu du jour, les boissons, les durées de conservation et les fournisseurs, et construit la base de prix
de gros à partir des mercuriales RNM / FranceAgriMer de Rungis enregistrées dans outils/extraction/sources-prix/.
  python3 outils/extraction/extraire-stocks.py
Écrit : donnees/prix-gros.json, donnees/stocks.json, et ajoute saisonniers / menuDuJour / boissons à donnees/catalogue.json."""
import json, re, pathlib
SRC = pathlib.Path('/workspace/bistrot/bistrot.html')
RACINE = pathlib.Path(__file__).resolve().parents[2]
SOURCES = pathlib.Path(__file__).resolve().parent / 'sources-prix'
lignes = SRC.read_text(encoding='utf-8').split('\n')
txt = '\n'.join(lignes)

def json_const(nom):
    for l in lignes:
        if l.startswith('const ' + nom + '='):
            return json.loads(l[l.index('=') + 1:].rstrip().rstrip(';'))
    raise SystemExit('introuvable : ' + nom)
V10L, V10ING = json_const('V10L'), json_const('V10ING')
CAT = json.loads((RACINE / 'donnees/catalogue.json').read_text())
ING = CAT['ingredients']

# ---------- 1) Mercuriales RNM (Rungis) ----------
cotes = {}   # libellé -> (prix, séance, fichier)
for f in sorted(SOURCES.glob('*.txt')):
    t = f.read_text().split('\n')
    seance = re.search(r'Séance du ([\d/]+)', t[1]).group(1)
    for l in t[2:]:
        if ' = ' not in l: continue
        a, b = l.rsplit(' = ', 1)
        cotes[a] = (float(b.replace('€', '').replace(' ', '').replace(',', '.')), seance, f.name)

def cote(lib):
    if lib not in cotes: raise SystemExit('cote introuvable : ' + lib)
    return cotes[lib]

# Pour chaque ingrédient : produits RNM de référence, quantité par portion (kg, ou pièces quand le prix est à la pièce / au colis).
# « moyenne » = panier de produits représentatifs (prix moyen) ; « plus » = part non cotée à Rungis, estimée (euros).
P = {
 'legumes':  ('moyenne', [('TOMATE ronde France grappe extra', .2), ('CAROTTE France extra colis 12kg', .2), ('POIREAU France cat.I', .2), ('COURGETTE verte Espagne cat.I 14-21cm', .2)], 0, '200 g de légumes'),
 'oignon':   ('moyenne', [('OIGNON jaune France cat.I 60-80mm', .1)], 0, '100 g'),
 'boeuf':    ('moyenne', [('BOEUF vache (faux filet) semi-paré U.E. sous-vide', .2)], 0, 'pièce de 200 g'),
 'paleron':  ('moyenne', [('BOEUF vache (paleron) semi-paré U.E. sous-vide', .22)], 0, '220 g à mijoter'),
 'patate':   ('moyenne', [('POMME DE TERRE basique div.var.cons France lavée cat.I 40-70mm sac 10kg', .25)], 0, '250 g'),
 'poisson':  ('moyenne', [('SOLE (entière) taille 3 France', .2), ('LIEU jaune (filet) France', .2), ('BAR frais (entier) aquaculture 600-800g France', .2)], 0, '200 g de poisson'),
 'creme':    ('moyenne', [('OEUF M(53-63g) cat.A France colis de 360', 2 / 360)], 0.15, '2 œufs + crème (crème estimée 0,15 €)'),
 'pomme':    ('moyenne', [('POMME Golden France cat.I 170/220g plateau 2rg', .2)], 0, '200 g'),
 'volaille': ('moyenne', [('POULET (entier) prêt à cuire France label', .4)], 0, '¼ de poulet avec os (400 g)'),
 'veau':     ('moyenne', [('VEAU (épaule sans os) semi-paré U.E. sous-vide', .18)], 0, '180 g'),
 'fruits':   ('moyenne', [('POIRE Conférence France cat.I caisse', .15), ('CLÉMENTINE Corse cat.I 3', .15), ('RAISIN Italia Italie cat.I frigo plateau', .15), ('FRAISE Charlotte France cat.I barq.500g (les 500g)', .15 / .5)], 0, '150 g de fruits'),
 'salverte': ('moyenne', [('LAITUE Batavia blonde France cat.I colis de 12 (les 12 pièces)', .25 / 12)], 0, '¼ de laitue'),
 'legsais':  ('moyenne', [('COURGE Butternut France', .2), ('POIREAU France cat.I', .2), ('CHOU DE BRUXELLES France cat.I', .2), ('CAROTTE France extra colis 12kg', .2), ('CÉLERI-RAVE France', .2)], 0, '200 g de garniture'),
 'fruitf':   ('moyenne', [('CITRON Espagne cat.I 4(58-67mm)', .06), ('LIME Brésil bateau', .06)], 0, '60 g d’agrumes'),
 'porc':     ('moyenne', [('PORC (poitrine) sans hachage France N.1', .22)], 0, '220 g'),
 'agneau':   ('moyenne', [('AGNEAU (épaule) U.E. (y.c. Royaume-Uni)', .2)], 0, '200 g'),
 'canard':   ('moyenne', [('CANARD (magret) France standard', .22), ('CANARD de Barbarie (cuisse) France standard', .22)], 0, '220 g (magret ou cuisse)'),
 'fdm':      ('moyenne', [('ENCORNET congelé (entier) moyen Import', .12), ('GAMBAS congelée taille 4 Import', .12), ('CREVETTE grise congelée cuite triée sauvage moyenne Europe du nord', .12)], 0, '120 g, surgelés'),
 'poissonl': ('moyenne', [('DORADE grise 500-800g France', .18), ('CABILLAUD (filet) 100-200g France', .18), ('THON rouge (filet) sous vide moyen Import', .18)], 0, '180 g'),
 'manioc':   ('moyenne', [('PATATE DOUCE Import', .2)], 0, '200 g'),
 'coco':     ('moyenne', [("NOIX DE COCO Côte d'Ivoire colis de 15 (la pièce)", .25)], 0, '¼ de noix'),
 'herbes':   ('moyenne', [('PERSIL simple France botte (les 10 bottes)', .025), ('CORIANDRE France botte (les 10 bottes)', .025), ('BASILIC France botte (les 10 bottes)', .025), ('MENTHE France botte (les 10 bottes)', .025)], 0, '¼ de botte'),
 'fruitex':  ('moyenne', [('MANGUE Kent Brésil avion', .15), ('ANANAS Sweet Afrique B(1100-1500g) bateau', .15), ('PAPAYE Brésil avion', .15), ('FRUIT DE LA PASSION color.violet Colombie', .15)], 0, '150 g'),
}
# Saisons (France métropolitaine ; décalées de 6 mois dans l'hémisphère sud). Ancien jeu : V95SEAS.
SAISONS = {'fruits': [4, 5, 6, 7, 8], 'legumes': [3, 4, 5, 6, 7, 8, 9], 'salverte': [3, 4, 5, 6, 7, 8, 9], 'pomme': [8, 9, 10, 11, 0, 1], 'herbes': [4, 5, 6, 7, 8]}
EN_SAISON, HORS_SAISON, MOIS_RELEVE = 0.85, 1.30, 10   # relevé de novembre

produits = {}
for k, v in ING.items():
    if k in P:
        mode, comp, plus, note = P[k]
        parts = []
        for lib, q in comp:
            prix, seance, fic = cote(lib)
            parts.append({'libelle': lib, 'prix': prix, 'seance': seance, 'fichier': fic, 'parPortion': round(prix * q, 4)})
        p = sum(x['parPortion'] for x in parts) / len(parts) + plus
        coefReleve = (EN_SAISON if MOIS_RELEVE in SAISONS[k] else HORS_SAISON) if k in SAISONS else 1
        produits[k] = {'prix': round(p / coefReleve, 3), 'prixReleve': round(p, 3), 'source': 'rnm', 'portion': note, 'cotes': parts}
    else:
        produits[k] = {'prix': v['prix'], 'source': 'estimation', 'portion': 'portion de l’ancien jeu'}
    if k in SAISONS: produits[k]['saison'] = SAISONS[k]
prix_gros = {
    '_source': "Prix de gros moyens du MIN de Rungis, mercuriales officielles du Réseau des Nouvelles des Marchés (RNM, FranceAgriMer), "
               "séances du 02/11/2026 au 12/11/2026, relevées le 25/11/2026 sur https://hallesx.com/mercuriale/rungis (copie des cotes : "
               "outils/extraction/sources-prix/). Les produits non cotés à Rungis (épicerie, boissons, fromage, charcuterie…) gardent "
               "l'estimation de l'ancien jeu. Le jeu reste hors ligne : aucun téléchargement pendant la partie.",
    'releve': '2026-11-25', 'seances': '02/11/2026 – 12/11/2026', 'unite': 'euros HT par portion, prix France ; × coefficient « prix » du lieu',
    'saison': {'enSaison': EN_SAISON, 'horsSaison': HORS_SAISON, 'moisReleve': MOIS_RELEVE,
               '_explication': "prix = prix de référence × 0,85 en pleine saison, × 1,30 hors saison. Le prix de référence est le prix relevé en novembre ramené à une saison « normale »."},
    'produits': produits,
}
(RACINE / 'donnees/prix-gros.json').write_text(json.dumps(prix_gros, ensure_ascii=False, indent=1) + '\n')

# ---------- 2) Conservation et rangement ----------
SHELF = dict(re.findall(r"(\w+):(\d+)", re.search(r"const SHELF=\{([^}]*)\}", txt).group(1)))
for k, o in re.findall(r"\n (\w+):\{n:'[^']*',e:'[^']*',p:[\d.]+,sp:[\d.]+,sh:(\d+)\}", re.search(r"const V98ING=\{(.*?)\n\};", txt, re.S).group(0)):
    SHELF[k] = o
for k, a in V10ING.items(): SHELF[k] = a[5]
DEF = {'glace': 180, 'fruitf': 10, 'lait': 7, 'fdm': 90}
ingredients = {}
for k in ING:
    dlc = int(DEF.get(k, SHELF.get(k, 30)))
    rang = 'congel' if k in ('glace', 'fdm') else ('sec' if (dlc >= 30 or k == 'pain') and k != 'beurre' else 'froid')
    ingredients[k] = {'dlc': dlc, 'rangement': rang}

SUP = {}
for k, s, n, n2, e, m, q, d, fee, desc, no, orig in re.findall(r"""\n  (\w+):\s*\{s:'([^']*)',n:(?:'([^']*)'|"([^"]*)"), e:'([^']*)', m:([\d.]+), qual:([\d.]+), delay:(\d+), fee:(\d+),\s+d:'([^']*)', no:\[([^\]]*)\], orig:'(\w+)'\}""", txt):
    SUP[k] = {'type': s, 'nom': n or n2, 'emoji': e, 'coef': float(m), 'qualite': float(q), 'delai': int(d), 'frais': int(fee),
              'exclus': [x.strip("' ") for x in no.split(',') if x.strip()], 'origine': {'LR': 0, 'FR': 1, 'UE': 2, 'HUE': 3}[orig]}
assert len(SUP) == 4, SUP
SUP['bio']['exclus'] += ['poissonl', 'fdm', 'morue', 'alcloc', 'spirit']
ids = {'marche': 'marche', 'gros': 'grossiste', 'disc': 'discount', 'bio': 'bio'}
fournisseurs = {ids[k]: v for k, v in SUP.items()}
noms = {lieu: {ids[k]: (L.get('sup') or {}).get(ids[k]) for k in SUP if (L.get('sup') or {}).get(ids[k])} for lieu, L in V10L.items()}

stocks = {
    '_source': "Durées de conservation, fournisseurs (prix, délais, frais de livraison, origine) et menu du jour repris de l'ancien jeu "
               "(bistrot.html : SHELF, V98ING, V10ING, SUP, V10L.sup, MDJ_P0, MDJ_CAP). Rangement et capacités : choix simples de Bistrot (REGLES §4c).",
    'rangements': {'froid': {'nom': 'Chambre froide', 'emoji': '🥶', 'capacite': 1000},
                   'congel': {'nom': 'Congélateur', 'emoji': '🧊', 'capacite': 200},
                   'sec': {'nom': 'Étagères', 'emoji': '🗄️', 'capacite': 2000}},
    'ingredients': ingredients,
    'fournisseurs': fournisseurs,
    'nomsFournisseurs': noms,
    'fournisseurHabituel': 'grossiste',
    'qualiteDlc': {'_explication': 'Produits frais (DLC ≤ 7 j) : +1 jour chez un fournisseur de qualité ≥ 4, −1 jour si qualité ≤ 2,6 (ancien jeu).', 'haute': 4, 'basse': 2.6},
    'auto': {'parDefaut': {'facile': True, 'normal': False, 'difficile': False}, 'margeDefaut': 15, 'margePas': 5, 'margeMax': 50,
             'joursCouverture': [[3, 1], [16, 2], [9999, 4]], 'clientsParAffluence': 70,
             '_explication': "Le soir, la commande automatique rachète ce qu'il faut pour 1 jour (DLC ≤ 3 j), 2 jours (DLC ≤ 16 j) ou 4 jours, + la marge de sécurité, moins le stock encore bon demain et ce qui est déjà en route. Si la place manque, toutes les lignes du même rangement sont réduites dans la même proportion."},
    'premieresCourses': {'jours': 2},
    'offres': {'min': 2, 'max': 3, 'remises': [0.15, 0.2, 0.25, 0.3, 0.4]},
    'menuDuJour': {'portionsSurPlace': 30, 'portionsEmporter': 8, 'minPortions': 8, 'prix': {'ep': 17, 'pd': 17, 'epd': 22},
                   'poidsFormules': {'ep': 0.34, 'pd': 0.36, 'epd': 0.30}, 'probaClient': 0.32, 'emporterHeures': [[690, 810], [1110, 1230]]},
    'boissons': {'probaApero': 0.15, 'probaVin': 0.35, 'probaFraiche': 0.55, 'probaChaude': 0.35, 'probaBouteille': 0.10,
                 'tempsParBoisson': 0.15, 'limites': {'min': 3, 'max': 20}},
}
(RACINE / 'donnees/stocks.json').write_text(json.dumps(stocks, ensure_ascii=False, indent=1) + '\n')

# ---------- 3) Plats de saison, menu du jour, boissons ----------
def cuisson(nom, rec, ancien):
    n = nom.lower()
    if ancien == 'rouge': return 'boeuf'
    if ancien == 'rouge3': return 'agneau' if 'agneau' in rec else 'canard'
    if 'agneau' in rec and re.search(r'rôti|grill', n) and 'boulette' not in n: return 'agneau'
    if 'veau' in rec and re.search(r'côte', n): return 'veau'
    if ancien == 'porc' and re.search(r'côte|brochette', n): return 'porc'
    if ancien == 'volaille' and re.search(r'rôti|grill|brochette|boucané', n): return 'volaille'
    return None
ALG = {}
for l in lignes[340:390]:
    pass
SIROP = lambda rec: {('epicerie' if k == 'sirop' else k): v for k, v in rec.items()}
def plat(pid, e, nom, cat, ref, rec, al, veg, cu, extra=None):
    rec = SIROP(rec)
    for i in rec: assert i in ING, (nom, i)
    d = {'id': pid, 'nom': nom, 'emoji': e, 'cat': cat, 'prixRef': ref, 'popularite': 1.05, 'recette': rec, 'allergenes': al,
         'vegetarien': bool(veg) if veg is not None else not any(ING[i].get('viande') or ING[i].get('mer') for i in rec), 'cuisson': cuisson(nom, rec, cu)}
    if extra: d.update(extra)
    return d
saisonniers, mdj = {}, {}
for lieu, L in V10L.items():
    saisonniers[lieu] = [plat('l10_%s_s%d' % (lieu, j), a[0], a[1], a[2], a[3], a[5], a[6], a[7], a[8], {'saison': a[10]}) for j, a in enumerate(L['sai'])]
    mdj[lieu] = [plat('m_l10_%s_%d' % (lieu, j), a[0], a[1], a[2], a[3], a[5], a[6], a[7], a[8]) for j, a in enumerate(L['mdj'])]
pool = []
for m in re.finditer(r"\n  \['(\w+)','(\w+)','([^']*)','((?:[^'\\]|\\')*)',([\d.]+),([\d.]+),([\d.]+),\{([^}]*)\},\[([^\]]*)\]\]", re.search(r"const MD_POOL = \[(.*?)\n\];", txt, re.S).group(0)):
    pid, cat, e, nom, ref, prep, q, rec, al = m.groups()
    rec = {a: int(b) for a, b in re.findall(r"(\w+):(\d+)", rec)}
    pool.append(plat('m_' + pid, e, nom.replace("\\'", "'"), cat, float(ref), rec, [x.strip("' ") for x in al.split(',') if x.strip()], None, None))
assert len(pool) > 20, len(pool)

def type_boisson(nom, rec, alc):
    n = nom.lower()
    if 'bouteille' in n and 'vin' in rec: return 'bouteille'
    if re.search(r'café|thé|infusion|chocolat|cappuccino|vin chaud|lait de poule|saké chaud', n) and 'glacé' not in n: return 'chaud'
    if re.search(r'kir|spritz|apéritif|rhum|saké|ouzo|cachaça|pisco|vodka|punch|tequila|mezcal|soju|whisky|liqueur|gin', n) or 'alcloc' in rec or 'spirit' in rec: return 'apero'
    if 'vin' in rec or re.search(r'verre de|vin', n): return 'vin'
    return 'froid'
boissons = []
for m in re.finditer(r"\n  (\w+):\s*\{n:'((?:[^'\\]|\\')*)',\s*e:'([^']*)',\s*cat:'boisson',\s*ref:([\d.]+),.*?pop:([\d.]+),\s*rec:\{([^}]*)\}(.*?)\},?(?=\n)", txt[:txt.index('const MDJ_IDS')]):
    pid, nom, e, ref, pop, rec, reste = m.groups()
    rec = {a: int(b) for a, b in re.findall(r"(\w+):(\d+)", rec)}
    nom = re.sub(r'\s+', ' ', nom.replace("\\'", "'"))
    boissons.append({'id': pid, 'nom': nom, 'emoji': e, 'cat': 'boisson', 'prixRef': float(ref), 'popularite': float(pop), 'recette': SIROP(rec),
                     'allergenes': ['sulfites'] if 'vin' in rec else (['gluten'] if 'biere' in rec else (['lait'] if 'creme' in rec or 'lait' in rec else [])),
                     'type': type_boisson(nom, rec, 0), 'alcool': any(k in rec for k in ('vin', 'biere', 'spirit', 'alcloc'))})
for m in re.finditer(r"\n  (vinchaud|laitpoule|citronnade|theglace):\{n:'([^']*)',e:'([^']*)',cat:'boisson',ref:([\d.]+),prep:0,bar:[\d.]+,q:[\d.]+,pop:([\d.]+),rec:\{([^}]*)\}[^\n]*season:\[([\d,]+)\]", txt):
    pid, nom, e, ref, pop, rec, sai = m.groups()
    rec = SIROP({a: int(b) for a, b in re.findall(r"(\w+):(\d+)", rec)})
    boissons.append({'id': pid, 'nom': nom, 'emoji': e, 'cat': 'boisson', 'prixRef': float(ref), 'popularite': float(pop), 'recette': rec,
                     'allergenes': ['sulfites'] if 'vin' in rec else (['lait', 'oeufs'] if pid == 'laitpoule' else []), 'type': type_boisson(nom, rec, 0),
                     'alcool': 'vin' in rec, 'saison': [int(x) for x in sai.split(',')]})
assert len(boissons) == 18, [b['id'] for b in boissons]
locales = {}
for lieu, L in V10L.items():
    out = []
    for it in L['it']:
        if isinstance(it, list) and it[3] == 'boisson':
            pid, e, nom, cat, ref, prep, rec, al, veg, cu, side, alc = it
            out.append({'id': pid, 'nom': nom, 'emoji': e, 'cat': 'boisson', 'prixRef': ref, 'popularite': 0.8, 'recette': rec, 'allergenes': al,
                        'type': type_boisson(nom, rec, alc), 'alcool': bool(alc), 'local': True})
    b = L.get('bout')
    if b:
        out.append({'id': 'l10_%s_bv' % lieu, 'nom': b[0], 'emoji': '🍾', 'cat': 'boisson', 'prixRef': 24.0, 'popularite': 0.3, 'recette': {'vin': 4},
                    'allergenes': ['sulfites'], 'type': 'bouteille', 'alcool': True, 'local': True})
        out.append({'id': 'l10_%s_bb' % lieu, 'nom': 'Bouteille ' + b[3][0].lower() + b[3][1:] if not b[3].lower().startswith('bouteille') else b[3], 'emoji': '🍺', 'cat': 'boisson', 'prixRef': 5.5, 'popularite': 0.5,
                    'recette': {'biere': 2}, 'allergenes': ['gluten'], 'type': 'froid', 'alcool': True, 'local': True})
    locales[lieu] = out
CAT['saisonniers'] = saisonniers
CAT['menuDuJour'] = {'lieux': mdj, 'bistrot': pool, '_explication': "Pool du menu du jour : les 6 plats du jour du lieu (ancien jeu V10L.mdj) + en France les plats du jour du bistrot (MD_POOL)."}
CAT['boissons'] = boissons
CAT['boissonsLocales'] = locales
CAT['_etape3'] = "Plats de saison (V10L.sai), menu du jour (V10L.mdj, MD_POOL) et boissons (DISH boissons, boissons de saison, V10L.it boissons, V10L.bout) ajoutés par outils/extraction/extraire-stocks.py."
(RACINE / 'donnees/catalogue.json').write_text(json.dumps(CAT, ensure_ascii=False, indent=1) + '\n')
nr = sum(1 for p in produits.values() if p['source'] == 'rnm')
print(f"prix : {nr} ingrédients cotés à Rungis, {len(produits) - nr} estimés ; {len(boissons)} boissons + {sum(len(v) for v in locales.values())} locales ; "
      f"{sum(len(v) for v in saisonniers.values())} plats de saison ; menu du jour : {sum(len(v) for v in mdj.values())} plats locaux + {len(pool)} du bistrot")
for k in sorted(produits, key=lambda k: produits[k]['source']):
    p = produits[k]; print(f"  {k:10} {p['source']:10} {ING[k]['prix']:5.2f} → {p['prix']:5.2f} ({p.get('prixReleve', '')}) {ingredients[k]}")
