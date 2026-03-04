# PTU Pokemon Generator API

API pour générer des Pokémons selon les règles PTU 1.05 (Pokémon Team Unlimited).

## Installation

```bash
npm install
```

## Développement local

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## Endpoints

### Health Check
```
GET /health
```
Retourne le statut du serveur.

### Génération aléatoire
```
GET /api/pokemon/generate?level=50&species=pikachu&shiny=false
```
Génère un Pokémon aléatoire avec les options spécifiées.

**Paramètres de requête :**
- `level` (optionnel) : Niveau du Pokémon (1-100)
- `species` (optionnel) : Nom du Pokémon (ex: "Pikachu")
- `shiny` (optionnel) : Force un Pokémon shiny (true/false)

**Réponse :**
```json
{
  "id": 25,
  "name": "Pikachu",
  "level": 50,
  "types": ["Electric"],
  "ability": "Static",
  "shiny": false,
  "nature": "Jolly",
  "stats": {
    "hp": 95,
    "atk": 105,
    "def": 85,
    "spA": 100,
    "spD": 95,
    "spe": 130
  },
  "moves": [...],
  "ivs": {...},
  "evs": {...},
  "item": "Choice Band"
}
```

### Pokémon sauvage
```
GET /api/pokemon/generateWild/15
```
Génère un Pokémon sauvage au niveau spécifié.

### Équipe complète
```
GET /api/pokemon/team?level=50&size=6
```
Génère une équipe de 6 Pokémons.

**Paramètres de requête :**
- `level` (optionnel) : Niveau des Pokémons (défaut: 50)
- `size` (optionnel) : Nombre de Pokémons (1-6, défaut: 6)

### Liste des espèces
```
GET /api/pokemon/list
```
Retourne la liste de tous les Pokémons disponibles.

## Déploiement sur Render.com

### Prérequis
- Compte Render.com
- Repository GitHub avec ce code

### Étapes
1. Connectez-vous à [Render.com](https://render.com)
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre repository GitHub
4. Configurez :
   - **Name** : ptu-pokemon-generator
   - **Environment** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Region** : Sélectionnez une région proche de vos utilisateurs
5. Cliquez sur "Deploy"

### Variables d'environnement (si nécessaire)
Allez dans Settings → Environment → Add Environment Variable
- `PORT` : 10000 (Render utilise ce port par défaut)
- `NODE_ENV` : production

## Utilisation externe

Vous pouvez appeler l'API depuis n'importe quel client (JavaScript, Python, Postman, etc.) :

```javascript
// JavaScript/Fetch
fetch('https://votre-app.onrender.com/api/pokemon/generate?level=50')
  .then(r => r.json())
  .then(pokemon => console.log(pokemon));
```

```python
# Python/Requests
import requests
response = requests.get('https://votre-app.onrender.com/api/pokemon/team?level=50')
pokemon_team = response.json()
```

## Structure des données PTU 1.05

- **Stats** : HP, ATK, DEF, SpA, SpD, Spe (Vitesse)
- **IVs** : Individual Values (0-31 par stat)
- **EVs** : Effort Values (max 510 total, 252 par stat)
- **Nature** : Affecte les stats (25 natures disponibles)
- **Capacité** : Talent normal ou caché
- **Attaques** : Jusqu'à 4 attaques
- **Objet tenu** : Item équipé

## Règles PTU 1.05

Ce générateur suit les règles de Pokémon Team Unlimited 1.05 :
- Calcul des stats selon la formule PTU
- Distribution équilibrée des EVs
- Sélection aléatoire d'objets et de nature
- Support des Pokémon shiny

## Limitations de la version gratuite Render.com

- Spin-down après 15 minutes d'inactivité (cold start)
- Bande passante limitée
- 0.50 GB RAM

Pour une utilisation en production, envisagez un plan payant ou un autre hébergeur.

## Licence

MIT

## Support

Pour des questions ou des suggestions, ouvrez une issue sur GitHub.
