@echo off
REM Script de rebuild et déploiement de l'agent InvestMali pour Windows
REM Ce script corrige le problème CORS en forçant les URLs relatives

echo 🚀 Début du rebuild de l'agent InvestMali...

REM Aller dans le dossier de l'agent
cd frontend\investmali-agent

echo 📦 Installation des dépendances...
call npm install

echo 🔧 Configuration pour la production...
REM S'assurer que NODE_ENV est en production
set NODE_ENV=production

echo 🏗️ Build de l'application...
call npm run build

echo ✅ Build terminé !
echo.
echo 📋 Actions à effectuer sur le serveur :
echo 1. Copier le contenu du dossier 'build/' vers /var/www/frontend/api_agent/build/
echo 2. Modifier /etc/nginx/sites-available/api_agent :
echo    - Changer 'location /api/' en 'location /api/v1/'
echo    - Changer 'proxy_pass http://127.0.0.1:8080;' en 'proxy_pass http://127.0.0.1:8080/api/v1/;'
echo 3. Tester nginx : sudo nginx -t
echo 4. Recharger nginx : sudo systemctl reload nginx
echo.
echo 🔍 Test après déploiement :
echo Ouvrir https://investmali-agent.abdatytch.com
echo Console F12 → fetch('/api/v1/health').then(r =^> r.json()).then(console.log)
echo.
echo ✨ L'agent devrait maintenant fonctionner sans erreur CORS !

pause
