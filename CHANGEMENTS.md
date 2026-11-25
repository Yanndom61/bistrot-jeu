# Changements

## v0.7 — étape 5 : l'argent (lien TEST)
- **3 niveaux** au lancement : **Facile** (par défaut, propriétaire, 600 000 €), **Normal** (locataire, 40 000 €) et **Difficile** (15 000 €, un prêt à rembourser, des concurrents).
- **Loyer** selon le lieu (Normal et Difficile) et **charges** courantes (électricité, gaz, eau, assurances, entretien, banque).
- **Salaires vraiment payés** chaque soir (grille HCR × lieu), intérimaires compris ; cotisations et TVA en Normal et Difficile.
- **Indemnités de renvoi** : rien en période d'essai (30 jours), puis 3 jours de salaire, plus la loi après 8 mois. Le montant est affiché avant de confirmer.
- **Faillite** claire et pas brutale : alerte chaque soir où la caisse est sous zéro, faillite seulement après 7 soirs de suite, écran qui explique pourquoi ; la partie et une copie de secours restent sur le téléphone.
- **Bilan du soir** avec le bénéfice du jour, la caisse et l'argent ligne par ligne ; **bilan de la semaine** tous les 7 jours.
- Nouveau **volet Argent** : touche la caisse en haut à gauche (Aujourd'hui, Semaines, Loyer et charges).
- Fiche d'un employé : jour d'embauche, fin de la période d'essai, coût par jour.
- Sauvegarde format 7 : les parties 0.6 continuent en Facile, même en plein service.

## v0.6 — étape 4 : l'équipe (lien TEST)
- **Les 16 postes sont tous recrutables** : en plus, **barmans**, **plongeurs**, **agents de nettoyage** et **apprenti**, avec leurs candidats dès le départ.
- Volet Équipe en **5 onglets** à gros textes et grosses touches : **Équipe** (qui travaille aujourd'hui, fiche de chacun, renvoi), **Embauche** (candidats, intérim, places), **Planning**, **Formations**, **Cagnotte**.
- **Plannings** : chacun a **2 jours de repos qui se suivent**, choisis automatiquement et décalables avec ◀ ▶ ; tableau des présents par jour, alerte quand la salle ou la cuisine serait vide. L'intérim remplace aussi les absents.
- **Formations** : Rapidité, Accueil et service, Soin et qualité (+1 point), et **Sommellerie** (plus de vin vendu). Payée tout de suite, absent un jour, formé le lendemain ; annulable.
- **Cagnotte des pourboires** partagée à parts égales entre les employés le dernier soir du mois (ni patron, ni intérimaires) ; historique et part de chacun.
- **Effet des qualités** : le sens du service fait monter les pourboires, le chef (ou le second) améliore les cuissons des autres, le responsable accélère la salle, le barman prépare les boissons, sans plongeur la cuisine ralentit, l'apprenti fait 1 commande à la fois.
- Nouvelle **propreté de la salle** : les agents de nettoyage la gardent propre ; une salle sale fait baisser les pourboires puis fuir des clients.
- Barmans et plongeurs dessinés dans la salle. Bilan du soir : formations payées, propreté, absents, partage de la cagnotte.
- Renvoi toujours possible pour tout le monde (formation pas commencée remboursée). Pas de paiement des salaires ni d'indemnités (étape 5).
- Sauvegarde format 6 : les parties 0.5.1 continuent (même en plein service) ; barmans, plongeurs et agents repris de l'ancien jeu prennent enfin leur poste.

## v0.5.1 — modifier le menu du jour (demande de Yann, lien TEST)
- Carte → Menu du jour : un gros bouton **« Changer »** pour l'entrée, le plat et le dessert. On choisit dans une liste de gros boutons : en vert ce qui est faisable (avec le nombre de menus possibles), en orange ce qui est juste, en gris ce qui manque d'ingrédients (avec la liste).
- Message rouge clair si on touche un plat impossible, ou si un ingrédient vient à manquer pendant la journée.
- « Pas d'entrée » / « Pas de dessert » possibles ; le plat est obligatoire.
- Bouton **« Revenir au menu proposé »**, et « Revenir aux prix conseillés » quand un prix de formule a été changé.
- Le nombre de menus vérifie maintenant que l'entrée, le plat et le dessert sont tous faisables.
- Le choix tient dans la sauvegarde ; les parties de la v0.5 se relisent sans changement.

## v0.5 — étape 3 : stocks, fournisseurs, menu du jour, boissons et plats de saison (lien TEST)
- Nouveau bouton **Stocks** : la réserve (chambre froide, congélateur, étagères) avec les dates limites, les commandes en route et les ruptures du jour ; onglet **Commander** (4 fournisseurs, offres du jour, « Proposer les quantités », total et heure d'arrivée) ; onglet **Réglages** (commande automatique, marge de sécurité, fournisseur habituel, source des prix).
- **L'argent baisse à l'achat** des produits. Prix de gros datés et sourcés (Rungis, RNM FranceAgriMer, novembre 2026), qui changent avec la saison.
- **Dates limites et gaspillage** : les produits périmés sont jetés le matin. **Ruptures** : le plat disparaît de la carte avec la raison, et revient à la livraison.
- **Commande automatique** chaque soir (activée par défaut en Facile seulement).
- Carte : onglets **Plats / Boissons / Menu du jour**. 18 boissons + 5 du lieu, servies par la salle (pas de barman). **Menu du jour** composé chaque matin d'après les stocks et les offres, avec un peu de vente à emporter. **Plats de saison** qui changent avec les mois.
- Ticket : lignes du menu du jour et boissons. Bilan du soir : achats, recettes − achats, gaspillage, menus du jour, boissons, ruptures et leurs causes.
- Anciennes parties de Chez YaYa : **les stocks sont repris**. Sauvegardes de Bistrot 0.4 converties (format 5).
- Correction : un volet rouvert très vite après sa fermeture pouvait rester caché.

## v0.4 — étape 2 : la carte, les prix et le paiement (lien TEST)
- Nouveau bouton **Carte** : 20 classiques du bistrot + les spécialités de chaque lieu (616 sur 44 lieux), reprises de l'ancien jeu → REGLES §4b.
- Prix réglables (− / + 50 c), prix conseillé, coût matière estimé et marge ; fiche de chaque plat avec allergènes (14), origine de la viande, fait maison, cuissons.
- Les clients choisissent selon le prix et leurs goûts, demandent une cuisson ; une cuisson ratée (selon la qualité du cuisinier) est renvoyée et refaite.
- Les tables paient à la fin : **l'argent monte avec les recettes**. Ticket de chaque table, pourboires selon le pays (zéro à Tokyo) dans la cagnotte de l'équipe, bilan du jour enrichi.
- Sauvegarde format 4 : les parties 0.3 continuent ; la carte des parties de l'ancien jeu est reprise.

## v0.3 — effectif de 16, intérim, renvoi (lien TEST)
- Effectif de Chez YaYa : 16 employés (salle 8, cuisine 6, nettoyage 2), patron en plus ; « Poste complet » quand une place est prise → REGLES §4.
- Nouveaux postes à recruter : responsable de salle, second et aide de cuisine.
- Intérim pour la journée sur une place vide (+30 %), et intérim automatique en option (activé en Facile) → REGLES §4.
- Bouton « Renvoyer » avec confirmation ; impossible de vider la salle ou la cuisine en service ; la personne finit sa tâche puis part ; pas d'indemnité pour l'instant → REGLES §4.
- Salaires payés avec l'étape « Argent » (décision de Yann) → PRIORITES. Sauvegarde format 3 : les parties 0.2 continuent.

## v0.2 — retours de Yann sur l'étape 1 (lien TEST)
- Placement des clients : automatique par défaut, ou par toi (bouton « Placement : auto/moi ») → REGLES §3.
- Départ seul avec le patron, recrutement avant d'ouvrir : 8 candidats, entretiens à 4 questions, personnalités, offre de salaire → REGLES §4.
- Salaires sur la grille officielle HCR (avenant n° 36, vérifiée) × coefficient du lieu → REGLES §4.
- Cuisine : chaque cuisinier prépare 2 commandes à la fois, vitesse selon la personne → REGLES §4.
- Léa (serveuse automatique) supprimée. Pas de bouton pour sauter les heures creuses (décision de Yann) → PRIORITES.
- Sauvegarde format 2 : les parties v0.1 sont converties ; l'équipe de l'ancien jeu est reprise → REGLES §8.

## v0.1 — étape 1 : la salle en direct (lien TEST)
- Salle dessinée en largeur, lisible sans zoom sur S22 et S23 FE → REGLES §2 et §9.
- Clients par groupes : arrivée, file à la porte, carte, commande, repas, addition, départ → REGLES §3.
- Deux serveurs automatiques → REGLES §4.
- Pause, 1×, 2×, 4× ; pause automatique dans les volets et en portrait → REGLES §1.
- Messages dans une zone réservée + Journal → REGLES §7.
- Sauvegarde automatique versionnée, cases TEST/OFFICIEL séparées, reprise des parties de l'ancien jeu → REGLES §8.
- Les 44 lieux de l'ancien jeu (affluence et noms des clients) → REGLES §5. Appli installable, marche hors connexion.
