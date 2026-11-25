"""Extrait la carte de l'ancien jeu « Chez YaYa » (bistrot.html v10.2) vers donnees/carte.json.
Lecture seule de /workspace/bistrot/bistrot.html. À relancer seulement si l'ancien jeu change :
  python3 outils/extraction/extraire-carte.py
"""
import json, re, pathlib
SRC = pathlib.Path('/workspace/bistrot/bistrot.html')
RACINE = pathlib.Path(__file__).resolve().parents[2]
lignes = SRC.read_text(encoding='utf-8').split('\n')

def json_const(nom):
    for l in lignes:
        if l.startswith('const ' + nom + '='):
            return json.loads(l[l.index('=') + 1:].rstrip().rstrip(';'))
    raise SystemExit('introuvable : ' + nom)

def js_objet(debut, fin_marqueur='};'):
    """Lit un petit objet JS (une entrée par ligne, clés simples) et le convertit en dict via des regex."""
    i = next(k for k, l in enumerate(lignes) if l.startswith(debut))
    bloc = []
    for l in lignes[i + 1:]:
        if l.startswith(fin_marqueur): break
        bloc.append(l)
    return bloc

V10ING = json_const('V10ING')
V10L = json_const('V10L')

# --- ingrédients (prix par portion, en euros, valeurs provisoires de l'ancien jeu) ---
ing = {}
for l in js_objet('const ING = {'):
    m = re.match(r"\s*(\w+):\s*\{n:'([^']*)',\s*e:'[^']*',\s*p:([\d.]+)", l)
    if m: ing[m.group(1)] = {'nom': m.group(2).replace("\\'", "'"), 'prix': float(m.group(3))}
txt = '\n'.join(lignes)
for k in ('huile', 'beurre', 'salverte', 'legsais', 'glace', 'fruitf', 'lait'):
    m = re.search(r"\b" + k + r":\{n:'([^']*)',e:'[^']*',p:([\d.]+)", txt)
    if m: ing[k] = {'nom': m.group(1), 'prix': float(m.group(2))}
for k, v in V10ING.items():
    ing[k] = {'nom': v[0], 'prix': v[2]}
for k in ('jambon', 'boeuf', 'paleron', 'volaille', 'poisson', 'veau', 'porc', 'agneau', 'canard', 'saucisse', 'fdm', 'poissonl', 'morue'):
    if k in ing: ing[k]['viande'] = k not in ('poisson', 'poissonl', 'morue', 'fdm')
for k in ('poisson', 'poissonl', 'morue', 'fdm'):
    if k in ing: ing[k]['mer'] = True

# --- plats classiques du bistrot (catalogue de base, hors boissons et plats de saison) ---
ALG = {}
m = re.search(r"const AL_TAGS = \{(.*?)\};", txt, re.S)
for k, v in re.findall(r"(\w+):\[([^\]]*)\]", m.group(1)):
    ALG[k] = [x.strip("' ") for x in v.split(',') if x.strip()]
classiques = []
CLASSIQUES = ['soupe', 'oeufmay', 'salade', 'quiche', 'steak', 'bourg', 'croque', 'poulet', 'blanq', 'sole', 'ratat', 'omel',
              'gratin', 'tartare', 'creme', 'mousse', 'tatin', 'fondant', 'clafou', 'riz']
for l in lignes[284:340]:
    m = re.match(r"\s*(\w+):\s*\{n:(['\"])(.*?)\2,\s*e:'([^']*)',\s*cat:'(\w+)',\s*ref:([\d.]+),.*?pop:([\d.]+),\s*rec:\{([^}]*)\}", l)
    if not m or m.group(1) not in CLASSIQUES: continue
    rec = {a: int(b) for a, b in re.findall(r"(\w+):(\d+)", m.group(8))}
    classiques.append({'id': m.group(1), 'nom': m.group(3).replace("\\'", "'"), 'emoji': m.group(4), 'cat': m.group(5),
                       'prixRef': float(m.group(6)), 'popularite': float(m.group(7)), 'recette': rec, 'allergenes': ALG.get(m.group(1), [])})
assert len(classiques) == len(CLASSIQUES), [c['id'] for c in classiques]

# --- cuissons : règle simple (voir REGLES.md) ---
def cuisson(nom, rec, ancien):
    n = nom.lower()
    if ancien == 'rouge': return 'boeuf'
    if ancien == 'rouge3': return 'agneau' if 'agneau' in rec else 'canard'
    if 'agneau' in rec and re.search(r'rôti|grill', n) and 'boulette' not in n: return 'agneau'
    if 'veau' in rec and re.search(r'côte', n): return 'veau'
    if ancien == 'porc' and re.search(r'côte|brochette', n): return 'porc'
    if ancien == 'volaille' and re.search(r'rôti|grill|brochette|boucané', n): return 'volaille'
    return None
CUISSON_CLASSIQUES = {'steak': 'boeuf', 'poulet': 'volaille'}
for c in classiques:
    c['cuisson'] = CUISSON_CLASSIQUES.get(c['id'])
    c['vegetarien'] = not any(ing.get(i, {}).get('viande') or ing.get(i, {}).get('mer') for i in c['recette'])

# --- spécialités par lieu ---
specialites, carteDepart, zones, origines, pourboires = {}, {}, {}, {}, {}
for lieu, L in V10L.items():
    liste = []
    for it in L['it']:
        if isinstance(it, dict):
            if it['cat'] != 'boisson': liste.append({'classique': it['id']})
            continue
        pid, e, nom, cat, ref, prep, rec, al, veg, cu, side, alc = it
        if cat == 'boisson': continue
        liste.append({'id': pid, 'nom': nom, 'emoji': e, 'cat': cat, 'prixRef': ref, 'popularite': 1.05, 'recette': rec,
                      'allergenes': al, 'vegetarien': bool(veg), 'cuisson': cuisson(nom, rec, cu)})
    specialites[lieu] = liste
    carteDepart[lieu] = L['cl']
    zones[lieu] = L.get('z')
    origines[lieu] = [o[0] for o in L['orig']] if L.get('orig') else ['France · Label Rouge', 'France', 'Union européenne', 'Hors UE']
    pourboires[lieu] = L.get('tip')

sortie = {
    '_source': "Plats, spécialités par lieu, allergènes, recettes et prix de référence repris de l'ancien jeu Chez YaYa v10.2 "
               "(bistrot.html : DISH, AL_TAGS, ING, V10L, V10ING, V98ING). Extraction : outils/extraction/extraire-carte.py.",
    '_prix': "Prix des ingrédients = valeurs provisoires de l'ancien jeu (euros par portion), multipliées par le coefficient « prix » du lieu. "
             "Ils seront remplacés à l'étape 3 (stocks) par les prix de gros réels (RNM / Rungis).",
    'allergenes': [
        {'id': 'gluten', 'nom': 'Gluten'}, {'id': 'crustaces', 'nom': 'Crustacés'}, {'id': 'oeufs', 'nom': 'Œufs'},
        {'id': 'poissons', 'nom': 'Poissons'}, {'id': 'arachides', 'nom': 'Arachides'}, {'id': 'soja', 'nom': 'Soja'},
        {'id': 'lait', 'nom': 'Lait'}, {'id': 'coque', 'nom': 'Fruits à coque'}, {'id': 'celeri', 'nom': 'Céleri'},
        {'id': 'moutarde', 'nom': 'Moutarde'}, {'id': 'sesame', 'nom': 'Sésame'}, {'id': 'sulfites', 'nom': 'Sulfites'},
        {'id': 'lupin', 'nom': 'Lupin'}, {'id': 'mollusques', 'nom': 'Mollusques'}],
    'ingredients': ing,
    'classiques': classiques,
    'specialites': specialites,
    'carteDepartClassiques': carteDepart,
    'zones': zones,
    'originesViande': origines,
    'pourboires': pourboires,
}
(RACINE / 'donnees' / 'catalogue.json').write_text(json.dumps(sortie, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
n = sum(len(v) for v in specialites.values())
manq = sorted({i for v in specialites.values() for d in v if 'recette' in d for i in d['recette'] if i not in ing} |
              {i for c in classiques for i in c['recette'] if i not in ing})
print(f"{len(classiques)} classiques, {n} lignes de spécialités sur {len(specialites)} lieux, {len(ing)} ingrédients. Ingrédients manquants : {manq}")
print('cuissons :', sorted({(d['nom'], d['cuisson']) for v in specialites.values() for d in v if d.get('cuisson')}, key=lambda x: x[1]))
