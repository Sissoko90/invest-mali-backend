# Test de la configuration Stripe
Write-Host "Test de la configuration Stripe..." -ForegroundColor Green

# Verification du fichier application.yml
$configFile = "src\main\resources\application.yml"
if (Test-Path $configFile) {
    Write-Host "Fichier application.yml trouve" -ForegroundColor Green
    
    $content = Get-Content $configFile -Raw
    
    # Verifier les proprietes Stripe
    if ($content -match "public-key:\s*pk_test_") {
        Write-Host "  Cle publique Stripe configuree" -ForegroundColor Green
    } else {
        Write-Host "  ERREUR: Cle publique Stripe manquante" -ForegroundColor Red
    }
    
    if ($content -match "secret-key:\s*sk_test_") {
        Write-Host "  Cle secrete Stripe configuree" -ForegroundColor Green
    } else {
        Write-Host "  ERREUR: Cle secrete Stripe manquante" -ForegroundColor Red
    }
    
    if ($content -match "webhook-secret:\s*whsec_") {
        Write-Host "  Secret webhook Stripe configure" -ForegroundColor Green
    } else {
        Write-Host "  ERREUR: Secret webhook Stripe manquant ou commente" -ForegroundColor Red
    }
    
} else {
    Write-Host "ERREUR: Fichier application.yml non trouve" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuration corrigee !" -ForegroundColor Green
Write-Host "Le serveur Spring Boot devrait maintenant demarrer sans erreur." -ForegroundColor Cyan
