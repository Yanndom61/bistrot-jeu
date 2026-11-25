# Priorités de Bistrot

On ne travaille que sur la colonne **Indispensable**, dans l'ordre. Toute nouvelle idée de Yann est rangée ici avec lui.

| Indispensable | Sympa | Un jour |
|---|---|---|
| ✅ 1. Salle lisible en paysage, clients qui arrivent et mangent, Pause/1×/2×/4×, écran portrait *(v0.1)* | Ambiance sonore (salle, cuisine, terrasse, pluie), sons libres de droits | Écran « caisse » et « tickets cuisine » |
| ✅ 1b. Retours de Yann : placement des clients par le joueur (option), départ seul avec recrutement *(v0.2)* ; effectif de 16, intérim, renvoi *(v0.3, en test)* | Images libres de droits (Kenney), style unique | Étoile au guide |
| ✅ 2. Carte des plats, prix et paiement des clients *(v0.4)* | Contrôle d'hygiène surprise (type Alim'confiance) | |
| ✅ 3. Stocks, fournisseurs et vrais prix de gros (Rungis), **avec menu du jour, boissons et plats de saison** (décision de Yann) *(v0.5, en test)* | Fiches techniques des plats (grammages, coût matière) | Mise à jour des prix Rungis (nouveau relevé) |
| 4. Équipe complète : plannings, repos, contrats, formations, recrutement des barmans, plongeurs, nettoyage et apprentis, **les 16 postes tous recrutables** (décision de Yann), intérim pour les absences, effets du sens du service et de la qualité | Écran « Crédits et sources » | |
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
- **Version finale : les 16 postes seront tous recrutables** (salle, cuisine, bar, plonge, nettoyage, apprentis). À faire à l'étape 4 « Équipe ». En test, on recrute pour l'instant serveurs, commis de salle, responsable de salle, chef, second, commis et aide de cuisine.
- **Menu du jour, boissons (carte et bar) et plats de saison** : arrivent avec l'étape 3 « Stocks » *(fait en v0.5)*. Le barman reste non recrutable jusqu'à l'étape « Équipe ».
- **Commande automatique** : une option, activée par défaut en Facile seulement *(fait en v0.5)*.
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
  - Menu du jour automatique (écouler, offres, saison), formules 17 / 17 / 22 € × lieu, 30 portions + 8 à emporter. Tu peux le couper ou changer ses prix, mais pas encore choisir ses plats toi-même : le veux-tu ?
  - Boissons servies par la salle avec les plats (pas de barman), 9 secondes de service par boisson ; 3 à 20 boissons à la carte.
  - Plats de saison seulement à leurs mois, ajoutés et retirés tout seuls au changement de mois, choisis 25 % plus souvent.
  - Calendrier : le jour 1 est la date de création de la partie.
  - Anciennes parties : commandes en route livrées tout de suite ; réserve qui peut déborder après la reprise.
