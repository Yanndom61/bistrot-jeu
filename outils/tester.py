"""tester.py — vérifie le jeu dans un vrai navigateur, aux tailles des téléphones de Yann, et prend des captures.
Utilisation : python3 outils/tester.py   (le jeu doit avoir été assemblé avant : node outils/assembler.mjs test)"""
import asyncio, json, os, sys, threading, functools, http.server, socketserver, tempfile, pathlib
from playwright.async_api import async_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
CAPTURES = RACINE / 'captures'
CAPTURES.mkdir(exist_ok=True)
PORT = int(os.environ.get("PORT", "8743"))
URL = f'http://localhost:{PORT}/bistrot-jeu/test/'
TAILLES = [('s22', 780, 360), ('s23fe', 832, 384), ('barres', 780, 300)]
ANCIENNE = (RACINE / 'tests/anciennes-sauvegardes/save_v10_service_generated.json').read_text()
problemes = []

def serveur():
    racine = tempfile.mkdtemp()
    os.symlink(RACINE / 'docs', os.path.join(racine, 'bistrot-jeu'))
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=racine)
    http.server.SimpleHTTPRequestHandler.log_message = lambda *a: None
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

MESURES_JS = r"""() => {
  const vw = innerWidth, vh = innerHeight, out = {};
  const z = document.getElementById('salle-zone').getBoundingClientRect();
  out.partSalle = (z.width * z.height) / (vw * vh);
  const svg = document.getElementById('salle');
  const m = svg.getScreenCTM(); out.echelle = m.a;
  const fond = svg.querySelector('#fond rect:nth-child(1)').getBoundingClientRect();
  out.partSalleDessinee = (fond.width * fond.height) / (vw * vh);
  out.texteSvgMin = Math.min(...[...svg.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize) * m.a));
  const pb = [];
  const dessus = ['accueil', 'fin', 'volet'].map(id => document.getElementById(id)).find(el => el && !el.hidden);
  (dessus || document).querySelectorAll('button').forEach(b => {
    if (!b.offsetParent) return;
    const r = b.getBoundingClientRect();
    const defile = b.closest('#volet-corps, #accueil, .carte-fin');
    if (r.left < -0.5 || r.right > vw + 0.5 || (!defile && (r.top < -0.5 || r.bottom > vh + 0.5))) pb.push('bouton hors écran : ' + b.textContent);
    if (r.height < 43.5 || r.width < 43.5) pb.push('bouton trop petit (' + Math.round(r.width) + '×' + Math.round(r.height) + ') : ' + b.textContent);
    if (r.bottom > vh || r.top < 0) return;
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (e && e !== b && !b.contains(e)) pb.push('bouton recouvert : ' + b.textContent);
  });
  document.querySelectorAll('#app *, #accueil *, #volet *, #fin *').forEach(el => {
    if (!el.offsetParent || el.closest('svg')) return;
    const txt = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (txt && parseFloat(getComputedStyle(el).fontSize) < 11.9) pb.push('texte < 12 px : ' + el.textContent.slice(0, 30));
  });
  ['detail', 'b-nom', 'b-heure'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetParent && el.scrollHeight > el.clientHeight + 2) pb.push('texte coupé dans #' + id);
  });
  const l2 = document.querySelector('#barre .l2');
  if (l2.scrollWidth > l2.clientWidth + 1) pb.push('heure/argent coupés dans la barre');
  out.problemes = pb;
  return out;
}"""

async def nouveau_contexte(b, w, h, init=None):
    c = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True, locale='fr-FR')
    if init: await c.add_init_script(init)
    p = await c.new_page()
    p.erreurs = []
    p.on('pageerror', lambda e: p.erreurs.append('erreur : ' + str(e)))
    p.on('console', lambda m: p.erreurs.append('console : ' + m.text) if m.type in ('error', 'warning') else None)
    await p.goto(URL, wait_until='load')
    await p.wait_for_timeout(500)
    return c, p

async def lancer_partie(p, captures=None):
    """Nouvelle partie, puis recrutement par l'écran Équipe : un serveur (entretien complet) et un commis de cuisine."""
    await p.get_by_role('button', name='Nouvelle partie').click()
    await p.get_by_role('button', name='Ouvrir le restaurant').click()
    await p.wait_for_timeout(500)
    if captures: await p.screenshot(path=str(CAPTURES / f'10-recrutement-{captures}.png'))
    ouvert = await p.evaluate('() => B.UI.S.ouvert')
    if ouvert: problemes.append('le restaurant ne devrait pas être ouvert avant le recrutement')
    for poste, complet in (('serv', True), ('commis', False)):
        cid = await p.evaluate(f"() => B.UI.S.candidats.find(c => c.poste === '{poste}').id")
        await p.locator(f'[data-eq="entretien"][data-id="{cid}"]').click(); await p.wait_for_timeout(200)
        questions = ['Quel salaire souhaitez-vous ?'] if not complet else ['Parlez-moi de votre parcours.', 'Que faites-vous en plein coup de feu ?', 'Racontez-moi un client difficile.', 'Quel salaire souhaitez-vous ?']
        for q in questions:
            await p.get_by_role('button', name=q).click(); await p.wait_for_timeout(120)
        if complet and captures:
            await p.screenshot(path=str(CAPTURES / f'11-entretien-{captures}.png'))
            verifier('entretien', await p.evaluate(MESURES_JS), p)
        await p.locator('[data-eq="proposer"]').click(); await p.wait_for_timeout(200)
        if complet and captures: await p.screenshot(path=str(CAPTURES / f'12-embauche-{captures}.png'))
        await p.get_by_role('button', name='Retour à l’équipe').click(); await p.wait_for_timeout(200)
    if captures:
        await p.screenshot(path=str(CAPTURES / f'13-equipe-prete-{captures}.png'))
        verifier('écran équipe', await p.evaluate(MESURES_JS), p)
    n = await p.evaluate('() => B.UI.S.equipe.length')
    if n != 3: problemes.append(f'recrutement : équipe de {n} au lieu de 3')
    await p.locator('[data-eq="ouvrir"]').click()
    await p.wait_for_timeout(300)
    if not await p.evaluate('() => B.UI.S.ouvert'): problemes.append("le restaurant n'ouvre pas après le recrutement")

async def au_coeur_du_service(p, minutes=95):
    await p.evaluate(f"() => {{ B.avancer(B.UI.S, {minutes}); }}")
    await p.wait_for_timeout(700)

async def choisir_table(p):
    tid = await p.evaluate("() => { const g = B.UI.S.groupes.find(g => ['mange','commande','cuisine','pret'].includes(g.etat) && g.tables.length); return g ? g.tables[0] : 2; }")
    await p.locator(f'[data-table="{tid}"]').click()
    await p.wait_for_timeout(400)

def verifier(nom, m, p):
    print(f"  {nom}: salle {m['partSalle']*100:.0f} % de l'écran (dessin {m['partSalleDessinee']*100:.0f} %), plus petit texte de la salle {m['texteSvgMin']:.1f} px")
    if m['partSalle'] < 0.6: problemes.append(f'{nom} : salle < 60 %')
    if m['texteSvgMin'] < 11.9: problemes.append(f'{nom} : texte de la salle trop petit')
    for x in m['problemes']: problemes.append(f'{nom} : {x}')
    for x in p.erreurs: problemes.append(f'{nom} : {x}')

async def main():
    srv = serveur()
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        print('1) Salle pendant le service, aux trois tailles :')
        for nom, w, h in TAILLES:
            c, p = await nouveau_contexte(b, w, h)
            if nom == 's22': await p.screenshot(path=str(CAPTURES / '00-accueil-780x360.png'))
            await lancer_partie(p, f'{w}x{h}' if nom in ('s22', 'barres') else None)
            await au_coeur_du_service(p)
            await p.screenshot(path=str(CAPTURES / f'01-salle-{nom}-{w}x{h}.png'))
            await choisir_table(p)
            await p.screenshot(path=str(CAPTURES / f'02-table-choisie-{nom}-{w}x{h}.png'))
            verifier(f'{w}×{h}', await p.evaluate(MESURES_JS), p)
            if nom == 'barres':
                # Pause automatique quand un volet est ouvert
                await p.get_by_role('button', name='1×').click()
                await p.get_by_role('button', name='Journal').click()
                await p.wait_for_timeout(400)
                m0 = await p.evaluate('() => B.UI.S.minute')
                await p.wait_for_timeout(1500)
                m1 = await p.evaluate('() => B.UI.S.minute')
                await p.screenshot(path=str(CAPTURES / f'03-journal-pause-{w}x{h}.png'))
                verifier('journal ouvert', await p.evaluate(MESURES_JS), p)
                if m1 != m0: problemes.append('le temps avance pendant que le Journal est ouvert')
                await p.get_by_role('button', name='Fermer').click()
                await p.wait_for_timeout(1500)
                m2 = await p.evaluate('() => B.UI.S.minute')
                print(f'  pause auto : {m0:.2f} → {m1:.2f} volet ouvert, puis {m2:.2f} après fermeture')
                if m2 <= m1: problemes.append('le temps ne repart pas à la fermeture du Journal')
                # Vitesses : 4× va 4 fois plus vite que 1×
                await p.get_by_role('button', name='4×').click()
                a = await p.evaluate('() => B.UI.S.minute'); await p.wait_for_timeout(2000); z = await p.evaluate('() => B.UI.S.minute')
                print(f'  vitesse 4× : {z - a:.1f} min de jeu en 2 s')
                if not 6 < z - a < 9: problemes.append('la vitesse 4× ne donne pas ~8 min en 2 s')
                await p.get_by_role('button', name='Pause').click()
                a = await p.evaluate('() => B.UI.S.minute'); await p.wait_for_timeout(1000); z = await p.evaluate('() => B.UI.S.minute')
                if z != a: problemes.append('Pause ne fige pas le temps')
            if nom == 's22':
                await p.get_by_role('button', name='Menu').click(); await p.wait_for_timeout(400)
                await p.screenshot(path=str(CAPTURES / f'04-menu-{w}x{h}.png'))
                verifier('menu ouvert', await p.evaluate(MESURES_JS), p)
                await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(300)
                await p.evaluate('() => B.avancer(B.UI.S, 900)')
                await p.wait_for_timeout(600)
                await p.screenshot(path=str(CAPTURES / f'05-fin-de-journee-{w}x{h}.png'))
                verifier('fin de journée', await p.evaluate(MESURES_JS), p)
                ok = await p.evaluate("() => !document.getElementById('fin').hidden")
                if not ok: problemes.append("l'écran de fin de journée ne s'affiche pas")
                await p.get_by_role('button', name='Commencer le jour 2').click(); await p.wait_for_timeout(300)
                cles = await p.evaluate('() => Object.keys(localStorage)')
                print('  cases utilisées sur le téléphone :', cles)
                if any(not k.startswith('bistrotjeu.test.') for k in cles): problemes.append('une case hors « bistrotjeu.test. » a été écrite')
                # Rechargement : la partie revient
                await p.reload(); await p.wait_for_timeout(600)
                txt = await p.locator('#accueil').inner_text()
                if 'jour 2' not in txt: problemes.append('la partie ne revient pas après rechargement')
            await c.close()

        print('1b) Placement des clients par le joueur :')
        c, p = await nouveau_contexte(b, 780, 360)
        await lancer_partie(p)
        await p.locator('#btn-placement').click(); await p.wait_for_timeout(200)
        for i in range(40):
            nb = await p.evaluate("() => B.UI.S.groupes.filter(g => g.etat === 'file').length")
            if nb >= 2: break
            await p.evaluate('() => B.avancer(B.UI.S, 3)')
        assis = await p.evaluate("() => B.UI.S.groupes.filter(g => g.tables).length")
        if assis: problemes.append('placement manuel : des clients se sont assis tout seuls')
        await p.wait_for_timeout(300)
        g = await p.evaluate("() => { const g = B.UI.S.groupes.find(g => g.etat === 'file'); return g && {id: g.id, taille: g.taille}; }")
        if not g: problemes.append('placement manuel : aucun groupe à la porte')
        else:
            await p.locator(f'[data-groupe="{g["id"]}"]').click(); await p.wait_for_timeout(300)
            await p.screenshot(path=str(CAPTURES / '14-placement-groupe-choisi-780x360.png'))
            verifier('placement manuel', await p.evaluate(MESURES_JS), p)
            petite = 1 if g['taille'] > 2 else None
            if petite:
                await p.locator('[data-table="1"]').click(); await p.wait_for_timeout(300)
                await p.screenshot(path=str(CAPTURES / '15-placement-table-trop-petite-780x360.png'))
            cible = await p.evaluate(f"() => {{ const t = B.UI.S.tables.find(t => !t.groupe && !t.sale && t.places >= {g['taille']}); return t ? t.id : 2; }}")
            await p.locator(f'[data-table="{cible}"]').click(); await p.wait_for_timeout(300)
            ok = await p.evaluate(f"() => {{ const x = B.UI.S.groupes.find(x => x.id === {g['id']}); return !!(x && x.tables); }}")
            print(f"  groupe de {g['taille']} placé à la table {cible} :", ok)
            if not ok: problemes.append('placement manuel : le groupe ne s’est pas assis')
            await p.get_by_role('button', name='1×').click()
            await p.wait_for_timeout(2500)
            await p.screenshot(path=str(CAPTURES / '16-placement-groupe-installe-780x360.png'))
        problemes.extend('placement : ' + e for e in p.erreurs)
        await c.close()

        print('1c) Renvoyer un employé :')
        c, p = await nouveau_contexte(b, 780, 360)
        await lancer_partie(p)
        await au_coeur_du_service(p, 60)
        await p.get_by_role('button', name='Équipe').click(); await p.wait_for_timeout(400)
        commis = await p.evaluate("() => B.UI.S.equipe.find(x => x.poste === 'commis').id")
        await p.locator(f'[data-eq="renvoyer"][data-id="{commis}"]').click(); await p.wait_for_timeout(250)
        refus = await p.locator('.refus').count()
        txt = await p.locator('.refus').first.inner_text() if refus else ''
        print('  seul cuisinier, refus affiché :', txt)
        if 'cuisine serait vide' not in txt: problemes.append("renvoi : pas de message quand la cuisine serait vide")
        await p.screenshot(path=str(CAPTURES / '18-renvoi-impossible-780x360.png'))
        if await p.locator('[data-eq="renvoyer"]').count() != 2: problemes.append('renvoi : il devrait y avoir 2 boutons « Renvoyer » (pas pour le patron)')
        serv = await p.evaluate("() => B.UI.S.equipe.find(x => x.poste === 'serv').id")
        await p.locator(f'[data-eq="renvoyer"][data-id="{serv}"]').click(); await p.wait_for_timeout(300)
        await p.screenshot(path=str(CAPTURES / '17-renvoi-confirmation-780x360.png'))
        verifier('confirmation de renvoi', await p.evaluate(MESURES_JS), p)
        conf = await p.locator('#volet-corps').inner_text()
        if 'vraiment renvoyer' not in conf: problemes.append('renvoi : pas de confirmation')
        await p.locator('[data-eq="renvoi-non"]').click(); await p.wait_for_timeout(200)
        if await p.evaluate(f"() => B.UI.S.equipe.find(x => x.id === {serv}).partant"): problemes.append('renvoi : « Non » a quand même renvoyé')
        await p.locator(f'[data-eq="renvoyer"][data-id="{serv}"]').click(); await p.wait_for_timeout(200)
        await p.locator('[data-eq="renvoi-oui"]').click(); await p.wait_for_timeout(300)
        await p.screenshot(path=str(CAPTURES / '19-renvoi-fait-780x360.png'))
        await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(200)
        await p.evaluate('() => B.avancer(B.UI.S, 15)'); await p.wait_for_timeout(300)
        reste = await p.evaluate(f"() => B.UI.S.equipe.some(x => x.id === {serv})")
        print('  serveur renvoyé encore là 15 min après :', reste)
        if reste: problemes.append('renvoi : le serveur renvoyé ne part pas')
        # Intérim : appeler un serveur pour la journée sur la place vide
        await p.get_by_role('button', name='Équipe').click(); await p.wait_for_timeout(300)
        await p.locator('[data-eq="interim"][data-sv="salle"]').click(); await p.wait_for_timeout(300)
        nb = await p.evaluate("() => B.UI.S.equipe.filter(x => x.interim).length")
        print('  intérimaires appelés :', nb)
        if nb != 1: problemes.append("intérim : le serveur intérimaire n'est pas arrivé")
        await p.locator('.effectif').scroll_into_view_if_needed()
        await p.screenshot(path=str(CAPTURES / '20-interim-780x360.png'))
        await p.locator('[data-eq="interim"][data-sv="salle"]').scroll_into_view_if_needed()
        await p.screenshot(path=str(CAPTURES / '21-interim-boutons-780x360.png'))
        verifier('intérim', await p.evaluate(MESURES_JS), p)
        problemes.extend('renvoi : ' + e for e in p.erreurs)
        await c.close()

        print('1d) Carte, fiche d’un plat, ticket et paiement :')
        c, p = await nouveau_contexte(b, 780, 360)
        await lancer_partie(p)
        argent0 = await p.evaluate('() => B.UI.S.argent')
        await p.get_by_role('button', name='Carte').click(); await p.wait_for_timeout(400)
        await p.screenshot(path=str(CAPTURES / '22-carte-780x360.png'))
        verifier('carte', await p.evaluate(MESURES_JS), p)
        pid = await p.evaluate("() => B.carte.surCarte(B.UI.S, 'plat')[0]")
        prix0 = await p.evaluate(f"() => B.UI.S.carte.plats['{pid}'].prix")
        await p.locator(f'[data-ca="plus"][data-id="{pid}"]').click(); await p.wait_for_timeout(150)
        await p.locator(f'[data-ca="plus"][data-id="{pid}"]').click(); await p.wait_for_timeout(150)
        prix1 = await p.evaluate(f"() => B.UI.S.carte.plats['{pid}'].prix")
        print(f'  prix du plat : {prix0} → {prix1} après 2 × « + »')
        if abs(prix1 - prix0 - 1) > 0.001: problemes.append('carte : le bouton + ne monte pas le prix de 50 centimes')
        await p.locator(f'[data-ca="moins"][data-id="{pid}"]').click(); await p.locator(f'[data-ca="moins"][data-id="{pid}"]').click(); await p.wait_for_timeout(150)
        # retirer des desserts jusqu'au refus
        for i in range(8):
            d = await p.evaluate("() => B.carte.surCarte(B.UI.S, 'dessert')[0]")
            await p.locator(f'[data-ca="basculer"][data-id="{d}"]').first.click(); await p.wait_for_timeout(120)
            if await p.locator('.refus').count(): break
        txt = await p.locator('.refus').first.inner_text() if await p.locator('.refus').count() else ''
        print('  refus du minimum :', txt)
        if 'au moins 2 desserts' not in txt: problemes.append('carte : pas de message au minimum de desserts')
        # fiche d'un plat avec cuisson
        viande = await p.evaluate("() => (B.carte.catalogue(B.UI.S).find(d => d.cuisson && d.cat === 'plat') || {}).id")
        await p.locator(f'[data-ca="fiche"][data-id="{viande}"]').click(); await p.wait_for_timeout(300)
        await p.screenshot(path=str(CAPTURES / '23-fiche-plat-780x360.png'))
        verifier('fiche plat', await p.evaluate(MESURES_JS), p)
        fiche = await p.locator('#volet-corps').inner_text()
        for mot in ('Allergènes', 'Origine de la viande', 'Cuisson', 'Fait maison', 'Marge brute'):
            if mot not in fiche: problemes.append(f'fiche plat : « {mot} » absent')
        await p.locator('#volet-corps').evaluate('e => e.scrollTop = e.scrollHeight'); await p.wait_for_timeout(150)
        await p.screenshot(path=str(CAPTURES / '23b-fiche-plat-bas-780x360.png'))
        await p.get_by_role('button', name='Retour à la carte').click(); await p.wait_for_timeout(200)
        await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(200)
        # service : une table qui mange, son ticket ; puis paiement
        await au_coeur_du_service(p, 80)
        gid = await p.evaluate("() => { const g = B.UI.S.groupes.find(g => g.commande && g.tables && ['mange','pret','cuisine'].includes(g.etat)); return g ? g.id : null; }")
        if not gid: problemes.append('ticket : aucune table avec une commande')
        else:
            t = await p.evaluate(f"() => B.UI.S.groupes.find(g => g.id === {gid}).tables[0]")
            await p.locator(f'[data-table="{t}"]').click(); await p.wait_for_timeout(300)
            await p.screenshot(path=str(CAPTURES / '24a-table-addition-780x360.png'))
            await p.locator(f'[data-ticket="{gid}"]').click(); await p.wait_for_timeout(300)
            await p.screenshot(path=str(CAPTURES / '24-ticket-780x360.png'))
            verifier('ticket', await p.evaluate(MESURES_JS), p)
            tk = await p.locator('#volet-corps').inner_text()
            if 'Total' not in tk: problemes.append('ticket : pas de total')
            await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(200)
        await p.evaluate('() => B.avancer(B.UI.S, 30)'); await p.wait_for_timeout(300)
        paye = await p.evaluate("() => B.UI.S.tickets.find(t => t.pourboire > 0) || B.UI.S.tickets[0]")
        argent1 = await p.evaluate('() => B.UI.S.argent')
        rec = await p.evaluate('() => B.UI.S.stats.jour.recettes')
        ach = await p.evaluate('() => B.UI.S.stats.jour.achats')
        print(f'  argent : {argent0:.2f} → {argent1:.2f} (recettes {rec:.2f}, achats {ach:.2f}), tickets payés : {len(await p.evaluate("() => B.UI.S.tickets"))}')
        if abs(argent1 - argent0 - rec + ach) > 0.01 or rec <= 0: problemes.append("paiement : l'argent ne bouge pas avec les recettes")
        await p.get_by_role('button', name='Journal').click(); await p.wait_for_timeout(300)
        await p.screenshot(path=str(CAPTURES / '25-journal-paiements-780x360.png'))
        jtxt = await p.locator('#volet-corps').inner_text()
        if 'a payé' not in jtxt: problemes.append('journal : pas de message de paiement')
        await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(200)
        await p.evaluate('() => B.avancer(B.UI.S, 900)'); await p.wait_for_timeout(600)
        await p.screenshot(path=str(CAPTURES / '26-bilan-recettes-780x360.png'))
        verifier('bilan du jour', await p.evaluate(MESURES_JS), p)
        problemes.extend('carte : ' + e for e in p.erreurs)
        await c.close()
        c, p = await nouveau_contexte(b, 780, 300)
        await lancer_partie(p)
        await p.get_by_role('button', name='Carte').click(); await p.wait_for_timeout(300)
        await p.screenshot(path=str(CAPTURES / '22b-carte-780x300.png'))
        verifier('carte 780×300', await p.evaluate(MESURES_JS), p)
        await p.get_by_role('button', name='Fermer').click(); await p.evaluate('() => B.avancer(B.UI.S, 900)'); await p.wait_for_timeout(500)
        await p.screenshot(path=str(CAPTURES / '26b-bilan-780x300.png'))
        verifier('bilan 780×300', await p.evaluate(MESURES_JS), p)
        problemes.extend('carte 300 : ' + e for e in p.erreurs)
        await c.close()

        print('1e) Stocks, commande, boissons et menu du jour :')
        c, p = await nouveau_contexte(b, 780, 360)
        await lancer_partie(p)
        await au_coeur_du_service(p, 60)
        await p.get_by_role('button', name='Stocks').click(); await p.wait_for_timeout(400)
        await p.screenshot(path=str(CAPTURES / '27-stocks-reserve-780x360.png'))
        verifier('stocks réserve', await p.evaluate(MESURES_JS), p)
        txt = await p.locator('#volet-corps').inner_text()
        for mot in ('Chambre froide', 'Congélateur', 'Étagères'):
            if mot not in txt: problemes.append(f'stocks : « {mot} » absent')
        await p.locator('[data-st-onglet="commander"]').click(); await p.wait_for_timeout(250)
        await p.locator('[data-st-four="marche"]').click(); await p.wait_for_timeout(250)
        await p.locator('[data-st="plus"][data-id="boeuf"]').click(); await p.locator('[data-st="plus"][data-id="boeuf"]').click()
        await p.locator('[data-st="plus"][data-id="legumes"]').click(); await p.wait_for_timeout(250)
        await p.locator('#volet-corps').evaluate('e => e.scrollTop = 0'); await p.wait_for_timeout(150)
        await p.screenshot(path=str(CAPTURES / '28-stocks-commande-780x360.png'))
        verifier('stocks commande', await p.evaluate(MESURES_JS), p)
        a0 = await p.evaluate('() => B.UI.S.argent')
        await p.locator('[data-st="commander"]').click(); await p.wait_for_timeout(300)
        a1 = await p.evaluate('() => B.UI.S.argent')
        cmd = await p.evaluate('() => B.UI.S.stocks.commandes.filter(c => !c.auto).map(c => ({four: c.four, cout: c.cout, lignes: c.lignes}))')
        print(f'  commande au marché : {cmd} ; argent {a0:.2f} → {a1:.2f}')
        if not cmd or abs(a0 - a1 - cmd[-1]['cout']) > 0.01: problemes.append("stocks : l'argent ne baisse pas du prix de la commande")
        await p.screenshot(path=str(CAPTURES / '28b-commande-payee-780x360.png'))
        await p.locator('[data-st-onglet="reglages"]').click(); await p.wait_for_timeout(250)
        await p.screenshot(path=str(CAPTURES / '31-stocks-reglages-780x360.png'))
        verifier('stocks réglages', await p.evaluate(MESURES_JS), p)
        if 'Rungis' not in await p.locator('#volet-corps').inner_text(): problemes.append('stocks : la source des prix n’est pas affichée')
        await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(200)
        await p.get_by_role('button', name='Carte').click(); await p.wait_for_timeout(300)
        await p.locator('[data-ca-onglet="boissons"]').click(); await p.wait_for_timeout(250)
        await p.screenshot(path=str(CAPTURES / '29-carte-boissons-780x360.png'))
        verifier('carte boissons', await p.evaluate(MESURES_JS), p)
        if 'Vins au verre' not in await p.locator('#volet-corps').inner_text(): problemes.append('carte : pas de boissons')
        await p.locator('[data-ca-onglet="mdj"]').click(); await p.wait_for_timeout(250)
        await p.screenshot(path=str(CAPTURES / '30-menu-du-jour-780x360.png'))
        verifier('menu du jour', await p.evaluate(MESURES_JS), p)
        mdj = await p.locator('#volet-corps').inner_text()
        if 'Entrée + plat' not in mdj and 'entrée + plat' not in mdj: problemes.append('menu du jour : pas de formule affichée')
        await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(200)
        # un ticket avec menu du jour ou boisson
        gid = await p.evaluate("() => { const g = B.UI.S.groupes.find(g => g.commande && g.tables && g.commande.some(l => l.mdj) && g.commande.some(l => l.cat === 'boisson')) || B.UI.S.groupes.find(g => g.commande && g.tables && g.commande.some(l => l.cat === 'boisson')); return g ? g.id : null; }")
        if gid:
            await p.evaluate(f'() => B.UI.ouvrirTicket({gid})'); await p.wait_for_timeout(300)
            await p.screenshot(path=str(CAPTURES / '32-ticket-menu-boissons-780x360.png'))
            await p.get_by_role('button', name='Fermer').click(); await p.wait_for_timeout(200)
        else: problemes.append('aucune table avec une boisson')
        await p.evaluate('() => B.avancer(B.UI.S, 900)'); await p.wait_for_timeout(600)
        await p.screenshot(path=str(CAPTURES / '33-bilan-achats-780x360.png'))
        verifier('bilan avec achats', await p.evaluate(MESURES_JS), p)
        if 'Achats' not in await p.locator('#fin').inner_text(): problemes.append('bilan : achats absents')
        problemes.extend('stocks : ' + e for e in p.erreurs)
        await c.close()

        print('2) Téléphone tenu en portrait :')
        c, p = await nouveau_contexte(b, 360, 780)
        await p.screenshot(path=str(CAPTURES / '06-portrait-360x780.png'))
        vis = await p.evaluate("() => getComputedStyle(document.getElementById('portrait')).display !== 'none' && !!B.UI.pauses.portrait")
        print('  écran « tourne ton téléphone » + pause :', vis)
        if not vis: problemes.append("l'écran portrait ne s'affiche pas ou ne met pas en pause")
        problemes.extend('portrait : ' + e for e in p.erreurs)
        await c.close()

        print("3) Reprise d'une partie de l'ancien jeu :")
        seed = ("if(!sessionStorage.getItem('graine')){sessionStorage.setItem('graine','1');"
                f"localStorage.setItem('bistrot_slot1',{json.dumps(ANCIENNE)});localStorage.setItem('bistrot_save_v1',{json.dumps(ANCIENNE)});localStorage.setItem('bistrot_active_slot','1');}}")
        c, p = await nouveau_contexte(b, 780, 360, seed)
        avant = await p.evaluate("() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('bistrot_')).map(k => [k, localStorage.getItem(k)])))")
        await p.get_by_role('button', name="Reprendre une partie de l’ancien jeu").click(); await p.wait_for_timeout(300)
        await p.screenshot(path=str(CAPTURES / '07-ancien-jeu-liste-780x360.png'))
        verifier('liste anciennes parties', await p.evaluate(MESURES_JS), p)
        await p.get_by_role('button', name='Reprendre').first.click(); await p.wait_for_timeout(500)
        await au_coeur_du_service(p, 70)
        await p.screenshot(path=str(CAPTURES / '08-ancienne-partie-reprise-780x360.png'))
        apres = await p.evaluate("() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('bistrot_')).map(k => [k, localStorage.getItem(k)])))")
        info = await p.evaluate("() => ({nom: B.UI.S.nom, jour: B.UI.S.jour, argent: B.UI.S.argent, lieu: B.UI.S.lieu, equipe: B.UI.S.equipe.length, ouvert: B.UI.S.ouvert})")
        if info['equipe'] < 10 or not info['ouvert']: problemes.append("l'équipe de l'ancien jeu n'a pas été reprise")
        intact = json.loads(avant) == json.loads(apres) and len(json.loads(avant)) == 3
        print('  partie reprise :', info, '| ancien jeu intact :', intact)
        if not intact:
            A, Z = json.loads(avant), json.loads(apres)
            print('  différences :', [(k, len(A.get(k) or ''), len(Z.get(k) or '')) for k in set(A) | set(Z) if A.get(k) != Z.get(k)])
            problemes.append("l'ancienne sauvegarde a été modifiée !")
        if info['jour'] != 9: problemes.append('jour repris incorrect')
        st = await p.evaluate("() => B.UI.S.origine.stocks")
        print('  stocks repris :', st)
        if not st or not st.get('produits'): problemes.append("les stocks de l'ancien jeu ne sont pas repris")
        problemes.extend('import : ' + e for e in p.erreurs)
        await c.close()

        print('3b) Sauvegarde de Bistrot 0.1 (format 1) :')
        v1 = (RACINE / 'tests/sauvegardes-bistrot/v1-bistrot-0.1-en-service.json').read_text()
        c, p = await nouveau_contexte(b, 780, 360, "if(!sessionStorage.getItem('g')){sessionStorage.setItem('g','1');localStorage.setItem('bistrotjeu.test.partie'," + json.dumps(v1) + ");}")
        txt = await p.locator('#accueil').inner_text()
        await p.get_by_role('button', name='Continuer : Chez YaYa · Bretagne · jour 1').click(); await p.wait_for_timeout(400)
        etat = await p.evaluate("() => ({v: B.UI.S.version, equipe: B.UI.S.equipe.map(x => x.nom), volet: B.UI.voletOuvert})")
        print('  partie 0.1 relue :', etat)
        if etat['v'] != 5 or etat['equipe'] != ['Patron'] or etat['volet'] != 'equipe': problemes.append('la sauvegarde 0.1 est mal relue')
        problemes.extend('sauvegarde 0.1 : ' + e for e in p.erreurs)
        await c.close()

        print('4) Hors connexion :')
        c, p = await nouveau_contexte(b, 780, 360)
        await p.evaluate('() => navigator.serviceWorker.ready.then(() => true)')
        await p.reload(); await p.wait_for_timeout(800)
        await c.set_offline(True)
        await p.reload(); await p.wait_for_timeout(800)
        ok = await p.evaluate("() => !!document.getElementById('barre') && typeof B === 'object'")
        print('  le jeu se recharge sans réseau :', ok)
        if not ok: problemes.append('le jeu ne marche pas hors connexion')
        await c.close()
        await b.close()
    srv.shutdown()
    print()
    if problemes:
        print(f'{len(problemes)} problème(s) :'); [print('  ✗', x) for x in problemes]; sys.exit(1)
    print('Tout est bon : aucune erreur, rien de caché, salle ≥ 60 %, textes ≥ 12 px.')

asyncio.run(main())
