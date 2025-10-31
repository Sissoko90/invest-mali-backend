@echo off
echo Configuration de l'environnement pour l'application Agent...

cd frontend\investmali-agent

echo Copie du fichier .env.production vers .env...
copy .env.production .env

echo Verification du fichier .env cree:
type .env

echo.
echo Configuration terminee!
echo Vous pouvez maintenant demarrer l'application agent avec: npm start
echo L'application sera accessible sur: http://localhost:3001

pause
