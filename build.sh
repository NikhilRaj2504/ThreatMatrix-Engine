#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "📦 Building Frontend UI..."
cd frontend
npm install
npm run build
cd ..

echo "🐍 Installing Backend Python Dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "✅ Build Complete! Ready for Render deployment."
