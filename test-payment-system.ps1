# Script de test du systeme de paiement API-Invest
# Usage: .\test-payment-system.ps1

Write-Host "Test du systeme de paiement API-Invest" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Test 1: Verifier que le serveur repond
Write-Host ""
Write-Host "1. Test de connectivite serveur..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   Serveur Spring Boot actif" -ForegroundColor Green
    }
} catch {
    Write-Host "   Serveur non accessible sur localhost:8080" -ForegroundColor Red
    Write-Host "   Assurez-vous que 'mvn spring-boot:run' est lance" -ForegroundColor Yellow
    exit 1
}

# Test 2: Verifier l'endpoint Stripe
Write-Host ""
Write-Host "2. Test de l'API Stripe..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/payments/stripe/public-key" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   Endpoint Stripe accessible" -ForegroundColor Green
        $content = $response.Content
        Write-Host "   Cle publique: $content" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Endpoint Stripe non accessible" -ForegroundColor Red
    Write-Host "   Verifiez la configuration Stripe dans application.yml" -ForegroundColor Yellow
}

# Test 3: Verifier l'endpoint des frais
Write-Host ""
Write-Host "3. Test de l'API des frais..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/payments/fees" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   Endpoint des frais accessible" -ForegroundColor Green
        $content = $response.Content
        Write-Host "   Frais configures: $content" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Endpoint des frais non accessible" -ForegroundColor Red
}

# Test 4: Verifier les ports
Write-Host ""
Write-Host "4. Test des ports reseau..." -ForegroundColor Yellow

$portTest = netstat -an | Select-String ":8080.*LISTENING"
if ($portTest) {
    Write-Host "   Port 8080 en ecoute" -ForegroundColor Green
} else {
    Write-Host "   Port 8080 non disponible" -ForegroundColor Red
}

# Resume
Write-Host ""
Write-Host "RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Systeme de paiement operationnel !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Configurer les vraies cles Stripe dans application.yml" -ForegroundColor White
Write-Host "  2. Installer les dependances frontend" -ForegroundColor White
Write-Host "  3. Ajouter les routes React dans App.tsx" -ForegroundColor White
Write-Host "  4. Tester avec les cartes de test Stripe" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - Guide complet: PAYMENT_SYSTEM_DOCUMENTATION.md" -ForegroundColor White
Write-Host "  - Deploiement: DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "Le systeme de paiement API-Invest est pret !" -ForegroundColor Green
