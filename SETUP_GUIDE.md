# 🚀 KAVACH AI Pro - Setup Guide

## ⚡ Quick Start

### Option A: Docker (Recommended)
```bash
# Start all services
docker-compose up -d --build

# Check status
docker-compose ps

# Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option B: Manual (Development)

#### Step 1: Start Database Services
```bash
# PostgreSQL
docker run -d --name kavach-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=kavach \
  -p 5432:5432 postgres:15-alpine

# Redis
docker run -d --name kavach-redis -p 6379:6379 redis:7-alpine
```

#### Step 2: Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
cp .env.example .env

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Step 3: Frontend
```bash
cd frontend
npm install
npm start
```

---

## ✅ Verify Everything Works

| Check | URL | Expected |
|-------|-----|----------|
| Health | http://localhost:8000/health | `{"status": "healthy"}` |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:3000 | Dashboard page |

---

## 🔍 What Services Run

| Service | Port | Purpose |
|---------|------|---------|
| **FastAPI** | 8000 | Backend API + AI inference |
| **React** | 3000 | Frontend dashboard |
| **PostgreSQL** | 5432 | Database (users, detections, audit logs) |
| **Redis** | 6379 | Cache & rate limiting (optional — app works without it) |

---

## 🎯 First Detection

### Deepfake Check
1. Go to **Detection** tab
2. Select **Deepfake Video**
3. Upload a `.mp4` video file
4. Wait for EfficientNet + OpenCV analysis
5. View results with confidence gauge & radar chart

### Voice Check
1. Select **Voice Analysis**
2. Upload a `.wav` or `.mp3` audio file
3. Spectral analysis runs (MFCCs, flatness, centroid)
4. View results

### Phishing Check
1. Select **Phishing URL**
2. Enter a URL, e.g. `http://paypal-login.tk/verify`
3. 25+ heuristic rules analyze the URL
4. View threat breakdown

---

## 🔧 Troubleshooting

### "Docker not found"
- **Windows/Mac**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: `sudo apt install docker.io docker-compose`

### "Port already in use"
```bash
# Check what's using port 8000
netstat -ano | findstr :8000    # Windows
lsof -i :8000                  # macOS/Linux

# Kill the process or use different port
```

### "Database connection failed"
```bash
# Restart containers
docker restart kavach-postgres kavach-redis

# Or recreate
docker rm -f kavach-postgres kavach-redis
# Then run the docker run commands again
```

### "Models not found"
The AI models should be in `models/pretrained/`. Run training scripts if needed:
```bash
cd training
python train_phishing.py       # Generates phishing model
# python train_voice.py        # Needs real audio dataset
# python train_deepfake.py     # Needs face image dataset
```

---

## 🛑 Stop/Restart

```bash
# Docker Compose
docker-compose down            # Stop
docker-compose up -d           # Start
docker-compose down -v         # Reset (deletes data)

# Manual containers
docker stop kavach-postgres kavach-redis
docker start kavach-postgres kavach-redis
```

---

**Happy Detecting! 🛡️**
