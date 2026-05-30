# 🛡️ KAVACH AI Pro

### AI-Powered Deepfake, Voice Spoofing & Phishing Detection Platform

KAVACH AI Pro is a full-stack cybersecurity platform designed to detect modern social-engineering threats using Machine Learning and heuristic analysis.

### Key Features

* 🎭 Deepfake Video Detection
* 🎙️ Voice Anti-Spoofing Analysis
* 🎣 Phishing URL Detection
* 📊 Real-Time Security Dashboard
* 🔐 JWT Authentication & RBAC
* 📑 PDF Report Generation
* ⚡ FastAPI + React Architecture
* 🐳 Docker Deployment Support

## Tech Stack

**Backend**

* FastAPI
* PostgreSQL
* Redis
* SQLAlchemy

**Frontend**

* React 18
* Tailwind CSS
* Zustand

**AI / ML**

* PyTorch
* OpenCV
* Librosa
* XGBoost
* Scikit-Learn

## Architecture

See architecture diagram below.
```mermaid
flowchart TD

A[User] --> B[React Dashboard]

B --> C[FastAPI Backend]

C --> D[Deepfake Detection]
C --> E[Voice Anti-Spoofing]
C --> F[Phishing Detection]

D --> G[PyTorch + OpenCV]
E --> H[Librosa + ML]
F --> I[XGBoost + Heuristics]

C --> J[(PostgreSQL)]
C --> K[(Redis)]

C --> L[PDF Report Engine]

L --> M[Detection Reports]
```


## Screenshots
<img width="1920" height="1080" alt="SS5_Analytics_Dashboard" src="https://github.com/user-attachments/assets/3c4f50f7-b652-45b8-9411-8fe68bd86161" />




## Installation

```bash
docker-compose up -d --build
```

## License

MIT License
