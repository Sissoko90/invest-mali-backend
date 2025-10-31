@echo off
echo ========================================
echo   DEPLOIEMENT PRODUCTION API-INVEST
echo ========================================
echo.

echo 1. Configuration de l'application Agent...
cd frontend\investmali-agent

echo    - Copie de .env.production vers .env
copy .env.production .env

echo    - Verification de la configuration:
type .env
echo.

echo 2. Configuration CORS Backend...
cd ..\..\

echo    Configuration requise dans application.yml:
echo    app:
echo      cors:
echo        allowed-origins: ^>
echo          https://investmali.abdatytch.com,
echo          https://investmali-agent.abdatytch.com
echo.

echo 3. URLs de production configurees:
echo    - Application Utilisateur: https://investmali.abdatytch.com
echo    - Application Agent:       https://investmali-agent.abdatytch.com
echo    - API Backend:             https://investmali.abdatytch.com/api/v1
echo.

echo ========================================
echo   DEPLOIEMENT TERMINE
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Redemarrer l'application agent: cd frontend\investmali-agent ^&^& npm start
echo 2. Mettre a jour application.yml avec la config CORS ci-dessus
echo 3. Redemarrer le backend Spring Boot
echo.

pause
