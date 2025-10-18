# Configuration API InvestMali Agent

## Vue d'ensemble

Ce document décrit la configuration centralisée de l'API pour l'application React Agent InvestMali. La configuration utilise des variables d'environnement pour une gestion flexible des endpoints et paramètres.

## Variables d'environnement

### Fichier .env

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
# URL de base de l'API backend Spring Boot
REACT_APP_AGENT_API_URL=http://localhost:8080/api/v1

# Port de l'application React Agent (optionnel)
PORT=3001

# Environnement de développement
NODE_ENV=development

# Configuration pour les endpoints de création d'application
REACT_APP_CREATE_CLIENT_APP_PATH=/agent/applications,/applications

# Timeout pour les requêtes API (en millisecondes)
REACT_APP_API_TIMEOUT=30000

# Activer les logs de debug pour les appels API
REACT_APP_DEBUG_API=true
```

### Variables disponibles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `REACT_APP_AGENT_API_URL` | URL de base de l'API backend | `http://localhost:8080/api/v1` |
| `REACT_APP_API_TIMEOUT` | Timeout des requêtes en ms | `30000` |
| `REACT_APP_DEBUG_API` | Active les logs de debug | `false` |
| `REACT_APP_CREATE_CLIENT_APP_PATH` | Chemins pour création d'applications | Voir configuration |

## Structure de la configuration

### Fichier de configuration : `src/config/api.config.ts`

```typescript
import { API_CONFIG, API_ENDPOINTS, buildApiUrl } from '../config/api.config';

// Configuration de base
console.log(API_CONFIG.BASE_URL); // http://localhost:8080/api/v1
console.log(API_CONFIG.TIMEOUT);  // 30000

// Endpoints disponibles
console.log(API_ENDPOINTS.AUTH.LOGIN);     // /auth/login
console.log(API_ENDPOINTS.ENTREPRISES.LIST); // /entreprises
```

### Service API : `src/services/api.ts`

Le service API utilise automatiquement la configuration centralisée :

```typescript
import apiClient, { agentAuthAPI, entreprisesAPI } from '../services/api';

// Les appels utilisent automatiquement la configuration
const response = await agentAuthAPI.login({ email, password });
const apps = await entreprisesAPI.list();
```

## Utilisation

### 1. Appels API avec modules spécialisés

```typescript
import { agentAuthAPI, entreprisesAPI, chatAPI } from '../services/api';

// Authentification
const loginResponse = await agentAuthAPI.login({
  email: 'agent@example.com',
  password: 'password'
});

// Gestion des entreprises
const applications = await entreprisesAPI.list({
  page: 0,
  size: 10,
  sort: 'dateCreation,desc'
});

// Assignation d'une demande
await entreprisesAPI.assign('entreprise-id', 'agent-id');

// Chat
const conversations = await chatAPI.getAgentConversations();
```

### 2. Appels API directs

```typescript
import apiClient from '../services/api';

// GET request
const response = await apiClient.get('/entreprises/unassigned');

// POST request
const result = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  motdepasse: 'password'
});

// PUT request
await apiClient.put('/entreprises/123', {
  statutCreation: 'VALIDEE'
});
```

### 3. Construction d'URLs

```typescript
import { buildApiUrl } from '../config/api.config';

const healthUrl = buildApiUrl('/health');
// Résultat: http://localhost:8080/api/v1/health

const loginUrl = buildApiUrl('/auth/login');
// Résultat: http://localhost:8080/api/v1/auth/login
```

## Endpoints disponibles

### Authentification
- `POST /auth/login` - Connexion agent
- `POST /auth/register` - Inscription
- `GET /auth/me` - Profil utilisateur
- `PATCH /auth/me` - Mise à jour profil
- `POST /auth/me/avatar` - Upload avatar

### Applications Agent
- `GET /agent/applications` - Liste des applications
- `GET /agent/applications/:id` - Détail application
- `PATCH /agent/applications/:id` - Mise à jour application
- `PATCH /agent/applications/:id/assign` - Assignation
- `PATCH /agent/applications/:id/status` - Changement statut
- `GET /agent/stats` - Statistiques

### Entreprises
- `GET /entreprises` - Liste des entreprises
- `GET /entreprises/unassigned` - Entreprises non assignées
- `GET /entreprises/:id` - Détail entreprise
- `PUT /entreprises/:id` - Mise à jour entreprise
- `GET /entreprises/my-applications` - Mes applications
- `PATCH /entreprises/:id/assign` - Assigner entreprise
- `GET /entreprises/assigned-to-me` - Mes assignations

### Chat
- `POST /chat/conversations` - Créer conversation
- `GET /chat/conversations/agent` - Conversations agent
- `GET /chat/conversations/:id` - Détail conversation
- `POST /chat/conversations/:id/messages` - Envoyer message
- `PATCH /chat/conversations/:id/read` - Marquer lu
- `GET /chat/unread-count/agent` - Nombre non lus

### Notifications
- `GET /agent/notifications` - Liste notifications
- `PATCH /agent/notifications/:id/read` - Marquer lu
- `PATCH /agent/notifications/read-all` - Tout marquer lu

## Gestion des erreurs

### Intercepteurs automatiques

L'API inclut des intercepteurs pour :

1. **Authentification automatique** : Ajout du token Bearer
2. **Gestion des erreurs 401** : Redirection vers login
3. **Logs de debug** : Traçage des requêtes (si activé)

```typescript
// Gestion automatique des erreurs
try {
  const response = await entreprisesAPI.list();
} catch (error) {
  // Erreur 401 → redirection automatique vers /agent-login
  // Autres erreurs → gestion manuelle
  console.error('Erreur API:', error.message);
}
```

### Debug et logs

Activez les logs avec `REACT_APP_DEBUG_API=true` :

```bash
🚀 Agent API baseURL: http://localhost:8080/api/v1
🔄 API Request: { method: 'GET', url: '/entreprises', hasAuth: true }
✅ API Response: { status: 200, url: '/entreprises', method: 'GET' }
```

## Migration depuis l'ancienne configuration

### Avant (URLs hardcodées)
```typescript
// ❌ Ancien code
const response = await axios.get('http://localhost:8080/entreprises');
```

### Après (Configuration centralisée)
```typescript
// ✅ Nouveau code
import { entreprisesAPI } from '../services/api';
const response = await entreprisesAPI.list();
```

## Environnements

### Développement
```bash
REACT_APP_AGENT_API_URL=http://localhost:8080/api/v1
REACT_APP_DEBUG_API=true
```

### Production
```bash
REACT_APP_AGENT_API_URL=https://api.investmali.ml/api/v1
REACT_APP_DEBUG_API=false
REACT_APP_API_TIMEOUT=60000
```

### Test
```bash
REACT_APP_AGENT_API_URL=http://localhost:3001/api/v1
REACT_APP_DEBUG_API=true
```

## Sécurité

### Tokens d'authentification

Les tokens sont gérés automatiquement :

```typescript
// Stockage automatique après login
localStorage.setItem('investmali_agent_token', token);

// Ajout automatique dans les headers
// Authorization: Bearer <token>
```

### Configuration CORS

Le backend doit autoriser l'origine de l'application agent :

```yaml
# application.yml
cors:
  allowed-origins: http://localhost:3001,http://localhost:8080/api/v1
```

## Dépannage

### Problèmes courants

1. **Network Error** : Vérifiez `REACT_APP_AGENT_API_URL`
2. **CORS Error** : Configurez les origines autorisées
3. **401 Unauthorized** : Token expiré ou invalide
4. **Timeout** : Augmentez `REACT_APP_API_TIMEOUT`

### Logs de debug

```bash
# Activez les logs
REACT_APP_DEBUG_API=true

# Vérifiez la console du navigateur
🔧 API Configuration
🔄 API Request: ...
✅ API Response: ...
❌ Response interceptor error: ...
```

## Exemple complet

Voir le fichier `src/examples/ApiUsageExample.tsx` pour un exemple complet d'utilisation de l'API avec tous les cas d'usage.
