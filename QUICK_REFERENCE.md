# 🛡️ KAVACH AI Pro - Quick Reference

## URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| Login | http://localhost:3000/login |
| Landing Page | http://localhost:3000/landing |

## API Endpoints
```bash
# Detection (no auth needed in demo mode)
POST /api/v1/detect/deepfake   # Upload video file
POST /api/v1/detect/voice      # Upload audio file
POST /api/v1/detect/phishing   # Send URL

# Stats & History
GET  /api/v1/stats             # Detection statistics
GET  /api/v1/history           # Paginated history

# Auth (optional)
POST /api/v1/auth/register     # Create account
POST /api/v1/auth/login        # Get JWT token
GET  /api/v1/auth/me           # Current user profile

# Admin
GET  /api/v1/admin/stats       # System stats
GET  /api/v1/admin/users       # User list
GET  /api/v1/admin/audit-logs  # Audit trail
```

## Commands
```bash
# Start databases
docker start kavach-postgres kavach-redis

# Start backend
cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload

# Start frontend
cd frontend && npm start

# Run tests
cd backend && python -m pytest tests/ -v

# Stop databases
docker stop kavach-postgres kavach-redis
```

## AI Models
| Model | File | Size | Detection |
|-------|------|------|-----------|
| EfficientNet-B0 | `deepfake_efficientnet.pth` | 17.6 MB | Deepfake video |
| XGBoost | `phishing_xgb.pkl` | 156 KB | Phishing URLs |
| GradientBoosting | `voice_antispoofing.pkl` | 865 KB | Voice spoofing |

## Tech Stack
FastAPI · React 18 · PostgreSQL 15 · Redis 7 · PyTorch · librosa · XGBoost · OpenCV · Tailwind CSS · Zustand
