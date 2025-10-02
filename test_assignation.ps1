# Script de Test - Système d'Assignation
# Usage: .\test_assignation.ps1 -Token "YOUR_JWT_TOKEN" -EntrepriseId "ENTERPRISE_ID"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$EntrepriseId
)

$BaseUrl = "http://localhost:8080/api/v1"
$Headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host "🔍 Test du système d'assignation" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test 1: Diagnostic de l'entreprise
Write-Host "`n📋 Test 1: Diagnostic de l'entreprise $EntrepriseId" -ForegroundColor Yellow

try {
    $diagnosticUrl = "$BaseUrl/entreprises/$EntrepriseId/test-assign"
    $diagnostic = Invoke-RestMethod -Uri $diagnosticUrl -Method Get -Headers $Headers
    
    Write-Host "✅ Entreprise trouvée: $($diagnostic.entrepriseExists)" -ForegroundColor Green
    Write-Host "📊 Nom: $($diagnostic.entrepriseName)" -ForegroundColor White
    Write-Host "🔄 Étape: $($diagnostic.etapeValidation)" -ForegroundColor White
    Write-Host "👤 Assigné à: $($diagnostic.currentAssignedTo ?? 'Aucun')" -ForegroundColor White
    Write-Host "🔑 Agent: $($diagnostic.username)" -ForegroundColor White
    Write-Host "🎭 Rôle: $($diagnostic.userRole)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erreur lors du diagnostic: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Tentative d'assignation
Write-Host "`n🎯 Test 2: Tentative d'assignation" -ForegroundColor Yellow

try {
    $assignUrl = "$BaseUrl/entreprises/$EntrepriseId/assign"
    $assignResult = Invoke-RestMethod -Uri $assignUrl -Method Patch -Headers $Headers -Body "{}"
    
    Write-Host "✅ Assignation réussie!" -ForegroundColor Green
    Write-Host "📋 Entreprise: $($assignResult.nom)" -ForegroundColor White
    Write-Host "👤 Assigné à: $($assignResult.assignedTo)" -ForegroundColor White
    
} catch {
    $errorDetails = $_.Exception.Response
    if ($errorDetails) {
        $reader = New-Object System.IO.StreamReader($errorDetails.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "❌ Erreur d'assignation: $errorBody" -ForegroundColor Red
    } else {
        Write-Host "❌ Erreur d'assignation: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Vérification post-assignation
Write-Host "`n🔍 Test 3: Vérification post-assignation" -ForegroundColor Yellow

try {
    $verifyResult = Invoke-RestMethod -Uri $diagnosticUrl -Method Get -Headers $Headers
    
    if ($verifyResult.currentAssignedTo) {
        Write-Host "✅ Assignation confirmée!" -ForegroundColor Green
        Write-Host "👤 Assigné à: $($verifyResult.currentAssignedTo)" -ForegroundColor White
    } else {
        Write-Host "⚠️ Assignation non confirmée" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erreur lors de la vérification: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test de l'API des demandes assignées
Write-Host "`n📋 Test 4: Récupération des demandes assignées" -ForegroundColor Yellow

try {
    $assignedUrl = "$BaseUrl/entreprises/assigned-to-me"
    $assignedResult = Invoke-RestMethod -Uri $assignedUrl -Method Get -Headers $Headers
    
    Write-Host "✅ Demandes assignées récupérées" -ForegroundColor Green
    Write-Host "📊 Nombre total: $($assignedResult.totalElements)" -ForegroundColor White
    Write-Host "📋 Nombre sur cette page: $($assignedResult.content.Count)" -ForegroundColor White
    
    if ($assignedResult.content.Count -gt 0) {
        Write-Host "`n📋 Détails des demandes assignées:" -ForegroundColor Cyan
        foreach ($entreprise in $assignedResult.content) {
            Write-Host "  • $($entreprise.nom) (ID: $($entreprise.id))" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "❌ Erreur lors de la récupération: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Tests terminés!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan

# Instructions pour l'utilisateur
Write-Host "`n📌 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Vérifiez l'interface agent sur http://localhost:3001" -ForegroundColor White
Write-Host "2. Consultez l'onglet 'Mes demandes assignées'" -ForegroundColor White
Write-Host "3. Vérifiez que la demande $EntrepriseId y apparaît" -ForegroundColor White
