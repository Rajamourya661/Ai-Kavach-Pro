# ✅ KAVACH AI Pro - Setup Checklist

## Pre-Setup
- [ ] Docker Desktop installed (`docker --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.11+ installed (`python --version`)
- [ ] 8GB RAM available
- [ ] 5GB disk space free

## Step 1: Start Databases
- [ ] PostgreSQL running (`docker ps` shows kavach-postgres)
- [ ] Redis running (`docker ps` shows kavach-redis)

## Step 2: Backend
- [ ] Virtual environment created (`python -m venv venv`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file exists (`cp .env.example .env`)
- [ ] Server starts (`uvicorn app.main:app --port 8000`)
- [ ] Health check passes: http://localhost:8000/health

## Step 3: Frontend
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server starts (`npm start`)
- [ ] Dashboard loads: http://localhost:3000

## Step 4: Test Detection
- [ ] Upload video → Deepfake analysis works
- [ ] Upload audio → Voice analysis works
- [ ] Enter URL → Phishing analysis works
- [ ] Results saved to History page
- [ ] PDF report downloads correctly

## Step 5: Verify
- [ ] API Docs accessible: http://localhost:8000/docs
- [ ] Dashboard shows real stats from backend
- [ ] Landing page loads: http://localhost:3000/landing
- [ ] Login/Register pages work: http://localhost:3000/login

## 🎉 Done!
- [ ] Detecting deepfakes ✅
- [ ] Detecting fake voices ✅
- [ ] Detecting phishing URLs ✅
