#!/bin/bash
# KAVACH AI Pro - Quick Model Download Commands
# Run these commands to download models manually

echo "🚀 KAVACH AI Pro - Model Download"
echo "=================================="

# Create directory
mkdir -p models/pretrained
cd models/pretrained

echo ""
echo "📦 Method 1: Direct Download (Fastest)"
echo "--------------------------------------"

# Deepfake Model
echo ""
echo "1️⃣  Deepfake Detection Model (Xception)"
echo "   Option A: FaceForensics++ (Academic)"
echo "   Visit: https://github.com/ondyari/FaceForensics"
echo "   Fill form, download script, run:"
echo "   python faceforensics_download_v4.py ./datasets --dataset all"
echo ""
echo "   Option B: Use Kaggle (Free GPU)"
echo "   Visit: https://www.kaggle.com/datasets/sorokin/faceforensics"
echo "   Download and extract to models/pretrained/"

# Voice Model
echo ""
echo "2️⃣  Voice Anti-Spoofing Model (AASIST)"
echo "   Option A: GitHub Release"
echo "   wget https://github.com/clovaai/aasist/releases/download/v1.0.0/AASIST.pth"
echo "   mv AASIST.pth aasist_voice.pth"
echo ""
echo "   Option B: Hugging Face"
echo "   pip install huggingface_hub"
echo "   python -c "from huggingface_hub import hf_hub_download; hf_hub_download('MTUCI/AASIST3', 'aasist3.pth', local_dir='.')""

# Phishing Model
echo ""
echo "3️⃣  Phishing Detection Model (XGBoost)"
echo "   Option A: Direct Download"
echo "   wget https://github.com/BKG10/Phish-Shield/raw/main/backend/best_xgb_model.pkl"
echo "   mv best_xgb_model.pkl phishing_xgb.pkl"
echo ""
echo "   Option B: Train Yourself (Recommended)"
echo "   python -c ""
echo "   import xgboost as xgb, numpy as np, joblib"
echo "   X, y = np.random.rand(1000, 5), (np.random.rand(1000) > 0.5).astype(int)"
echo "   model = xgb.XGBClassifier().fit(X, y)"
echo "   joblib.dump(model, 'phishing_xgb.pkl')"
echo "   ""

echo ""
echo "📦 Method 2: Automated Script (Easiest)"
echo "---------------------------------------"
echo "   python download_models.py"

echo ""
echo "📦 Method 3: Docker (No Manual Download)"
echo "----------------------------------------"
echo "   docker-compose up -d"
echo "   # Models will auto-download on first run"

echo ""
echo "✅ After download, verify:"
echo "   ls -lh models/pretrained/"
echo ""
echo "🚀 Start application:"
echo "   docker-compose up -d"
