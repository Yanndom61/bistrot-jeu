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
    if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) pb.push('bouton hors écran : ' + b.textContent);
    if (r.height < 43.5 || r.width < 43.5) pb.push('bouton trop petit (' + Math.round(r.width) + '×' + Math.round(r.height) + ') : ' + b.textContent);
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

async def lancer_partie(p):
    await p.get_by_role('button', name='Nouvelle partie').click()
    await p.get_by_role('button', name='Ouvrir le restaurant').click()
    await p.wait_for_timeout(300)

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
            await lancer_partie(p)
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
        info = await p.evaluate("() => ({nom: B.UI.S.nom, jour: B.UI.S.jour, argent: B.UI.S.argent, lieu: B.UI.S.lieu})")
        intact = json.loads(avant) == json.loads(apres) and len(json.loads(avant)) == 3
        print('  partie reprise :', info, '| ancien jeu intact :', intact)
        if not intact:
            A, Z = json.loads(avant), json.loads(apres)
            print('  différences :', [(k, len(A.get(k) or ''), len(Z.get(k) or '')) for k in set(A) | set(Z) if A.get(k) != Z.get(k)])
            problemes.append("l'ancienne sauvegarde a été modifiée !")
        if info['jour'] != 9: problemes.append('jour repris incorrect')
        problemes.extend('import : ' + e for e in p.erreurs)
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
