FROM python:3.11-slim

# Install Node.js for building React frontend
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --no-audit

COPY frontend ./frontend
RUN cd frontend && npm run build

# 2. Install Backend Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --prefer-binary -r backend/requirements.txt

# 3. Copy Backend application source
COPY backend ./backend

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
