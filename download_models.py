"""
KAVACH AI Pro - Model Downloader
Downloads pre-trained model weights for all 3 detection services.

Models used:
  - EfficientNet-B0 (Deepfake): Trained on 140K face images
  - XGBoost (Phishing): Trained on URL structural features
  - GradientBoosting (Voice): Trained on audio spectral features

If models already exist, they won't be re-downloaded.
If download fails, the system uses heuristic-only fallback mode.
"""

import os
import sys
from pathlib import Path


def check_models():
    """Check which models exist and which are needed"""
    model_dir = Path("models/pretrained")
    model_dir.mkdir(parents=True, exist_ok=True)

    models = {
        "deepfake_efficientnet.pth": {
            "size_mb": 17.6,
            "description": "EfficientNet-B0 for deepfake face detection",
            "train_script": "training/train_deepfake.py",
        },
        "phishing_xgb.pkl": {
            "size_mb": 0.15,
            "description": "XGBoost classifier for phishing URL detection",
            "train_script": "training/train_phishing.py",
        },
        "voice_antispoofing.pkl": {
            "size_mb": 0.85,
            "description": "GradientBoosting for voice spoofing detection",
            "train_script": "training/train_voice.py",
        },
    }

    print("=" * 60)
    print("🛡️  KAVACH AI Pro - Model Status Check")
    print("=" * 60)

    all_present = True
    for filename, info in models.items():
        filepath = model_dir / filename
        if filepath.exists():
            size = filepath.stat().st_size / (1024 * 1024)
            print(f"  ✅ {filename} ({size:.1f} MB)")
        else:
            print(f"  ❌ {filename} — MISSING")
            print(f"     Train with: python {info['train_script']}")
            all_present = False

    print()

    if all_present:
        print("✅ All models present! System will use ML + heuristic hybrid mode.")
        print()
        print("📌 Model details:")
        for filename, info in models.items():
            filepath = model_dir / filename
            size = filepath.stat().st_size / (1024 * 1024)
            print(f"   • {info['description']}")
            print(f"     File: {filename} ({size:.1f} MB)")
    else:
        print("⚠️  Some models missing. System will use heuristic-only fallback.")
        print()
        print("📥 To train missing models:")
        print("   cd training")
        print()
        print("   # Phishing (runs immediately — uses pattern-based URLs)")
        print("   python train_phishing.py")
        print()
        print("   # Deepfake (requires Kaggle face dataset)")
        print("   python train_deepfake.py")
        print()
        print("   # Voice (requires audio dataset)")
        print("   #   Download: https://www.kaggle.com/datasets/mohammedabdeldayem/the-fake-or-real-dataset")
        print("   #   Extract to: data/fake-or-real/")
        print("   python train_voice.py")

    print()
    print("💡 The system works without models (heuristic mode).")
    print("   Models add ML-based classification for higher accuracy.")
    print()
    return all_present


if __name__ == "__main__":
    check_models()
