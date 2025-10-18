#!/bin/bash

# Script d'installation des dépendances pour le système de paiement API-Invest
# Usage: ./install-payment-dependencies.sh

echo "🚀 Installation des dépendances pour le système de paiement API-Invest"
echo "=================================================================="

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer Node.js et npm d'abord."
    exit 1
fi

echo "📦 Installation des dépendances Stripe..."
npm install @stripe/stripe-js @stripe/react-stripe-js

echo "📦 Installation des dépendances de routage..."
npm install react-router-dom

echo "📦 Installation des dépendances TypeScript (si nécessaire)..."
npm install --save-dev @types/react-router-dom

echo "✅ Installation terminée !"
echo ""
echo "📋 Dépendances installées :"
echo "  - @stripe/stripe-js : SDK Stripe JavaScript"
echo "  - @stripe/react-stripe-js : Composants React Stripe"
echo "  - react-router-dom : Routage React"
echo "  - @types/react-router-dom : Types TypeScript"
echo ""
echo "🔧 Prochaines étapes :"
echo "  1. Configurez vos clés Stripe dans application.yml"
echo "  2. Ajoutez les routes de paiement dans App.tsx"
echo "  3. Testez l'intégration avec des clés de test Stripe"
echo ""
echo "📚 Documentation :"
echo "  - Stripe React : https://stripe.com/docs/stripe-js/react"
echo "  - API-Invest : Voir README.md"
