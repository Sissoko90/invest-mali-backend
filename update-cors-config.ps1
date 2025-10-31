# Script PowerShell pour mettre à jour la configuration CORS
# Ajoute l'URL de l'application agent déployée

Write-Host "🌐 Mise à jour de la configuration CORS pour l'application Agent" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# URLs à autoriser (Production uniquement)
$allowedOrigins = @(
    "https://investmali.abdatytch.com",
    "https://investmali-agent.abdatytch.com"
)

$originsString = $allowedOrigins -join ","

Write-Host "📋 URLs à autoriser:" -ForegroundColor Yellow
foreach ($origin in $allowedOrigins) {
    Write-Host "   ✓ $origin" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Configuration de la variable d'environnement..." -ForegroundColor Yellow

# Définir la variable d'environnement pour la session actuelle
$env:APP_CORS_ALLOWED_ORIGINS = $originsString

Write-Host "✅ Variable d'environnement configurée:" -ForegroundColor Green
Write-Host "   APP_CORS_ALLOWED_ORIGINS = $originsString" -ForegroundColor Gray

Write-Host ""
Write-Host "📝 Configuration recommandée pour application.yml:" -ForegroundColor Cyan
Write-Host @"
app:
  cors:
    allowed-origins: >
      https://investmali.abdatytch.com,
      https://investmali-agent.abdatytch.com
"@ -ForegroundColor Gray

Write-Host ""
Write-Host "🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Ajouter la configuration ci-dessus dans src/main/resources/application.yml" -ForegroundColor Gray
Write-Host "   2. Redémarrer le backend Spring Boot" -ForegroundColor Gray
Write-Host "   3. Vérifier les logs pour confirmer la configuration CORS" -ForegroundColor Gray

Write-Host ""
Write-Host "🧪 Test de connectivité:" -ForegroundColor Yellow
Write-Host "   Ouvrir https://investmali-agent.abdatytch.com" -ForegroundColor Gray
Write-Host "   Vérifier qu'il n'y a pas d'erreurs CORS dans la console" -ForegroundColor Gray

Write-Host ""
Write-Host "✨ Configuration CORS mise à jour!" -ForegroundColor Green
