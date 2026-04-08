# FFXIV Dungeon Checker

Une application Web élégante développée avec Vue 3 et Vite, conçue pour vous permettre de suivre votre progression dans les instances de Final Fantasy XIV, classées de façon logique avec les données officielles du jeu.

## Fonctionnalités Principales

- **Boutons de Navigation Épurés :** La navigation se repose sur 4 onglets majeurs (DONJONS, DÉFIS, RAIDS 8, RAIDS 24).
- **Organisation Précise :** Les contenus sont triés par extension (A Realm Reborn, Heavensward, etc.) puis sous-catégorisés par palier de difficulté (Normaux, Brutal, Extrême, Sadique, Fatal, Chaos).
- **Suivi de Complétion :** Un simple clic sur le bouton de progression d'une instance la marque comme "Terminée". Votre progression est sauvegardée intelligemment dans votre navigateur (via `VueUse` & `localStorage`), signifiant que vous ne perdez pas vos données lors d'un redémarrage.
- **Extraction Sécurisée des Données :** Le script inclus extrait automatiquement les données du jeu traduites en français depuis les archives `xivapi/ffxiv-datamining`. Vous retrouverez donc les noms parfaits de toutes les instances, mêmes les plus farfelues !
- **Redirection The Lodestone :** Chaque carte est pourvue d'un bouton magique générant une requête de recherche The Lodestone ciblée pour afficher instantanément les loots et la page officielle d'une instance.
- **Design "Premium" en Dark Mode :** Des effets "glassmorphism", des gradients liés à la couleur officielle de chaque extension, des transitions fluides, et une police élégante !

## Installation & Lancement

1. **Installer les dépendances**
   Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé, puis dans le dossier du projet :
   ```bash
   npm install
   ```

2. **Démarrer l'application locale**
   ```bash
   npm run dev
   ```
   L'application sera disponible sur l'URL donnée dans le terminal (généralement `http://localhost:5174/`).

## Mettre à jour les Données

Le projet utilise officiellement les listes `ContentFinderCondition.csv` du jeu. Si une nouvelle instance est ajoutée sur FFXIV (nouvelle mise à jour majeure), vous pouvez simplement relancer l'extraction :

```bash
node scripts/fetch-data.js
```

Ceci téléchargera discrètement la dernière base de données à jour, les triera automatiquement par difficultés, et enregistrera le nouveau fichier de référence `duties.json` au sein du projet.

## Technologies Utilisées
- [ViteJS](https://vitejs.dev/)
- [Vue 3](https://vuejs.org/)
- [@vueuse/core](https://vueuse.org/) (Pour la persistance de l'état des options)
- [csv-parse](https://csv.js.org/) (Script de formatage de la structure originale du jeu)
