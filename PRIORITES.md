# Priorités de Bistrot

On ne travaille que sur la colonne **Indispensable**, dans l'ordre. Toute nouvelle idée de Yann est rangée ici avec lui.

| Indispensable | Sympa | Un jour |
|---|---|---|
| ✅ 1. Salle lisible en paysage, clients qui arrivent et mangent, Pause/1×/2×/4×, écran portrait *(v0.1)* | Ambiance sonore (salle, cuisine, terrasse, pluie), sons libres de droits | Écran « caisse » et « tickets cuisine » |
| ✅ 1b. Retours de Yann : placement des clients par le joueur (option), départ seul avec recrutement *(v0.2)* ; effectif de 16, intérim, renvoi *(v0.3, en test)* | Images libres de droits (Kenney), style unique | Étoile au guide |
| ✅ 2. Carte des plats, prix et paiement des clients *(v0.4)* | Contrôle d'hygiène surprise (type Alim'confiance) | |
| ✅ 3. Stocks, fournisseurs et vrais prix de gros (Rungis), **avec menu du jour, boissons et plats de saison** (décision de Yann) *(v0.5 ; menu du jour modifiable en v0.5.1, validé par Yann)* | Fiches techniques des plats (grammages, coût matière) | Mise à jour des prix Rungis (nouveau relevé) |
| ✅ 4. Équipe : **les 16 postes tous recrutables** (décision de Yann), plannings avec 2 jours de repos qui se suivent, formations (dont sommellerie), cagnotte des pourboires partagée chaque mois, intérim pour les absences, effets des qualités, propreté *(v0.6, en test)* | Écran « Crédits et sources » | |
| 5. Argent : loyer, charges, paiement des salaires (et de l'intérim), indemnités de renvoi (à décider), 3 difficultés, bilan de fin de journée | | |
| 6. Lieux (effets complets), météo et calendrier | | |
| 7. Tutoriel progressif, mode d'emploi « ? », objectifs | | |
| 8. Avis clients, réputation | | |

## Décisions de Yann
- **Placement des clients** : automatique par défaut, avec une option pour les placer soi-même *(fait en v0.2)*.
- **Heures creuses** : pas de bouton pour les sauter. Le « Passer à demain » du cahier des charges n'est pas ajouté, sauf si Yann change d'avis.
- **Équipe** : même déroulement que Chez YaYa : on démarre seul avec le patron et on recrute dès le début *(première version simple en v0.2)*.
- **Effectif** : le même que dans Chez YaYa, 16 employés (salle 8, cuisine 6, nettoyage 2), plus les intérimaires *(fait en v0.3)*.
- **Intérim** : comme dans l'ancien jeu, en version simple ; automatique seulement en option, jamais par défaut en Normal et Difficile *(fait en v0.3)*.
- **Salaires** : payés avec l'étape « Argent », pas avant. Rien ne change d'ici là.
- **Les 16 postes sont tous recrutables** (salle, cuisine, bar, plonge, nettoyage, apprentis) *(fait en v0.6)*.
- **Menu du jour, boissons (carte et bar) et plats de saison** : arrivent avec l'étape 3 « Stocks » *(fait en v0.5)*. Le barman est recrutable depuis la v0.6.
- **Commande automatique** : une option, activée par défaut en Facile seulement *(fait en v0.5)*.
- **Menu du jour modifiable** : le jeu propose chaque matin, Yann peut changer chaque plat parmi ceux faisables, changer les prix et revenir à la proposition *(fait en v0.5.1)*.
- **Renvoyer** : possible dès maintenant *(fait en v0.3)*. Pas le patron, jamais la salle ou la cuisine vide en service, et en plein service la personne finit sa tâche puis part.

## Questions en attente pour Yann
- **Indemnités de renvoi** (pour l'étape « Argent ») : faut-il payer quelque chose quand on renvoie quelqu'un (par exemple selon son ancienneté), ou rester simple sans indemnité ?
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
