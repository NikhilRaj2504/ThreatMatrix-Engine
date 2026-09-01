#!/usr/bin/env bash
set -o errexit

echo "📦 1. Building React Frontend UI..."
cd frontend
npm install --no-audit --no-fund
npm run build
cd ..

echo "🐍 2. Installing Backend Python Dependencies (Pre-built Binaries)..."
python -m pip install --upgrade pip setuptools wheel
python -m pip install --prefer-binary --no-cache-dir -r backend/requirements.txt

echo "✨ 3. Render Build Succeeded 100%!"
