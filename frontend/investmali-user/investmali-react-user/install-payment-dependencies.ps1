# Script PowerShell d'installation des dépendances pour le système de paiement API-Invest
# Usage: .\install-payment-dependencies.ps1

Write-Host "🚀 Installation des dépendances pour le système de paiement API-Invest" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

# Vérifier si npm est installé
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version $npmVersion détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé. Veuillez installer Node.js et npm d'abord." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installation des dépendances Stripe..." -ForegroundColor Yellow
npm install @stripe/stripe-js @stripe/react-stripe-js

Write-Host ""
Write-Host "📦 Installation des dépendances de routage..." -ForegroundColor Yellow
npm install react-router-dom

Write-Host ""
Write-Host "📦 Installation des dépendances TypeScript (si nécessaire)..." -ForegroundColor Yellow
npm install --save-dev @types/react-router-dom

Write-Host ""
Write-Host "✅ Installation terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Dépendances installées :" -ForegroundColor Cyan
Write-Host "  - @stripe/stripe-js : SDK Stripe JavaScript" -ForegroundColor White
Write-Host "  - @stripe/react-stripe-js : Composants React Stripe" -ForegroundColor White
Write-Host "  - react-router-dom : Routage React" -ForegroundColor White
Write-Host "  - @types/react-router-dom : Types TypeScript" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "  1. Configurez vos clés Stripe dans application.yml" -ForegroundColor White
Write-Host "  2. Ajoutez les routes de paiement dans App.tsx" -ForegroundColor White
Write-Host "  3. Testez l'intégration avec des clés de test Stripe" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation :" -ForegroundColor Cyan
Write-Host "  - Stripe React : https://stripe.com/docs/stripe-js/react" -ForegroundColor White
Write-Host "  - API-Invest : Voir README.md" -ForegroundColor White
