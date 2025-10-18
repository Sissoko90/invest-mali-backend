# Test direct de l'API Stripe backend
Write-Host "Test API Stripe Backend" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

# Test 1: Vérifier que le serveur répond
Write-Host ""
Write-Host "1. Test connectivité backend..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 5
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Backend actif" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend non accessible" -ForegroundColor Red
    Write-Host "   Veuillez démarrer le backend avec: mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

# Test 2: Vérifier la clé publique Stripe
Write-Host ""
Write-Host "2. Test clé publique Stripe..." -ForegroundColor Yellow
try {
    $keyResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/payments/stripe/public-key" -UseBasicParsing -TimeoutSec 5
    if ($keyResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Clé publique accessible" -ForegroundColor Green
        $keyContent = $keyResponse.Content | ConvertFrom-Json
        Write-Host "   Clé: $($keyContent.publicKey.Substring(0,20))..." -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Erreur clé publique: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test direct de l'API de paiement (sans auth pour debug)
Write-Host ""
Write-Host "3. Test API paiement..." -ForegroundColor Yellow

$testPayload = @{
    entrepriseId = "test-123"
    paymentMethod = "STRIPE"
    amount = 2500000
    currency = "xof"
    description = "Test paiement"
} | ConvertTo-Json

Write-Host "   Payload: $testPayload" -ForegroundColor Cyan

try {
    # Note: Ce test échouera avec 401/403 à cause de l'auth, mais on verra le type d'erreur
    $paymentResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/payments/initiate" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testPayload `
        -UseBasicParsing `
        -TimeoutSec 10
        
    Write-Host "   ✅ Réponse: $($paymentResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Contenu: $($paymentResponse.Content)" -ForegroundColor Cyan
    
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $statusCode = [int]$errorResponse.StatusCode
        Write-Host "   Status: $statusCode" -ForegroundColor Yellow
        
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "   ✅ API accessible (erreur d'auth normale)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erreur API: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Erreur réseau: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Instructions
Write-Host ""
Write-Host "DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si le backend est actif mais retourne toujours FAILED:" -ForegroundColor Yellow
Write-Host "1. Vérifiez les logs du backend dans la console" -ForegroundColor White
Write-Host "2. Cherchez des erreurs Stripe comme:" -ForegroundColor White
Write-Host "   - 'StripeException'" -ForegroundColor Red
Write-Host "   - 'Invalid API key'" -ForegroundColor Red
Write-Host "   - 'Authentication required'" -ForegroundColor Red
Write-Host ""
Write-Host "3. Redémarrez le backend pour appliquer les modifications:" -ForegroundColor White
Write-Host "   Ctrl+C dans la console backend, puis: mvn spring-boot:run" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Si l'erreur persiste, vérifiez application.yml:" -ForegroundColor White
Write-Host "   - Clés Stripe correctes" -ForegroundColor White
Write-Host "   - Pas de caractères spéciaux" -ForegroundColor White
