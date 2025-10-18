# 🚀 Guide de Déploiement - Système de Paiement API-Invest

## ✅ Checklist de Déploiement

### Backend Spring Boot

#### 1. Configuration Stripe
- [ ] Obtenir les clés Stripe (publique/secrète) depuis le dashboard Stripe
- [ ] Configurer `application.yml` avec les vraies clés :
```yaml
stripe:
  public-key: pk_live_... # Remplacer par la vraie clé publique
  secret-key: sk_live_... # Remplacer par la vraie clé secrète
  webhook-secret: whsec_... # Secret du webhook Stripe
```

#### 2. Dépendances Maven
- [ ] Vérifier que `stripe-java:24.16.0` est dans le pom.xml ✅
- [ ] Exécuter `mvn clean install` pour télécharger les dépendances
- [ ] Vérifier la compilation : `mvn compile`

#### 3. Base de données
- [ ] S'assurer que la table `entreprises` a la colonne `etape_validation`
- [ ] Vérifier les énums `EtapeValidation` dans le code
- [ ] Tester la connexion MySQL

#### 4. Sécurité
- [ ] Configurer CORS pour les domaines de production
- [ ] Vérifier les endpoints protégés par JWT
- [ ] Tester l'authentification

### Frontend React

#### 1. Installation des dépendances
```bash
# Exécuter dans le dossier frontend
cd frontend/investmali-user/investmali-react-user

# Option 1: Script automatique
./install-payment-dependencies.sh

# Option 2: Installation manuelle
npm install @stripe/stripe-js @stripe/react-stripe-js react-router-dom
npm install --save-dev @types/react-router-dom
```

#### 2. Configuration des variables d'environnement
- [ ] Créer/modifier `.env` :
```bash
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
REACT_APP_USER_API_URL=https://api.votre-domaine.com/api/v1
```

#### 3. Routes React
- [ ] Ajouter les routes dans `App.tsx` :
```typescript
import PaymentCardPage from './pages/PaymentCardPage';
import PaymentOrangeMoneyPage from './pages/PaymentOrangeMoneyPage';
import PaymentMoovMoneyPage from './pages/PaymentMoovMoneyPage';
import PaymentBankTransferPage from './pages/PaymentBankTransferPage';
import PaymentCashPage from './pages/PaymentCashPage';

// Dans le Router
<Route path="/payment/card" element={<PaymentCardPage />} />
<Route path="/payment/orange-money" element={<PaymentOrangeMoneyPage />} />
<Route path="/payment/moov-money" element={<PaymentMoovMoneyPage />} />
<Route path="/payment/bank-transfer" element={<PaymentBankTransferPage />} />
<Route path="/payment/cash" element={<PaymentCashPage />} />
```

## 🧪 Tests de Validation

### 1. Tests Backend
```bash
# Test de compilation
mvn clean compile

# Test des endpoints
curl -X GET http://localhost:8080/api/v1/payments/stripe/public-key
curl -X GET http://localhost:8080/api/v1/payments/fees

# Test avec authentification
curl -X POST http://localhost:8080/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "entrepriseId": "test-123",
    "paymentMethod": "STRIPE",
    "amount": 2500000,
    "currency": "xof"
  }'
```

### 2. Tests Frontend
```bash
# Compilation TypeScript
npm run build

# Tests unitaires
npm test

# Test en mode développement
npm start
```

### 3. Tests d'intégration Stripe
- [ ] Utiliser les cartes de test Stripe :
  - **Succès** : `4242424242424242`
  - **Décliné** : `4000000000000002`
  - **3D Secure** : `4000002500003155`

### 4. Tests du workflow complet
1. [ ] Créer une demande d'entreprise
2. [ ] Vérifier qu'elle est à l'étape `ACCUEIL`
3. [ ] Simuler le passage à l'étape `REGISSEUR` (via admin)
4. [ ] Vérifier que le bouton paiement apparaît
5. [ ] Tester chaque méthode de paiement
6. [ ] Vérifier les notifications et statuts

## 🔧 Configuration Production

### 1. Variables d'environnement
```bash
# Backend
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
REACT_APP_USER_API_URL=https://api.votre-domaine.com/api/v1
```

### 2. Webhook Stripe
- [ ] Configurer l'endpoint webhook dans Stripe Dashboard :
  - URL : `https://api.votre-domaine.com/api/v1/payments/stripe/webhook`
  - Événements : `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Copier le secret webhook dans la configuration

### 3. HTTPS et Sécurité
- [ ] Activer HTTPS sur tous les domaines
- [ ] Configurer les en-têtes de sécurité
- [ ] Vérifier les certificats SSL

## 📊 Monitoring et Logs

### 1. Logs Backend
```java
// Les logs sont déjà configurés dans le code
System.out.println("💳 Initiation paiement: " + method);
System.out.println("✅ Paiement réussi: " + paymentId);
System.err.println("❌ Erreur Stripe: " + error.getMessage());
```

### 2. Monitoring Stripe
- [ ] Configurer les alertes dans le Dashboard Stripe
- [ ] Surveiller les taux de succès/échec
- [ ] Vérifier les remboursements et litiges

### 3. Métriques applicatives
- [ ] Surveiller les temps de réponse des APIs
- [ ] Monitorer l'utilisation mémoire/CPU
- [ ] Alertes sur les erreurs 500

## 🚨 Dépannage

### Erreurs courantes

#### 1. "Cannot find module '@stripe/stripe-js'"
```bash
# Solution
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### 2. "Invalid API key provided"
- Vérifier que les clés Stripe sont correctes
- S'assurer d'utiliser les clés de production (pk_live_, sk_live_)
- Vérifier que les clés correspondent au bon compte Stripe

#### 3. "CORS error"
- Ajouter le domaine frontend dans `application.yml` :
```yaml
app:
  cors:
    allowed-origins: https://votre-domaine.com,https://www.votre-domaine.com
```

#### 4. "Webhook signature verification failed"
- Vérifier le secret webhook dans la configuration
- S'assurer que l'endpoint est accessible publiquement
- Tester avec ngrok en développement

### Logs de débogage
```bash
# Backend Spring Boot
tail -f logs/spring.log | grep -E "(PAYMENT|STRIPE|ERROR)"

# Frontend (Console navigateur)
# Ouvrir DevTools → Console → Filtrer par "payment"
```

## 📱 Tests Mobile

### 1. Responsive Design
- [ ] Tester sur iPhone (Safari)
- [ ] Tester sur Android (Chrome)
- [ ] Vérifier les formulaires de paiement
- [ ] Tester les modals et navigation

### 2. Paiements mobiles
- [ ] Tester Orange Money sur mobile
- [ ] Tester Moov Money sur mobile
- [ ] Vérifier les codes USSD

## 🔄 Mise en Production

### 1. Déploiement Backend
```bash
# Build production
mvn clean package -Pprod

# Déploiement (exemple avec Docker)
docker build -t api-invest-backend .
docker run -d -p 8080:8080 \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e STRIPE_PUBLIC_KEY=pk_live_... \
  api-invest-backend
```

### 2. Déploiement Frontend
```bash
# Build production
npm run build

# Déploiement (exemple avec Nginx)
cp -r build/* /var/www/html/
systemctl reload nginx
```

### 3. Vérifications post-déploiement
- [ ] Tester tous les endpoints de paiement
- [ ] Vérifier les webhooks Stripe
- [ ] Tester un paiement réel (petit montant)
- [ ] Vérifier les emails de confirmation
- [ ] Tester la navigation mobile

## 📞 Support et Maintenance

### Contacts Stripe
- **Dashboard** : https://dashboard.stripe.com
- **Documentation** : https://stripe.com/docs
- **Support** : Via le dashboard Stripe

### Maintenance régulière
- [ ] Vérifier les logs d'erreur hebdomadairement
- [ ] Surveiller les métriques de paiement
- [ ] Mettre à jour les dépendances mensuellement
- [ ] Tester les sauvegardes de base de données

### Alertes à configurer
- Taux d'échec de paiement > 5%
- Temps de réponse API > 2 secondes
- Erreurs 500 > 10 par heure
- Webhook Stripe en échec

---

## ✅ Checklist Finale

- [ ] Backend compilé et testé
- [ ] Frontend buildé et testé
- [ ] Clés Stripe configurées
- [ ] Routes React ajoutées
- [ ] Webhooks Stripe configurés
- [ ] Tests de paiement effectués
- [ ] Monitoring configuré
- [ ] Documentation mise à jour

**🎉 Le système de paiement API-Invest est prêt pour la production !**
