# URL-Based Customization Examples

Cette fonctionnalité vous permet de charger automatiquement des customisations via les paramètres d'URL lors de la génération de Pokémons.

## Paramètres d'URL

- `customPokemonUrl` - URL vers un fichier JSON contenant des Pokémons custom
- `customAbilitiesUrl` - URL vers un fichier JSON contenant des Capacités custom
- `customMovesUrl` - URL vers un fichier JSON contenant des Attaques custom

## Exemples

### 1. Générer un Pokémon aléatoire avec custom Pokémons chargés

```
http://localhost:3000/api/pokemon/generate?level=50&customPokemonUrl=http://localhost:3000/example-custom-pokemon.json
```

### 2. Générer un Customizard spécifique

```
http://localhost:3000/api/pokemon/generate?species=Customizard&customPokemonUrl=http://localhost:3000/example-custom-pokemon.json
```

### 3. Générer un Hydrosquid spécifique

```
http://localhost:3000/api/pokemon/generate?species=Hydrosquid&customPokemonUrl=http://localhost:3000/example-custom-pokemon.json
```

### 4. Charger plusieurs customisations à la fois

```
http://localhost:3000/api/pokemon/generate?level=50&customPokemonUrl=https://example.com/pokemon.json&customAbilitiesUrl=https://example.com/abilities.json&customMovesUrl=https://example.com/moves.json
```

### 5. Générer une équipe avec custom Pokémons

```
http://localhost:3000/api/pokemon/team?level=50&size=6&customPokemonUrl=http://localhost:3000/example-custom-pokemon.json
```

### 6. Générer un Pokémon wild avec custom data

```
http://localhost:3000/api/pokemon/generateWild/25?customPokemonUrl=http://localhost:3000/example-custom-pokemon.json
```

## Notes Importantes

### URL Encoding

Si vous utilisez des URL avec des caractères spéciaux, assurez-vous de les encoder correctement:

```javascript
const customUrl = 'http://example.com/my-custom-pokemon.json';
const encodedUrl = encodeURIComponent(customUrl);
const apiUrl = `http://localhost:3000/api/pokemon/generate?customPokemonUrl=${encodedUrl}`;
```

### Chargement Automatique

Chaque appel à `/api/pokemon/generate` avec des paramètres `customPokemonUrl`, `customAbilitiesUrl`, ou `customMovesUrl` va:

1. Charger les customisations depuis les URLs fournies
2. Fusionner avec les customisations précédemment chargées
3. Générer le Pokémon avec les données combinées

### Erreurs

Les erreurs lors du chargement des URLs ne bloquent pas la génération. Si une URL échoue, une erreur est loggée mais la génération continue normalement.

## Cas d'Usage

### Pour les développeurs

```javascript
// JavaScript
const customPokemonUrl = 'https://mon-serveur.com/custom-pokemon.json';
const url = new URL('http://localhost:3000/api/pokemon/generate');
url.searchParams.append('level', '50');
url.searchParams.append('customPokemonUrl', customPokemonUrl);

fetch(url)
  .then(r => r.json())
  .then(pokemon => console.log(pokemon));
```

```python
# Python
import requests
from urllib.parse import urlencode

params = {
    'level': 50,
    'customPokemonUrl': 'https://mon-serveur.com/custom-pokemon.json'
}

response = requests.get('http://localhost:3000/api/pokemon/generate', params=params)
pokemon = response.json()
```

### Pour les utilisateurs

Utilisez simplement l'URL dans votre navigateur:

```
http://localhost:3000/api/pokemon/generate?level=50&customPokemonUrl=http://localhost:3000/example-custom-pokemon.json
```

## Avantages

✅ Pas besoin d'appels API séparés pour charger les customisations
✅ Simple à intégrer dans des URLs publiques
✅ Supporte plusieurs sources de customisations
✅ Compatible avec tous les paramètres de génération existants
✅ Erreurs de chargement ne bloquent pas la génération
