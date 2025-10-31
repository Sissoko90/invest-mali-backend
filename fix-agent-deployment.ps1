# Script PowerShell pour corriger le déploiement de l'application Agent
# Résout le problème ERR_CONNECTION_REFUSED en configurant la bonne URL API

Write-Host "🔧 Correction du déploiement de l'application Agent InvestMali" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Vérifier si on est dans le bon répertoire
$currentDir = Get-Location
$agentDir = Join-Path $currentDir "frontend\investmali-agent"

if (-not (Test-Path $agentDir)) {
    Write-Host "❌ Erreur: Répertoire agent non trouvé: $agentDir" -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire racine du projet API-Invest" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Répertoire agent trouvé: $agentDir" -ForegroundColor Green

# Aller dans le répertoire agent
Set-Location $agentDir

# Créer le fichier .env avec la configuration de production
$envContent = @"
# Configuration API pour l'application Agent InvestMali
REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1
PORT=3001
NODE_ENV=production
GENERATE_SOURCEMAP=false
REACT_APP_API_TIMEOUT=30000
REACT_APP_DEBUG_API=false
REACT_APP_CREATE_CLIENT_APP_PATH=/agent/applications,/applications
"@

Write-Host "📝 Création du fichier .env..." -ForegroundColor Yellow
$envContent | Out-File -FilePath ".env" -Encoding UTF8

if (Test-Path ".env") {
    Write-Host "✅ Fichier .env créé avec succès" -ForegroundColor Green
    Write-Host "📋 Contenu du fichier .env:" -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ Erreur lors de la création du fichier .env" -ForegroundColor Red
    exit 1
}

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dépendances installées avec succès" -ForegroundColor Green
} else {
    Write-Host "✅ Dépendances déjà installées" -ForegroundColor Green
}

# Tester la connectivité au backend
Write-Host "🌐 Test de connectivité au backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://investmali.abdatytch.com/api/v1/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend répond mais status inattendu: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Backend non accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend est démarré et accessible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Configuration terminée!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Pour démarrer l'application agent:" -ForegroundColor Cyan
Write-Host "   cd frontend\investmali-agent" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "L'application sera accessible sur: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Vérifications à effectuer après démarrage:" -ForegroundColor Yellow
Write-Host "   1. Pas d'erreurs ERR_CONNECTION_REFUSED dans la console" -ForegroundColor Gray
Write-Host "   2. Les détails des entreprises se chargent correctement" -ForegroundColor Gray
Write-Host "   3. Les notifications chat fonctionnent" -ForegroundColor Gray
Write-Host "   4. Les documents s'affichent sans erreur" -ForegroundColor Gray

# Retourner au répertoire initial
Set-Location $currentDir

Write-Host ""
Write-Host "✨ Script terminé avec succès!" -ForegroundColor Green
