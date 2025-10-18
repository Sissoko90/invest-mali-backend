# Test rapide du systeme de paiement
Write-Host "Test rapide API-Invest..." -ForegroundColor Green

# Test direct de l'endpoint Stripe
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/payments/stripe/public-key" -UseBasicParsing -TimeoutSec 5
    Write-Host "Reponse: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Contenu: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Test de l'endpoint des frais
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/payments/fees" -UseBasicParsing -TimeoutSec 5
    Write-Host "Frais - Reponse: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Frais - Contenu: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Erreur frais: $($_.Exception.Message)" -ForegroundColor Red
}
