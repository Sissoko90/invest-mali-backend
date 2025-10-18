# 💳 Système de Paiement Multi-Méthodes API-Invest

## Vue d'ensemble

Le système de paiement API-Invest offre une solution complète et sécurisée pour traiter les paiements des demandes de création d'entreprise avec 5 méthodes de paiement et un contrôle intelligent basé sur les étapes de validation.

## 🏗️ Architecture

### Backend Spring Boot
- **StripeConfig.java** : Configuration Stripe avec clés sécurisées
- **PaymentController.java** : API REST pour tous les types de paiement
- **StripeService.java** : Service d'intégration Stripe
- **PaymentRequest/Response DTOs** : Structures de données typées

### Frontend React TypeScript
- **PaymentMethodModal** : Sélection de méthode de paiement
- **StripePaymentContainer** : Conteneur de paiement Stripe
- **StripeCheckoutForm** : Formulaire de paiement sécurisé
- **PaymentStatus** : Affichage des statuts de paiement
- **5 pages dédiées** : Une par méthode de paiement

## 🔄 Workflow de Paiement

### 1. Contrôle d'Étapes (7 étapes)
```
ACCUEIL → REGISSEUR → IMPOTS → RCCM1 → RCCM2 → NINA → RETRAIT
```

- **ACCUEIL** : Modifications autorisées, pas de paiement
- **REGISSEUR** : Bouton paiement apparaît, modifications bloquées
- **IMPOTS+** : Paiement effectué, traitement en cours

### 2. Déclenchement du Paiement
1. Utilisateur consulte sa demande dans UserProfile
2. Si `etapeValidation === "REGISSEUR"` → Bouton paiement visible
3. Clic sur "Procéder au paiement" → Modal de sélection
4. Choix de méthode → Redirection vers page dédiée

### 3. Traitement par Méthode
- **Stripe** : Paiement immédiat sécurisé
- **Orange/Moov Money** : Instructions USSD
- **Virement** : Coordonnées bancaires
- **Espèces** : Adresses d'agences

## 💳 Méthodes de Paiement

### 1. Stripe (Cartes Bancaires)
- **Sécurité** : PCI DSS, 3D Secure automatique
- **Cartes** : Visa, Mastercard, cartes locales
- **Devise** : XOF (Franc CFA)
- **Frais** : 2.9% + 30 XOF par transaction

```typescript
// Exemple d'utilisation
const paymentData = {
  entrepriseId: "123",
  paymentMethod: "STRIPE",
  amount: 2500000, // 25,000 XOF en centimes
  currency: "xof"
};
```

### 2. Orange Money
- **Code USSD** : *144*4*4#
- **Intégration** : API Orange Money Mali
- **Frais** : Selon grille Orange

### 3. Moov Money
- **Code USSD** : *555#
- **Intégration** : API Moov Money Mali
- **Frais** : Selon grille Moov

### 4. Virement Bancaire
- **Bénéficiaire** : API-INVEST MALI
- **IBAN** : ML13 BMLI 0001 0000 0000 0000 1234
- **Référence** : Générée automatiquement

### 5. Paiement Espèces
- **Agences** : Bamako Centre, Bamako Hippodrome
- **Horaires** : Lun-Ven 8h-17h, Sam 8h-12h
- **Documents** : Pièce d'identité + référence

## 🔧 Configuration

### Backend (application.yml)
```yaml
stripe:
  public-key: pk_test_...  # Clé publique Stripe
  secret-key: sk_test_...  # Clé secrète Stripe
  webhook-secret: whsec_... # Secret webhook
  currency: xof
  fees:
    business-creation: 2500000  # 25,000 XOF
```

### Frontend (.env)
```bash
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
REACT_APP_USER_API_URL=http://localhost:8080/api/v1
```

## 📡 API Endpoints

### Paiements
- `GET /payments/stripe/public-key` : Clé publique Stripe
- `POST /payments/initiate` : Initier un paiement
- `GET /payments/{id}/status` : Statut d'un paiement
- `POST /payments/stripe/webhook` : Webhook Stripe
- `GET /payments/fees` : Calcul des frais

### Exemple d'appel API
```javascript
const response = await fetch('/api/v1/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    entrepriseId: "123",
    paymentMethod: "STRIPE",
    amount: 2500000,
    currency: "xof",
    description: "Frais création entreprise"
  })
});
```

## 🛡️ Sécurité

### Stripe
- **Chiffrement** : TLS 1.2+ pour toutes les communications
- **PCI DSS** : Conformité niveau 1
- **3D Secure** : Authentification forte automatique
- **Tokenisation** : Aucune donnée carte stockée

### Backend
- **JWT** : Authentification par token
- **CORS** : Configuration restrictive
- **Validation** : Données d'entrée validées
- **Logs** : Traçabilité complète

### Frontend
- **HTTPS** : Obligatoire en production
- **CSP** : Content Security Policy
- **Sanitisation** : Données utilisateur nettoyées

## 🚀 Installation

### 1. Backend
```bash
# Ajouter dépendance Maven (déjà fait)
# Configurer application.yml avec vraies clés Stripe
# Redémarrer Spring Boot
mvn spring-boot:run
```

### 2. Frontend
```bash
# Installer dépendances
npm install @stripe/stripe-js @stripe/react-stripe-js react-router-dom

# Ou utiliser le script
./install-payment-dependencies.sh
```

### 3. Routes React
Ajouter dans `App.tsx` :
```typescript
import PaymentCardPage from './pages/PaymentCardPage';
import PaymentOrangeMoneyPage from './pages/PaymentOrangeMoneyPage';

// Dans le Router
<Route path="/payment/card" element={<PaymentCardPage />} />
<Route path="/payment/orange-money" element={<PaymentOrangeMoneyPage />} />
<Route path="/payment/moov-money" element={<PaymentMoovMoneyPage />} />
<Route path="/payment/bank-transfer" element={<PaymentBankTransferPage />} />
<Route path="/payment/cash" element={<PaymentCashPage />} />
```

## 🧪 Tests

### Tests Backend
```bash
# Tests unitaires
mvn test

# Test endpoint paiement
curl -X POST http://localhost:8080/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"entrepriseId":"123","paymentMethod":"STRIPE","amount":2500000}'
```

### Tests Frontend
```bash
# Tests composants
npm test

# Test intégration Stripe (mode test)
# Utiliser cartes de test : 4242424242424242
```

## 📊 Monitoring

### Logs Backend
- Tous les paiements sont loggés avec ID unique
- Erreurs Stripe tracées avec détails
- Webhooks Stripe enregistrés

### Métriques
- Taux de succès par méthode
- Temps de traitement moyen
- Volume de transactions

## 🔄 Workflow Complet

### Scénario Utilisateur
1. **Soumission** : Utilisateur soumet demande → Étape ACCUEIL
2. **Vérification** : Agent vérifie → Passe à REGISSEUR
3. **Paiement** : Bouton apparaît → Utilisateur paie
4. **Traitement** : Paiement validé → Étape IMPOTS
5. **Finalisation** : Processus continue → RETRAIT

### Gestion d'Erreurs
- **Paiement échoué** : Retry automatique disponible
- **Timeout** : Notification utilisateur
- **Webhook manqué** : Réconciliation manuelle

## 📱 Interface Utilisateur

### Responsive Design
- **Mobile** : Interface optimisée tactile
- **Desktop** : Expérience complète
- **Tablette** : Adaptation automatique

### Accessibilité
- **WCAG 2.1** : Conformité niveau AA
- **Navigation clavier** : Support complet
- **Screen readers** : Labels appropriés

## 🌍 Internationalisation

### Langues
- **Français** : Langue principale
- **Bambara** : Support prévu
- **Anglais** : Interface technique

### Devises
- **XOF** : Franc CFA (principal)
- **EUR/USD** : Support futur

## 🔮 Évolutions Futures

### Nouvelles Méthodes
- **Wave** : Portefeuille mobile
- **PayPal** : Paiements internationaux
- **Crypto** : Bitcoin, stablecoins

### Fonctionnalités
- **Paiements récurrents** : Abonnements
- **Remboursements** : Interface admin
- **Facturation** : Génération automatique

## 📞 Support

### Contact Technique
- **Email** : dev@api-invest.ml
- **Téléphone** : +223 20 12 34 56
- **Documentation** : https://docs.api-invest.ml

### Urgences
- **Paiements bloqués** : Support 24/7
- **Erreurs Stripe** : Escalade automatique
- **Fraude** : Alerte immédiate

---

**Version** : 1.0.0  
**Dernière mise à jour** : Octobre 2024  
**Auteur** : Équipe API-Invest Mali
