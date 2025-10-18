# Configuration API InvestMali Utilisateur

## Vue d'ensemble

Ce document décrit la configuration centralisée de l'API pour l'application React Utilisateur InvestMali. La configuration utilise des variables d'environnement pour une gestion flexible des endpoints et paramètres.

## Variables d'environnement

### Fichier .env

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
# URL de base de l'API backend Spring Boot
REACT_APP_USER_API_URL=http://localhost:8080/api/v1

# Port de l'application React User (optionnel)
PORT=3000

# Environnement de développement
NODE_ENV=development

# Timeout pour les requêtes API (en millisecondes)
REACT_APP_API_TIMEOUT=30000

# Activer les logs de debug pour les appels API
REACT_APP_DEBUG_API=true
```

### Variables disponibles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `REACT_APP_USER_API_URL` | URL de base de l'API backend | `http://localhost:8080/api/v1` |
| `REACT_APP_API_TIMEOUT` | Timeout des requêtes en ms | `30000` |
| `REACT_APP_DEBUG_API` | Active les logs de debug | `false` |

## Structure de la configuration

### Fichier de configuration : `src/config/api.config.js`

```javascript
import { API_CONFIG, API_ENDPOINTS, buildApiUrl } from '../config/api.config';

// Configuration de base
console.log(API_CONFIG.BASE_URL); // http://localhost:8080/api/v1
console.log(API_CONFIG.TIMEOUT);  // 30000

// Endpoints disponibles
console.log(API_ENDPOINTS.AUTH.LOGIN);           // /auth/login
console.log(API_ENDPOINTS.ENTREPRISES.CREATE);   // /entreprises
```

### Service API : `src/services/api.js`

Le service API utilise automatiquement la configuration centralisée :

```javascript
import { authAPI, businessAPI, enumsAPI } from '../services/api';

// Les appels utilisent automatiquement la configuration
const response = await authAPI.login({ email, password });
const apps = await businessAPI.getMyApplications();
```

## Utilisation

### 1. Appels API avec modules spécialisés

```javascript
import { authAPI, businessAPI, uploadAPI, chatAPI } from '../services/api';

// Authentification
const loginResponse = await authAPI.login({
  email: 'user@example.com',
  password: 'password'
});

// Gestion des entreprises
const myApps = await businessAPI.getMyApplications();
const app = await businessAPI.getApplication('app-id');

// Upload de documents
await uploadAPI.uploadDocument('app-id', 'STATUTS', file);

// Chat avec agents
const conversation = await chatAPI.startConversation('Besoin d\'aide', 'Support', userId);
```

### 2. Appels API directs avec apiRequest

```javascript
import { apiRequest } from '../services/api';

// GET request
const response = await apiRequest('/entreprises/my-applications');

// POST request
const result = await apiRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    motdepasse: 'password'
  })
});
```

### 3. Construction d'URLs

```javascript
import { buildApiUrl } from '../config/api.config';

const healthUrl = buildApiUrl('/health');
// Résultat: http://localhost:8080/api/v1/health

const loginUrl = buildApiUrl('/auth/login');
// Résultat: http://localhost:8080/api/v1/auth/login
```

## Endpoints disponibles

### Authentification
- `POST /auth/login` - Connexion utilisateur
- `POST /auth/register` - Inscription
- `GET /auth/profile` - Profil utilisateur
- `PUT /auth/profile` - Mise à jour profil

### Entreprises
- `POST /entreprises` - Créer entreprise
- `GET /entreprises/my-applications` - Mes demandes
- `GET /entreprises/:id` - Détail entreprise
- `PUT /entreprises/:id` - Mise à jour entreprise
- `DELETE /entreprises/:id` - Supprimer entreprise

### Business Applications
- `POST /business/applications` - Créer demande
- `POST /business/applications/multipart` - Créer avec fichiers
- `GET /business/stats` - Statistiques

### Upload & Documents
- `POST /upload/document/:id` - Upload document
- `POST /upload/documents/:id` - Upload multiple
- `GET /upload/document/:id/:type/download` - Télécharger
- `DELETE /upload/document/:id/:type` - Supprimer

### Chat Utilisateur
- `POST /chat/conversations/start-user` - Démarrer conversation
- `GET /chat/conversations/:id` - Détail conversation
- `POST /chat/conversations/:id/messages` - Envoyer message
- `PATCH /chat/conversations/:id/read` - Marquer lu
- `GET /chat/conversations/user` - Mes conversations

### Enums & Référentiels
- `GET /enums/forme-juridique` - Formes juridiques
- `GET /enums/type-entreprise` - Types d'entreprise

### Persons
- `GET /persons/:id` - Informations personne
- `POST /persons` - Créer personne
- `PUT /persons/:id` - Mettre à jour personne

### Divisions (Localisations)
- `GET /divisions/regions` - Liste régions
- `GET /divisions/regions/:id/cercles` - Cercles par région
- `GET /divisions/cercles/:id/arrondissements` - Arrondissements
- `GET /divisions/arrondissements/:id/communes` - Communes
- `GET /divisions/communes/:id/quartiers` - Quartiers

## Gestion des erreurs

### Intercepteurs automatiques

L'API inclut des intercepteurs pour :

1. **Authentification automatique** : Ajout du token Bearer
2. **Gestion des erreurs 401** : Redirection vers `/auth`
3. **Logs de debug** : Traçage des requêtes (si activé)
4. **Gestion FormData** : Headers automatiques pour uploads

```javascript
// Gestion automatique des erreurs
try {
  const response = await businessAPI.getMyApplications();
} catch (error) {
  // Erreur 401 → redirection automatique vers /auth
  // Autres erreurs → gestion manuelle
  console.error('Erreur API:', error.message);
}
```

### Debug et logs

Activez les logs avec `REACT_APP_DEBUG_API=true` :

```bash
🔧 User API Configuration Active
🔄 API Request: { method: 'GET', url: '/entreprises/my-applications', hasAuth: true }
✅ API Response: { status: 200, url: '/entreprises/my-applications', method: 'GET' }
```

## Migration depuis l'ancienne configuration

### Avant (URLs partiellement hardcodées)
```javascript
// ❌ Ancien code
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const response = await apiRequest('/api/v1/auth/login', options);
```

### Après (Configuration centralisée)
```javascript
// ✅ Nouveau code
import { authAPI } from '../services/api';
const response = await authAPI.login(credentials);

// Ou avec endpoints centralisés
import { API_ENDPOINTS } from '../config/api.config';
const response = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, options);
```

## Environnements

### Développement
```bash
REACT_APP_USER_API_URL=http://localhost:8080/api/v1
REACT_APP_DEBUG_API=true
PORT=3000
```

### Production
```bash
REACT_APP_USER_API_URL=https://api.investmali.ml/api/v1
REACT_APP_DEBUG_API=false
REACT_APP_API_TIMEOUT=60000
PORT=80
```

### Test
```bash
REACT_APP_USER_API_URL=http://localhost:3001/api/v1
REACT_APP_DEBUG_API=true
```

## Sécurité

### Tokens d'authentification

Les tokens sont gérés automatiquement :

```javascript
// Stockage automatique après login
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// Ajout automatique dans les headers
// Authorization: Bearer <token>
```

### Configuration CORS

Le backend doit autoriser l'origine de l'application utilisateur :

```yaml
# application.yml
cors:
  allowed-origins: http://localhost:3000,http://localhost:8080/api/v1
```

## Fonctionnalités spécifiques

### Upload de fichiers

```javascript
import { uploadAPI } from '../services/api';

// Upload simple
await uploadAPI.uploadDocument('app-id', 'STATUTS', file);

// Upload multiple
await uploadAPI.uploadMultipleDocuments('app-id', [
  { file: file1, type: 'STATUTS' },
  { file: file2, type: 'REGISTRE_COMMERCE' }
]);

// Téléchargement
const blob = await uploadAPI.downloadDocument('app-id', 'STATUTS');
```

### Chat en temps réel

```javascript
import { chatAPI } from '../services/api';

// Démarrer conversation
const conversation = await chatAPI.startConversation(
  'J\'ai besoin d\'aide',
  'Support technique',
  userId
);

// Envoyer message
await chatAPI.sendMessage(conversationId, 'Mon message', userId);

// Récupérer conversations
const conversations = await chatAPI.getUserConversations();
```

### Gestion des enums

```javascript
import { enumsAPI } from '../services/api';

// Récupérer les référentiels
const formesJuridiques = await enumsAPI.getSocieteJuridictions();
const typesEntreprise = await enumsAPI.getTypeEntreprises();
```

## Dépannage

### Problèmes courants

1. **Network Error** : Vérifiez `REACT_APP_USER_API_URL`
2. **CORS Error** : Configurez les origines autorisées
3. **401 Unauthorized** : Token expiré ou invalide
4. **Timeout** : Augmentez `REACT_APP_API_TIMEOUT`

### Logs de debug

```bash
# Activez les logs
REACT_APP_DEBUG_API=true

# Vérifiez la console du navigateur
🔧 User API Configuration Active
🔄 API Request: ...
✅ API Response: ...
❌ API Error: ...
```

### Vérification de configuration

```javascript
import { API_CONFIG } from '../config/api.config';

console.log('Configuration actuelle:', {
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  debug: API_CONFIG.DEBUG
});
```

## Exemple complet

Voir le fichier `src/examples/ApiUsageExample.jsx` pour un exemple complet d'utilisation de l'API avec tous les cas d'usage.

## Différences avec l'application Agent

| Fonctionnalité | App Utilisateur | App Agent |
|----------------|-----------------|-----------|
| **Port par défaut** | 3000 | 3001 |
| **Variable d'env** | `REACT_APP_USER_API_URL` | `REACT_APP_AGENT_API_URL` |
| **Endpoints spécifiques** | `/chat/conversations/start-user` | `/agent/applications` |
| **Rôle** | Création de demandes | Traitement des demandes |
| **Authentification** | Token utilisateur | Token agent |

Les deux applications partagent le même backend Spring Boot sur `http://localhost:8080/api/v1` mais utilisent des endpoints différents selon leur rôle.
