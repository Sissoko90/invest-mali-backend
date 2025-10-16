# Déploiement GitHub - API InvestMali

## 📋 Statut du Déploiement

✅ **Projet déployé avec succès sur GitHub**
- Repository: https://github.com/cheickg22/api-investMali.git
- Branche principale: `master`
- Dernière synchronisation: Octobre 2024

## 🏗️ Structure du Projet

```
API-Invest/
├── src/                          # Backend Spring Boot
│   ├── main/java/               # Code source Java
│   └── main/resources/          # Configuration et ressources
├── frontend/                    # Applications Frontend
│   ├── investmali-user/         # Interface utilisateur
│   │   └── investmali-react-user/
│   └── investmali-agent/        # Interface agent
├── database/                    # Scripts SQL et migrations
├── pom.xml                      # Configuration Maven
└── README.md                    # Documentation principale
```

## 🚀 Applications Incluses

### 1. Backend Spring Boot
- **Port**: 8080
- **Context Path**: `/api/v1`
- **Base de données**: MySQL
- **Fonctionnalités**:
  - API REST complète
  - Gestion des entreprises
  - Upload de documents
  - Système d'authentification
  - Chat en temps réel

### 2. Frontend Utilisateur (investmali-user)
- **Port**: 3000
- **Framework**: React + TypeScript
- **Fonctionnalités**:
  - Création d'entreprise
  - Suivi des demandes
  - Upload de documents
  - Chat avec agents
  - Profil utilisateur

### 3. Frontend Agent (investmali-agent)
- **Port**: 3001
- **Framework**: React + TypeScript
- **Fonctionnalités**:
  - Dashboard agent
  - Traitement des demandes
  - Workflow de validation
  - Chat avec utilisateurs
  - Gestion des étapes

## 📦 Démarrage Local

### Prérequis
- Java 17+
- Node.js 16+
- MySQL 8.0+
- Maven 3.6+

### 1. Backend
```bash
cd API-Invest
./mvnw spring-boot:run
```

### 2. Frontend Utilisateur
```bash
cd frontend/investmali-user/investmali-react-user
npm install
npm start
```

### 3. Frontend Agent
```bash
cd frontend/investmali-agent
npm install
npm start
```

## 🔧 Configuration

### Variables d'Environnement
- `MYSQL_HOST`: Hôte MySQL (défaut: localhost)
- `MYSQL_PORT`: Port MySQL (défaut: 3306)
- `MYSQL_DATABASE`: Base de données (défaut: apimaliNew)
- `MYSQL_USERNAME`: Utilisateur MySQL
- `MYSQL_PASSWORD`: Mot de passe MySQL

### Profils Spring
- `dev`: Développement local
- `prod`: Production

## 📚 Documentation API

### Endpoints Principaux
- **Authentification**: `/api/v1/auth/*`
- **Personnes**: `/api/v1/persons/*`
- **Entreprises**: `/api/v1/entreprises/*`
- **Documents**: `/api/v1/documents/*`
- **Divisions**: `/api/v1/divisions/*`
- **Chat**: `/api/v1/conversations/*`

### Swagger UI
- URL: http://localhost:8080/swagger-ui/index.html
- Documentation interactive des APIs

## 🔒 Sécurité

### Authentification
- JWT Token
- Rôles utilisateur (USER, AGENT_*, SUPER_ADMIN)
- Protection CORS configurée

### Upload de Fichiers
- Validation des types MIME
- Taille maximale: 10MB
- Stockage sécurisé

## 🗄️ Base de Données

### Tables Principales
- `persons`: Utilisateurs et agents
- `entreprises`: Entreprises créées
- `documents`: Fichiers uploadés
- `divisions`: Divisions administratives
- `conversations`: Chat système
- `messages`: Messages du chat

### Scripts Disponibles
- `database/`: Scripts de création et migration
- `*.sql`: Requêtes de débogage et maintenance

## 🚀 Déploiement Production

### 1. Cloner le Repository
```bash
git clone https://github.com/cheickg22/api-investMali.git
cd api-investMali
```

### 2. Configuration Production
```bash
# Modifier application-prod.yml
# Configurer les variables d'environnement
# Créer la base de données MySQL
```

### 3. Build et Déploiement
```bash
# Backend
./mvnw clean package -Pprod

# Frontend Utilisateur
cd frontend/investmali-user/investmali-react-user
npm run build

# Frontend Agent
cd ../../../frontend/investmali-agent
npm run build
```

## 📋 Checklist de Déploiement

- [x] Code source synchronisé sur GitHub
- [x] Frontend utilisateur inclus
- [x] Frontend agent inclus
- [x] Documentation à jour
- [x] Scripts de base de données disponibles
- [x] Configuration CORS adaptée
- [x] Variables d'environnement documentées

## 🔗 Liens Utiles

- **Repository GitHub**: https://github.com/cheickg22/api-investMali.git
- **Issues**: https://github.com/cheickg22/api-investMali/issues
- **Releases**: https://github.com/cheickg22/api-investMali/releases

## 📞 Support

Pour toute question ou problème:
1. Créer une issue sur GitHub
2. Consulter la documentation dans `/README.md`
3. Vérifier les logs d'application

---

**Dernière mise à jour**: Octobre 2024
**Version**: 1.0.0
**Statut**: ✅ Déployé et fonctionnel
