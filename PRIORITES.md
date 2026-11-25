# Priorités de Bistrot

On ne travaille que sur la colonne **Indispensable**, dans l'ordre. Toute nouvelle idée de Yann est rangée ici avec lui.

| Indispensable | Sympa | Un jour |
|---|---|---|
| ✅ 1. Salle lisible en paysage, clients qui arrivent et mangent, Pause/1×/2×/4×, écran portrait *(v0.1)* | Ambiance sonore (salle, cuisine, terrasse, pluie), sons libres de droits | Écran « caisse » et « tickets cuisine » |
| ✅ 1b. Retours de Yann : placement des clients par le joueur (option), départ seul avec recrutement *(v0.2)* ; effectif de 16, intérim, renvoi *(v0.3, en test)* | Images libres de droits (Kenney), style unique | Étoile au guide |
| ✅ 2. Carte des plats, prix et paiement des clients *(v0.4)* | Contrôle d'hygiène surprise (type Alim'confiance) | |
| ✅ 3. Stocks, fournisseurs et vrais prix de gros (Rungis), **avec menu du jour, boissons et plats de saison** (décision de Yann) *(v0.5 ; menu du jour modifiable en v0.5.1, validé par Yann)* | Fiches techniques des plats (grammages, coût matière) | Mise à jour des prix Rungis (nouveau relevé) |
| ✅ 4. Équipe : **les 16 postes tous recrutables** (décision de Yann), plannings avec 2 jours de repos qui se suivent, formations (dont sommellerie), cagnotte des pourboires partagée chaque mois, intérim pour les absences, effets des qualités, propreté *(v0.6, validé par Yann)* | Écran « Crédits et sources » | |
| ✅ 5. Argent : loyer et charges selon les lieux, salaires payés (grille HCR) et intérim, indemnités de renvoi, niveaux Facile / Normal / Difficile, faillite claire (sauvegarde gardée), bilans du jour et de la semaine *(v0.7, validé par Yann : TVA et Difficile gardés tels quels)* | | |
| ✅ 6. Lieux (effets complets), météo et calendrier : climat et saison touristique de chaque lieu, météo qui change l'affluence et les commandes, jours de la semaine, saisons, fériés et vacances selon le lieu, menus de fête, événements du jour et événements privés de l'ancien jeu *(v0.8)* ; les 13 événements du jour ont un vrai effet *(v0.8.1, demande de Yann, en test)* | ✅ Événements des autres étapes : inspection, critique, panne, grève, influenceuse… *(fait en v0.8.1)* | |
| ✅ 7. Tutoriel pas à pas pour une nouvelle partie (passer, revoir), écran d'aide de chaque volet, objectifs progressifs *(v0.9, en test)* | | |
| ✅ 8. Avis des clients, réputation qui change le nombre de clients, étoile Michelin, sons (coupés au départ) *(v1.0-test, en test)* | Ambiance sonore continue (musique, bruit de salle) | Niveau 20 du patron et agrandissement gratuit après l'étoile Michelin (ancien jeu) |

## Décisions de Yann
- **Placement des clients** : automatique par défaut, avec une option pour les placer soi-même *(fait en v0.2)*.
- **Heures creuses** : pas de bouton pour les sauter. Le « Passer à demain » du cahier des charges n'est pas ajouté, sauf si Yann change d'avis.
- **Équipe** : même déroulement que Chez YaYa : on démarre seul avec le patron et on recrute dès le début *(première version simple en v0.2)*.
- **Effectif** : le même que dans Chez YaYa, 16 employés (salle 8, cuisine 6, nettoyage 2), plus les intérimaires *(fait en v0.3)*.
- **Intérim** : comme dans l'ancien jeu, en version simple ; automatique seulement en option, jamais par défaut en Normal et Difficile *(fait en v0.3)*.
- **Salaires** : payés avec l'étape « Argent » *(fait en v0.7 : chaque soir, au jour le jour)*.
- **Propreté de la salle** : gardée telle quelle (v0.6 validée).
- **Les 16 postes sont tous recrutables** (salle, cuisine, bar, plonge, nettoyage, apprentis) *(fait en v0.6)*.
- **Menu du jour, boissons (carte et bar) et plats de saison** : arrivent avec l'étape 3 « Stocks » *(fait en v0.5)*. Le barman est recrutable depuis la v0.6.
- **Commande automatique** : une option, activée par défaut en Facile seulement *(fait en v0.5)*.
- **Menu du jour modifiable** : le jeu propose chaque matin, Yann peut changer chaque plat parmi ceux faisables, changer les prix et revenir à la proposition *(fait en v0.5.1)*.
- **TVA et Difficile** : gardés tels quels (v0.7 validée).
- **Renvoyer** : possible dès maintenant *(fait en v0.3)*. Pas le patron, jamais la salle ou la cuisine vide en service, et en plein service la personne finit sa tâche puis part.

## Questions en attente pour Yann
- **Choix de la v0.4 à valider** (REGLES §4b) : limites de carte 2-6 / 3-9 / 2-6, prix de 50 en 50 centimes ; cuisson ratée toujours renvoyée ; pourboires dans la cagnotte (à quoi servira-t-elle ?) ; trop cher = moins de clients, pas encore d'effet sur la note. TVA pas encore comptée.
- **Choix de la v0.5 à valider** (tous expliqués dans REGLES §4c) :
  - Prix d'achat : cotes RNM du MIN de Rungis (novembre 2026) pour 23 produits ; prix de l'ancien jeu pour les 31 autres (épicerie, pain, fromage, charcuterie, boissons). Les mêmes prix partout dans le monde × coefficient du lieu.
  - Saison : −15 % en saison, +30 % hors saison ; mois inversés dans l'hémisphère sud.
  - Réserve : chambre froide 1 000 portions, congélateur 200, étagères 2 000.
  - Les 4 fournisseurs de l'ancien jeu gardés tels quels (prix, délais, frais, qualité) ; qualité = 1 jour de conservation en plus ou en moins.
  - Commande automatique le soir : 1, 2 ou 4 jours de stock selon la conservation, + 15 % de marge ; activée en Facile seulement.
  - Premières courses (2 jours) payées à la création de la partie.
  - Rupture : le plat disparaît, le client choisit autre chose ; s'il n'y a plus rien, la table repart. Le plat revient à la livraison.
  - Menu du jour automatique (écouler, offres, saison), formules 17 / 17 / 22 € × lieu, 30 portions + 8 à emporter. Tu peux le couper, changer ses prix et, depuis la v0.5.1, ses plats.
  - Boissons servies par la salle avec les plats (pas de barman), 9 secondes de service par boisson ; 3 à 20 boissons à la carte.
  - Plats de saison seulement à leurs mois, ajoutés et retirés tout seuls au changement de mois, choisis 25 % plus souvent.
  - Calendrier : le jour 1 est la date de création de la partie.
  - Anciennes parties : commandes en route livrées tout de suite ; réserve qui peut déborder après la reprise.
- **Choix de la v0.5.1 à valider** (REGLES §4c « Modifier le menu du jour ») :
  - Seuls les plats du menu du jour du lieu sont proposés (pas ceux de la carte).
  - Vert = au moins 8 menus possibles ; orange = moins de 8 ; gris = impossible (refusé avec message).
  - Le plat est obligatoire ; entrée et dessert peuvent être retirés.
  - Changer en pleine journée est permis ; les menus déjà vendus restent vendus.
  - Le choix des plats ne vaut que pour la journée ; les prix choisis restent.
  - Le menu prévu pour demain (commande automatique) reste le menu automatique.
  - Le nombre de menus compte maintenant l'entrée, le plat et le dessert ensemble (un peu moins de menus qu'en v0.5).
- **Choix de la v0.6 à valider** (REGLES §4 « Effet des qualités », « Propreté », « Plannings », « Formations », « Cagnotte ») :
  - Jours de repos choisis automatiquement à l'embauche (là où le moins de collègues du même service sont absents, lundi-mardi en premier) ; décalables d'un jour avec ◀ ▶, effet dès le lendemain ; le patron et les intérimaires n'ont pas de repos.
  - Intérim : seulement en salle (serveur) et en cuisine (commis), pour une place vide ou un absent ; l'intérim automatique n'appelle quelqu'un que si la salle ou la cuisine serait vide.
  - Formations : Rapidité (tous), Accueil et service (salle), Soin et qualité (cuisine, nettoyage) à 60 € × (niveau + 1) pour +1 point ; Sommellerie 600 € (prix de l'ancien jeu, +45 % de vin) pour la salle et le bar ; payée à l'inscription, absent le prochain jour travaillé, formé le lendemain ; annulable et remboursée avant de commencer ; une à la fois ; la note devient la moyenne des 3 qualités sans jamais baisser.
  - Cagnotte : partagée le dernier soir de chaque mois, à parts égales entre tous les employés (absents compris), ni patron ni intérimaires (règle de l'ancien jeu) ; elle ne va jamais dans la caisse. Pas de bouton « partager maintenant ».
  - Effets : sens du service ± 0,08 étoile par point autour de 5 ; responsable de salle +5 % de vitesse et +0,15 étoile ; chef (ou second en son absence) +1 en qualité aux autres cuisiniers ; apprenti 1 commande à la fois ; barman : boissons ≈ 4 fois plus rapides pour les serveurs ; sans plongeur la cuisine va 15 % moins vite.
  - Propreté (nouvelle jauge 0-100, départ 80) : − 0,12 par client, + 8 de ménage par l'équipe, + 14 par agent de nettoyage moyen ; sous 50 jusqu'à −0,6 étoile, sous 25 jusqu'à 20 % des groupes repartent. Les agents de nettoyage ne sont pas dessinés (ils travaillent après la fermeture).
  - Bar et plonge dessinés dans la salle (comptoir du bar en haut près de la passe ; plongeurs en bas de la cuisine).
  - Candidats : 14 au départ (+ barman, plongeur, nettoyage, apprenti), 1 à 3 nouveaux par jour, 8 au plus en attente.
  - Pas de contrats (CDD/CDI/saisonniers), de motivation ni de fatigue : pas demandés pour cette étape.
- **Choix de la v0.7 à valider** (tous expliqués dans REGLES §6) :
  - Tout ce qui coûte chaque mois (salaires, loyer, charges, cotisations, prêt) est **payé chaque soir, au jour le jour** (1/30,42 du mois), pour éviter les grosses chutes d'argent.
  - Niveaux : Facile 600 000 €, propriétaire ; Normal 40 000 €, locataire ; Difficile 15 000 € + prêt de 80 000 € à 5 % sur 5 ans (pas dans la caisse : il a payé le restaurant) et concurrents qui prennent 20 % des clients.
  - Loyer ≈ 4,8 % par an de la valeur du local du lieu (Paris 6 000 €/mois, Bretagne 1 280 €, Mayotte 720 €).
  - Charges courantes par mois × prix du lieu : électricité 950, gaz 400, eau 250, assurances 300, entretien 250, banque 60 € ; payées aussi en Facile.
  - Cotisations 25 % des salaires et **TVA 10 %** en Normal et Difficile seulement (la TVA est un ajout : dis-moi si tu n'en veux pas).
  - Le patron ne se paie pas : il garde le bénéfice.
  - Indemnité : rien pendant 30 jours d'essai, puis 3 jours de salaire (Chez YaYa), plus l'indemnité de la loi après 8 mois ; la journée en cours est payée à la personne renvoyée.
  - Faillite après **7 soirs de suite** sous zéro, avec une alerte chaque soir avant ; découvert de 5 000 € pour acheter des produits ; partie et copie de secours gardées.
  - Bilan de la semaine tous les 7 jours de jeu (jours 1 à 7, 8 à 14…).
  - Volet **Argent** qu'on ouvre en touchant la caisse en haut à gauche (pas de nouveau bouton dans la barre, déjà pleine). Dans la barre, « en pause » devient « pause » pour laisser la place.
  - Les parties d'avant restent en Facile ; la période d'essai des employés repart à la mise à jour.
  - ✅ Validé par Yann : la v0.7 est gardée telle quelle (TVA et Difficile compris).
- **Choix de la v0.8 à valider** (tous expliqués dans REGLES §5 et §5b) :
  - **Météo et commandes** : l'ancien jeu ne changeait que le menu du jour avec la météo. Bistrot fait aussi changer les commandes : par temps chaud, plats frais × 1,5 et plats chauds × 0,7, boissons fraîches × 1,3 et chaudes × 0,6 ; par temps froid ou pluie, l'inverse. Quelques mots ont été ajoutés à la liste des plats « frais » et « chauds » de l'ancien jeu.
  - Météo tirée à l'avance pour chaque jour et chaque lieu : la prévision de 7 jours est toujours juste.
  - La commande automatique tient compte de l'affluence prévue le lendemain.
  - **Événements du jour** : même tirage que l'ancien jeu (42 % des matins à partir du jour 4, parmi les 13 événements) ; seuls bus, match, pluie et canicule font quelque chose ; les 9 autres ne font rien pour l'instant. La pluie battante n'arrive qu'un jour de pluie, la canicule qu'à 25° ou plus. Pas d'effet de la canicule sur les produits. Sans réponse avant la fin du service, l'événement tombe (canicule = fenêtres ouvertes).
  - **Menus de fête** : proposés 7 jours avant, Oui / Non dans le volet ; sans réponse, rien n'est ajouté ; plats au prix conseillé, en plus de la carte.
  - **Événements privés, en plus simple que l'ancien jeu** : pas de choix de gamme ni d'échange de plats (le menu est pris dans ta carte) ; prix réglé de 1 € en 1 € ; le reste est payé même s'il manque des produits ; la charge de travail de l'équipe n'est pas comptée (les invités sont servis d'office) ; avec 32 places, 19 invités au plus et pas de mariage ; fin du soir à 22:15 au lieu de 23:00 (le restaurant ferme à 22:30) ; pas de réponse possible après le bilan du soir.
  - **Vacances** : après l'été 2028 (fin des dates officielles connues), les vacances de 2027-2028 se répètent. Outre-mer et étranger : le calendrier simplifié de l'ancien jeu.
  - **Touristes** : la formule de l'ancien jeu (à Mayotte, presque aucun touriste hors vacances).
  - **Ajouts à l'écran** (pas dans la demande mot pour mot, nécessaires pour jouer) : le **bouton Calendrier** en haut du panneau de droite (sur l'écran de 300 px de haut, il se met en bas à côté de « Placement ») ; la **fenêtre d'événement** au milieu de l'écran ; la ligne **« Demain »** dans le bilan du soir ; le poste **« Événements (écran, clim…) »** dans l'argent ; les invités d'un événement privé dessinés en violet.
- **Choix de la v0.8.1 à valider** (tous expliqués dans REGLES §5b « Événements du jour ») :
  - **Réputation** : elle n'existe pas encore (étape 8). Là où l'ancien jeu changeait la réputation, Bistrot change le nombre de clients pendant quelques jours : inspection félicitée + 5 % (5 jours), sanction sévère − 5 % (5 jours) ; critique ≥ 4 ★ + 10 %, < 3 ★ − 10 % (7 jours) ; influenceuse + 25 % avec le repas offert, + 8 % sans (4 jours).
  - **Inspection** : seuils (75 / 50 / 30) et amendes (250 / 800 €) de l'ancien jeu ; nettoyage express 80 € pour + 25 de propreté. Pas d'amende « allergènes » (Bistrot n'a pas d'allergènes). Une 2e fenêtre donne le résultat.
  - **Critique** : − 0,35 sur sa note, + 0,4 avec l'apéritif (20 €), comme l'ancien jeu. S'il repart sans manger : mauvais article.
  - **Panne** : four (× 1,82 en cuisine) ou réfrigérateur (produits frais 2 fois moins longtemps), comme l'ancien jeu ; pas de lave-vaisselle (Bistrot n'a pas de matériel). Réparation 180 à 420 € ; « bricoler » = panne aujourd'hui et demain, pas de bouton « réparer plus tard ».
  - **Grève** : 2 ou 3 jours ; la commande automatique change de fournisseur (comme l'ancien jeu).
  - **Influenceuse** : plus de condition de réputation minimale (elle n'existe pas encore).
  - **Augmentation** : 8 € par jour = + 1,44 € de l'heure. Pas de moral des employés ; refus = 1 chance sur 5 de démission, départ le soir même après le service.
  - **Promo** : 30 portions à − 40 %, moins si la réserve est pleine ; comptée dans les achats.
  - **Flambée** : + 30 % sur le prix d'achat pendant 5 jours.
  - **Malade** : seulement si quelqu'un d'autre (ou l'intérim automatique) tient son service ; il est payé et revient le lendemain.
  - **Ajouts à l'écran** : la fenêtre de résultat de l'inspection ; les lignes « Panne », « grève » et « prix +30 % » dans Calendrier → Aujourd'hui ; « malade » et « démission » dans l'état du jour de l'équipe.
- **Choix de la v0.9 à valider** (tous expliqués dans REGLES §7b) :
  - **Objectifs** : l'ancien jeu n'avait **pas** de liste d'objectifs (seulement le but « rendre le bistrot rentable et éviter la faillite », et l'étoile Michelin, rangée dans « Un jour »). Les 12 objectifs sont donc un choix de Bistrot : recruter un cuisinier, ouvrir, servir 20 clients, une journée en bénéfice, recruter un serveur, tenir 7 jours, servir 300 clients, une salle propre (80+), un événement privé, une semaine en bénéfice, tenir 30 jours, servir 1 000 clients. Pas de récompense, juste un message de bravo.
  - **Guide** : 10 étapes qu'on fait défiler avec « Suivant » (on n'oblige pas à toucher le bouton montré, pour ne jamais rester bloqué). Il est repris de l'ancien jeu dans l'esprit (fenêtres « Suivant / Passer », relançable depuis le Menu), mais réécrit pour Bistrot avec le bouton montré en jaune.
  - **Où sont l'aide et les objectifs** : un gros bouton en haut du **Menu** (la barre du haut n'a plus de place pour un bouton « ? » sur les petits écrans) et la ligne d'objectif dans le panneau de droite.
  - **Aide** : en plus des 7 sujets demandés (carte, stocks, équipe, argent, calendrier, événements, propreté), un 8e sujet « La salle et le temps », pour expliquer la salle et Pause / 1× / 2× / 4×.
  - **Parties en cours** : jamais de guide ; leurs objectifs déjà acquis sont cochés sans message.
  - **Ajouts à l'écran** : la fenêtre du guide, le volet « Aide et objectifs », le gros bouton dans le Menu, la ligne « 🎯 objectif » dans le panneau de droite (à la place de la phrase « Touche une table… » quand la salle est ouverte, et sous « Restaurant fermé » avant l'ouverture).
- **Choix de la v1.0-test à valider** (tous expliqués dans REGLES §7a et §5b) :
  - **Réputation** : la formule de l'ancien jeu (de 0,5 à 5 ★, départ à 3 ★, chaque repas tire la note vers ses étoiles avec un poids de 0,015, un avis publié 0,02 de plus). Effet sur les clients : × (0,5 + 0,2 × note) / 1,1, réglé pour que **3 ★ = comme avant** (à 4 ★ : + 18 %).
  - **Bonus temporaires de la v0.8.1 branchés sur la réputation** : inspection (félicitations ↑, avertissement ↓ un peu, sanction ↓), critique (son repas pèse 12 fois un client, son article toujours publié ; + 15 % de clients pendant 5 jours à 4,5 ★ ou plus ; reparti sans manger = article à 1 ★). L'influenceuse garde son bonus de clients (il existe dans l'ancien jeu) et ajoute la hausse de réputation ; elle ne vient plus sous 2,5 ★ (condition de l'ancien jeu).
  - **Clients partis sans manger** : file d'attente, salle sale ou rupture font baisser la réputation (poids de l'ancien jeu) ; une rupture donne aussi un avis à 1 ★.
  - **Avis** : 12 % des tables écrivent, jusqu'à 32 % quand elles sont très contentes ou très déçues (ancien jeu). Phrases de l'ancien jeu **raccourcies** : une phrase selon les étoiles, parfois le nom du plat, et au plus un point fort ou faible. Prénoms inventés. On montre les 30 derniers, on en garde 80.
  - **Étoile Michelin, adaptée** : 30 jours (ancien jeu) + **8 employés fixes ou plus, tous au niveau 10 dans les formations de leur service** (l'ancien jeu demandait « tous ≥ 10/10, formations accomplies »). « Plus tard » → redemandé **le lendemain matin**. + 0,4 de réputation et réception de 1 800 € (ancien jeu). **Pas repris** : niveau 20 du patron, agrandissement gratuit, abonnés (ces choses n'existent pas encore).
  - **Sons** : les notes de l'ancien jeu (caisse, événement, bravo, ding, clic), fabriquées par le navigateur, sans fichier. **Coupés au départ, par prudence** (téléphone dans un lieu public ; les navigateurs bloquent le son avant un premier toucher) — l'ancien jeu les avait allumés. Le son « clients repartis » est plus doux que le bruit d'erreur de l'ancien jeu. Volume de 1 à 10 (5 au départ). Pas de musique (l'ancien jeu en avait une ; non demandée).
  - **Ajouts à l'écran** (nécessaires pour voir la demande) : l'onglet **« ⭐ Avis »** dans le Journal ; la ligne **« ⭐ Réputation »** dans le panneau de droite (la toucher ouvre les avis) ; la ligne « Réputation » dans Calendrier → Aujourd'hui (et l'affluence du jour en tient compte) ; le cadre **réputation et avis du jour** dans le bilan du soir ; la fenêtre **Guide Michelin** ; les lignes **Son** et **Volume** dans Menu → Réglages.
  - **Sauvegarde** : format 9. Les parties 0.9 (format 8) gardent tout ; leur note devient la réputation ; les bonus inspection / critique encore en cours deviennent un effet sur la réputation.
