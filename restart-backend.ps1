# Script pour redémarrer le backend Spring Boot
Write-Host "🔄 Redémarrage du Backend API-Invest" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Étape 1: Arrêter tous les processus Java/Maven
Write-Host ""
Write-Host "1. Arrêt des processus Java..." -ForegroundColor Yellow

try {
    # Trouver et arrêter les processus Maven/Java liés à Spring Boot
    $javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { 
        $_.ProcessName -eq "java" -and $_.MainWindowTitle -like "*spring-boot*" 
    }
    
    if ($javaProcesses) {
        foreach ($process in $javaProcesses) {
            Write-Host "   Arrêt du processus Java PID: $($process.Id)" -ForegroundColor Cyan
            Stop-Process -Id $process.Id -Force
        }
        Start-Sleep -Seconds 2
    }
    
    # Vérifier les processus sur le port 8080
    $port8080 = netstat -ano | Select-String ":8080.*LISTENING"
    if ($port8080) {
        Write-Host "   Port 8080 encore utilisé, nettoyage..." -ForegroundColor Yellow
        $pid = ($port8080 -split '\s+')[-1]
        if ($pid -and $pid -ne "0") {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "   ✅ Processus arrêtés" -ForegroundColor Green
    
} catch {
    Write-Host "   ⚠️ Erreur lors de l'arrêt: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Étape 2: Attendre que le port soit libre
Write-Host ""
Write-Host "2. Vérification du port 8080..." -ForegroundColor Yellow

$maxWait = 10
$waited = 0
do {
    $portCheck = netstat -an | Select-String ":8080.*LISTENING"
    if (-not $portCheck) {
        Write-Host "   ✅ Port 8080 libre" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "   Attente libération port... ($waited/$maxWait)" -ForegroundColor Cyan
} while ($waited -lt $maxWait)

# Étape 3: Redémarrer le backend
Write-Host ""
Write-Host "3. Redémarrage du backend..." -ForegroundColor Yellow

try {
    Set-Location "C:\Users\Abdoul\Desktop\API-Invest"
    
    Write-Host "   Répertoire: $(Get-Location)" -ForegroundColor Cyan
    Write-Host "   Commande: mvn spring-boot:run" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Démarrage en cours..." -ForegroundColor Green
    Write-Host "   Attendez le message: 'Started ApiInvestApplication'" -ForegroundColor Yellow
    Write-Host "   Puis testez: http://localhost:8080/actuator/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Logs à surveiller:" -ForegroundColor Cyan
    Write-Host "   - ✅ Stripe configuré avec la clé: sk_test_..." -ForegroundColor White
    Write-Host "   - 💳 Initiation paiement: STRIPE pour entreprise: xxx" -ForegroundColor White
    Write-Host "   - ✅ PaymentIntent créé: pi_xxx" -ForegroundColor White
    Write-Host ""
    Write-Host "❌ Si vous voyez encore 'status: FAILED', il y a une erreur Stripe" -ForegroundColor Red
    Write-Host ""
    
    # Lancer Maven
    Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run" -NoNewWindow -Wait
    
} catch {
    Write-Host "   ❌ Erreur lors du démarrage: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Démarrage manuel:" -ForegroundColor Yellow
    Write-Host "   1. Ouvrir une nouvelle console" -ForegroundColor White
    Write-Host "   2. cd C:\Users\Abdoul\Desktop\API-Invest" -ForegroundColor White
    Write-Host "   3. mvn spring-boot:run" -ForegroundColor White
}
