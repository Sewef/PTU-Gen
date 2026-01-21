#!/bin/bash
# Script de déploiement sur Render.com

echo "📦 PTU Pokemon Generator - Préparation au déploiement"
echo "=================================================="

# Vérifier Node.js
echo "✓ Node.js version:"
node --version

# Installer les dépendances
echo "📥 Installation des dépendances..."
npm install

# Test rapide
echo "🧪 Exécution des tests..."
node tests/test.js

echo ""
echo "✅ Prêt pour le déploiement!"
echo ""
echo "Prochaines étapes:"
echo "1. Poussez ce code vers votre repository GitHub"
echo "2. Allez sur https://render.com"
echo "3. Créez un nouveau Web Service et connectez ce repository"
echo "4. Build Command: npm install"
echo "5. Start Command: npm start"
echo ""
