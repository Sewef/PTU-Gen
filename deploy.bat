@echo off
REM Script de déploiement sur Render.com pour Windows

echo 📦 PTU Pokemon Generator - Preparation au deploiement
echo ==================================================

REM Verifier Node.js
echo ✓ Node.js version:
node --version

REM Installer les dependances
echo 📥 Installation des dependances...
call npm install

REM Test rapide
echo 🧪 Execution des tests...
node tests\test.js

echo.
echo ✅ Pret pour le deploiement!
echo.
echo Prochaines etapes:
echo 1. Poussez ce code vers votre repository GitHub
echo 2. Allez sur https://render.com
echo 3. Creez un nouveau Web Service et connectez ce repository
echo 4. Build Command: npm install
echo 5. Start Command: npm start
echo.
pause
