"""
KAVACH AI Pro - Voice Anti-Spoofing Model Training
Train Gradient Boosting classifier on audio spectral features

DATASETS (All Free):
- Fake-or-Real dataset: https://www.kaggle.com/datasets/mohammedabdeldayem/the-fake-or-real-dataset
- ASVspoof2019 LA: https://datashare.ed.ac.uk/handle/10283/3336

USAGE:
  1. Download dataset to data/fake-or-real/ (with real/ and fake/ subdirs)
  2. Run: python train_voice.py
  3. Output: models/pretrained/voice_antispoofing.pkl

NOTE: If no dataset is found, the script will exit with instructions.
      The model requires real audio data to produce meaningful results.
      A pre-trained model is included in models/pretrained/ for demo purposes.
"""
import os, sys, numpy as np, joblib
from pathlib import Path


def extract_features(audio_path, sr=16000):
    """Extract 89 spectral features from audio file using librosa"""
    import librosa
    y, sr = librosa.load(audio_path, sr=sr, duration=10)
    if len(y) < sr: y = np.pad(y, (0, sr - len(y)))

    features = []
    # MFCCs (13 coefficients × 4 stats = 52)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    for mfcc in mfccs:
        features.extend([np.mean(mfcc), np.std(mfcc), np.min(mfcc), np.max(mfcc)])

    # Spectral features (5 × 2 stats = 10)
    for feat_fn in [librosa.feature.spectral_centroid, librosa.feature.spectral_bandwidth,
                    librosa.feature.spectral_rolloff, librosa.feature.spectral_flatness,
                    librosa.feature.zero_crossing_rate]:
        f = feat_fn(y=y, sr=sr) if 'sr' in feat_fn.__code__.co_varnames else feat_fn(y=y)
        features.extend([float(np.mean(f)), float(np.std(f))])

    # Chroma (12 × 2 = 24)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    for c in chroma:
        features.extend([np.mean(c), np.std(c)])

    # RMS energy (2)
    rms = librosa.feature.rms(y=y)
    features.extend([float(np.mean(rms)), float(np.std(rms))])

    # Tempo (1)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    features.append(float(tempo) if np.isscalar(tempo) else float(tempo[0]))

    return np.array(features, dtype=np.float32)  # 89 features total


def train_from_directory(dataset_path):
    """Train from a directory with real/ and fake/ subdirectories"""
    print("📊 Extracting features from audio files...")
    X, y = [], []

    for label, folder in [(0, 'real'), (1, 'fake')]:
        folder_path = Path(dataset_path) / folder
        if not folder_path.exists():
            print(f"  ⚠️ {folder_path} not found, skipping"); continue
        files = list(folder_path.glob('*.wav')) + list(folder_path.glob('*.mp3')) + list(folder_path.glob('*.flac'))
        print(f"  {folder}: {len(files)} files")
        for f in files[:500]:  # Limit for speed
            try:
                feat = extract_features(str(f))
                X.append(feat); y.append(label)
            except Exception as e:
                pass
    return np.array(X), np.array(y)


def main():
    print("="*60+"\n🛡️ KAVACH AI - Voice Anti-Spoofing Training\n"+"="*60)

    dataset_path = "data/fake-or-real/"
    if not Path(dataset_path).exists():
        print(f"\n❌ Dataset not found at {dataset_path}")
        print("\n📥 Please download a real dataset first:")
        print("   Option 1: https://www.kaggle.com/datasets/mohammedabdeldayem/the-fake-or-real-dataset")
        print("   Option 2: https://datashare.ed.ac.uk/handle/10283/3336 (ASVspoof2019)")
        print(f"\n   Extract it so you have: {dataset_path}real/ and {dataset_path}fake/")
        print("\n   A pre-trained model is already included in models/pretrained/ for demo use.")
        sys.exit(1)

    X, y = train_from_directory(dataset_path)

    if len(X) < 20:
        print(f"\n❌ Only {len(X)} samples found. Need at least 20 audio files.")
        print("   Make sure the dataset has .wav/.mp3/.flac files in real/ and fake/ folders.")
        sys.exit(1)

    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import classification_report, accuracy_score
    from sklearn.preprocessing import StandardScaler

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    print("\n🤖 Training Gradient Boosting model...")
    model = GradientBoostingClassifier(n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n📊 Accuracy: {acc*100:.1f}%")
    print(classification_report(y_test, y_pred, target_names=['Real', 'Spoofed']))

    cv = cross_val_score(model, scaler.transform(X), y, cv=5)
    print(f"   Cross-val: {cv.mean()*100:.1f}% (+/- {cv.std()*200:.1f}%)")

    save_path = Path("models/pretrained/voice_antispoofing.pkl")
    save_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({'model': model, 'scaler': scaler, 'feature_extractor': 'extract_features',
                 'accuracy': acc, 'n_features': 89, 'version': '2.0.0'}, save_path)
    print(f"\n✅ Saved to {save_path} ({save_path.stat().st_size/1024:.0f} KB)")

if __name__ == "__main__": main()
