@echo off
echo ========================================
echo   BUILD PRODUCTION - APPLICATION AGENT
echo ========================================

echo Configuration des variables d'environnement...
set REACT_APP_USER_API_URL=https://investmali.abdatytch.com/api/v1
set REACT_APP_DEBUG_API=false
set NODE_ENV=production
set GENERATE_SOURCEMAP=false

echo Variables configurees:
echo   REACT_APP_USER_API_URL=%REACT_APP_USER_API_URL%
echo   NODE_ENV=%NODE_ENV%

echo.
echo Lancement du build...
npm run build

echo.
echo ========================================
echo   BUILD TERMINE
echo ========================================
echo.
echo Prochaine etape: Deployer le contenu du dossier build/
echo   scp -r .\build\* root@72.61.145.76:/var/www/frontend/api_agent/build/

pause
