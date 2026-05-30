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

<img width="1846" height="923" alt="SS3_Dashboard" src="https://github.com/user-attachments/assets/9b343c8e-16d7-44d0-8c86-1d52d24cb321" />
<img width="1140" height="717" alt="SS4_NLP_Notification" src="https://github.com/user-attachments/assets/c5158021-c6ea-47ad-b264-d96b454f62f8" />
<img width="1073" height="848" alt="SS1_Deepfake_Detection_Result" src="https://github.com/user-attachments/assets/21212d2e-8d57-433a-8e58-ff15d82cc5a9" />
<img width="1840" height="918" alt="SS5_Analytics_Dashboard" src="https://github.com/user-attachments/assets/14981d39-2c08-4b11-bc4b-e9dd5b597cb0" />




## Installation

```bash
docker-compose up -d --build
```

## License

MIT License
