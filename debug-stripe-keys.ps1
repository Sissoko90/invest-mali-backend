# Diagnostic des clés Stripe
Write-Host "🔍 Diagnostic Clés Stripe" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Lire le fichier application.yml
$configFile = "src\main\resources\application.yml"

if (Test-Path $configFile) {
    Write-Host ""
    Write-Host "📄 Lecture de application.yml..." -ForegroundColor Yellow
    
    $content = Get-Content $configFile -Raw
    
    # Extraire les clés Stripe
    if ($content -match "public-key:\s*([^\s\r\n]+)") {
        $publicKey = $matches[1]
        Write-Host "   Clé publique: $($publicKey.Substring(0,20))..." -ForegroundColor Cyan
        
        # Vérifier le format
        if ($publicKey.StartsWith("pk_test_")) {
            Write-Host "   ✅ Format clé publique correct (test)" -ForegroundColor Green
        } elseif ($publicKey.StartsWith("pk_live_")) {
            Write-Host "   ⚠️ Clé publique LIVE détectée" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Format clé publique invalide" -ForegroundColor Red
        }
    }
    
    if ($content -match "secret-key:\s*([^\s\r\n]+)") {
        $secretKey = $matches[1]
        Write-Host "   Clé secrète: $($secretKey.Substring(0,20))..." -ForegroundColor Cyan
        
        # Vérifier le format
        if ($secretKey.StartsWith("sk_test_")) {
            Write-Host "   ✅ Format clé secrète correct (test)" -ForegroundColor Green
        } elseif ($secretKey.StartsWith("sk_live_")) {
            Write-Host "   ⚠️ Clé secrète LIVE détectée" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Format clé secrète invalide" -ForegroundColor Red
        }
    }
    
    # Test simple des clés (sans vraie requête Stripe)
    Write-Host ""
    Write-Host "🧪 Validation des clés..." -ForegroundColor Yellow
    
    if ($publicKey -and $secretKey) {
        # Vérifier que les clés correspondent (même compte)
        $pubAccount = $publicKey.Substring(8, 20)  # Extraire l'ID du compte
        $secAccount = $secretKey.Substring(8, 20)
        
        if ($pubAccount -eq $secAccount) {
            Write-Host "   ✅ Clés publique et secrète correspondent" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Clés publique et secrète ne correspondent pas" -ForegroundColor Red
            Write-Host "      Public: $pubAccount" -ForegroundColor Red
            Write-Host "      Secret: $secAccount" -ForegroundColor Red
        }
        
        # Vérifier la longueur
        if ($publicKey.Length -ge 100 -and $secretKey.Length -ge 100) {
            Write-Host "   ✅ Longueur des clés correcte" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Clés trop courtes (possiblement tronquées)" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "❌ Fichier application.yml non trouvé" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si les clés sont correctes mais le backend retourne FAILED:" -ForegroundColor Yellow
Write-Host "1. 🔄 Redémarrez le backend: .\restart-backend.ps1" -ForegroundColor White
Write-Host "2. 📊 Surveillez les logs pour:" -ForegroundColor White
Write-Host "   - 'StripeException: Invalid API key'" -ForegroundColor Red
Write-Host "   - 'Authentication required'" -ForegroundColor Red
Write-Host "   - 'No such customer/payment_intent'" -ForegroundColor Red
Write-Host ""
Write-Host "3. 🧪 Testez avec curl après redémarrage:" -ForegroundColor White
Write-Host "   curl -X GET http://localhost:8080/api/v1/payments/stripe/public-key" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si le problème persiste, les clés Stripe sont peut-être invalides." -ForegroundColor Yellow
