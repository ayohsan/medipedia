# Medipedia - Application de conseils en médecine douce

Medipedia est une application interactive qui permet d'explorer des conseils de médecine douce basés sur des informations extraites du **Canon de la Médecine d'Avicenne**. Grâce à un agent d'intelligence artificielle (IA), elle fournit des recommandations personnalisées sur des maladies, des plantes, des épices, des fruits et des légumes. L'application est entièrement déployée sur **GitHub Pages** pour une accessibilité rapide et fonctionne également en local.

## Fonctionnalités

- **Conseils de médecine douce** : Obtenez des recommandations pour le traitement de maladies courantes.
- **Utilisation des plantes, épices, fruits et légumes** : Découvrez comment utiliser certains éléments naturels pour améliorer votre bien-être.
- **Recherche interactive** : Entrez un mot-clé (maladie, plante, épice, fruit, légume) pour obtenir des conseils spécifiques.
- **Intégration d'une IA** : L'agent IA analyse les données et fournit des recommandations adaptées en fonction des informations disponibles dans le **Canon de la Médecine d'Avicenne**.

## Déploiement sur GitHub Pages

L'application est déployée sur **GitHub Pages** pour une utilisation immédiate en ligne. Vous pouvez accéder à la version déployée en utilisant le lien suivant :

[**Lien vers l'application GitHub Pages**](https://ayohsan.github.io/medipedia/)

## Fonctionnement Local

### Prérequis

Avant de pouvoir exécuter l'application localement, vous devez avoir les outils suivants installés :

- [Node.js](https://nodejs.org/)
- **npm** (gestionnaire de paquets Node.js)
- **Python** 
- **Git LFS**

### Installation

1. Clonez le dépôt GitHub sur votre machine locale :

   ```bash
   git clone https://github.com/ayohsan/medipedia.git
   cd medipedia
   ```

2. Installez les dépendances du projet :

   ```bash
   npm install
   ```

   Cette commande va installer toutes les dépendances nécessaires au fonctionnement du projet.

3. Si vous avez des scripts Python, assurez-vous d'avoir installé les bibliothèques nécessaires. Consultez le dossier **`python_scripts/`** pour plus de détails.

4. Télécharger les fichiers LFS :

   ```bash
   git lfs pull
   ```

### Démarrer l'application en local

1. Démarrez un serveur local pour exécuter l'application :

   ```bash
   npm start
   ```

2. Une fois le serveur démarré, vous pouvez accéder à l'application via votre navigateur à l'adresse suivante :

   ```
   http://localhost:3000
   ```

### Exécution des scripts Python

Si l'IA nécessite l'exécution de scripts Python, vous pouvez les trouver dans le dossier **`python_scripts/`**. Vous pouvez exécuter les scripts manuellement ou les intégrer à l'application via des appels API selon la configuration du projet.

### Tester les fonctionnalités

Vous pouvez tester le fonctionnement de l'application avec les tests intégrés. Les tests sont situés dans le dossier **`test/`** et peuvent être exécutés avec la commande suivante :

```bash
npm test
```

Cela lancera les tests automatisés pour vérifier que toutes les fonctionnalités de l'application fonctionnent correctement.

### Framework utilisé

Ce projet utilise **NestJS** pour la gestion du backend, et **TypeScript** pour le développement du code source. Le front-end est construit avec des technologies modernes telles que **HTML**, **CSS** et **JavaScript**, avec une attention particulière portée à l'optimisation de la performance pour le déploiement sur GitHub Pages.

### Dépendances

- **Node.js** 
- **npm** 
- **NestJS** 
- **Python**
 
 ## Note importante
Si vous rencontrez des erreurs liées au PDF, assurez-vous d'avoir :
1. Installé Git LFS (`git lfs install`)
2. Téléchargé les fichiers LFS (`git lfs pull`)

## Configuration

1. Copiez `.env.example` en `.env`
2. Ajoutez votre clé API Hugging Face dans le fichier `.env`
 
## Contribution

Les contributions à ce projet sont les bienvenues ! Si vous souhaitez contribuer, veuillez suivre ces étapes :

1. Fork ce projet.
2. Créez une nouvelle branche pour votre fonctionnalité (`git checkout -b feature/ma-nouvelle-fonctionnalité`).
3. Ajoutez les modifications(`git add`)
4. Committez vos modifications (`git commit -m "Ajoute une nouvelle fonctionnalité"`).
5. Poussez sur votre fork (`git push origin feature/ma-nouvelle-fonctionnalité`).
6. Créez une pull request.

## Licence

Ce projet est sous la licence MIT. Vous êtes libre de l'utiliser et de le modifier.

---
*Développé avec ❤️ par Trafnosleep*

