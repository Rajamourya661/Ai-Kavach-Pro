"""
KAVACH AI Pro - Phishing Model Training Script
Trains XGBoost classifier on URL structural features.

TRAINING DATA: This script generates training URLs from known phishing
patterns (suspicious TLDs, IP-based URLs, brand impersonation, etc.) and
legitimate domain patterns. The model learns URL structural features —
NOT content. For production use, augment with real datasets:
  - PhishTank: https://phishtank.org/developer_info.php
  - OpenPhish: https://openphish.com/
  - Kaggle: https://www.kaggle.com/datasets/shashwatwork/phishing-dataset-for-machine-learning

Run: python train_phishing.py
Output: models/pretrained/phishing_xgb.pkl
"""

import os
import sys
import numpy as np
import joblib
from pathlib import Path

def install_dependencies():
    """Install required packages if missing"""
    try:
        import xgboost
        import sklearn
    except ImportError:
        print("Installing dependencies...")
        os.system(f"{sys.executable} -m pip install xgboost scikit-learn joblib")
        print("Dependencies installed!")


def extract_url_features(url: str) -> list:
    """Extract 20 features from a URL for classification"""
    import re
    import math
    from urllib.parse import urlparse

    parsed = urlparse(url if '://' in url else f'http://{url}')
    domain = parsed.netloc.lower()
    path = parsed.path.lower()

    # Feature extraction
    features = []

    # 1. URL length
    features.append(len(url))

    # 2. Domain length
    features.append(len(domain))

    # 3. Path length
    features.append(len(path))

    # 4. Number of dots
    features.append(url.count('.'))

    # 5. Number of hyphens
    features.append(url.count('-'))

    # 6. Number of underscores
    features.append(url.count('_'))

    # 7. Number of slashes
    features.append(url.count('/'))

    # 8. Number of query parameters
    features.append(url.count('?') + url.count('&'))

    # 9. Has @ symbol
    features.append(1 if '@' in url else 0)

    # 10. Has IP address
    features.append(1 if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain.split(':')[0]) else 0)

    # 11. Is HTTPS
    features.append(1 if parsed.scheme == 'https' else 0)

    # 12. Subdomain count
    features.append(max(0, len(domain.split('.')) - 2))

    # 13. Path depth
    features.append(len([p for p in path.split('/') if p]))

    # 14. Number of digits in URL
    features.append(sum(c.isdigit() for c in url))

    # 15. Number of special characters
    features.append(len(re.findall(r'[%~\|\\{}^`\[\]!#$]', url)))

    # 16. URL entropy
    if url:
        freq = {}
        for c in url:
            freq[c] = freq.get(c, 0) + 1
        length = len(url)
        entropy = -sum((count / length) * math.log2(count / length) for count in freq.values())
        features.append(entropy)
    else:
        features.append(0)

    # 17. Has suspicious TLD
    suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.buzz', '.click', '.link']
    features.append(1 if any(domain.endswith(tld) for tld in suspicious_tlds) else 0)

    # 18. Has port number
    features.append(1 if ':' in domain and not domain.endswith((':443', ':80')) else 0)

    # 19. Contains suspicious keywords
    suspicious_words = ['login', 'verify', 'secure', 'account', 'update', 'confirm', 'banking', 'password']
    features.append(sum(1 for w in suspicious_words if w in url.lower()))

    # 20. Domain has numbers
    domain_name = domain.split('.')[0] if domain else ''
    features.append(sum(c.isdigit() for c in domain_name))

    return features


def generate_training_data():
    """
    Generate training data from known phishing and legitimate URL patterns.
    In a production system, you'd use a real dataset like PhishTank or OpenPhish.
    This generates realistic synthetic data based on known phishing characteristics.
    """
    print("📊 Generating training dataset...")

    np.random.seed(42)

    # Legitimate URL patterns
    legit_domains = [
        'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com',
        'twitter.com', 'linkedin.com', 'github.com', 'stackoverflow.com', 'reddit.com',
        'wikipedia.org', 'youtube.com', 'netflix.com', 'spotify.com', 'dropbox.com',
        'medium.com', 'wordpress.com', 'adobe.com', 'mozilla.org', 'python.org',
        'numpy.org', 'pytorch.org', 'tensorflow.org', 'fastapi.tiangolo.com',
        'docs.python.org', 'developer.mozilla.org', 'news.ycombinator.com',
    ]

    legit_paths = [
        '/', '/about', '/contact', '/login', '/home', '/products', '/docs',
        '/blog', '/help', '/support', '/pricing', '/features', '/api/v1',
        '/dashboard', '/settings', '/profile', '/search?q=hello',
    ]

    # Phishing URL patterns
    phish_domains = [
        'paypal-secure-login.tk', 'google-verify.ml', 'amazon-account-update.xyz',
        'microsoft-365-login.cf', 'apple-id-verify.gq', 'netflix-billing.buzz',
        'facebook-security.click', 'linkedin-confirm.top', 'banking-secure.tk',
        'account-verify-now.ml', 'secure-paypal.xyz', 'update-your-account.cf',
        'verify-identity.gq', 'urgent-action.buzz', 'confirm-payment.click',
        '192.168.1.1', '10.0.0.1', '172.16.0.1',
        'secure-login-verify.tk', 'google.com.verify-account.ml',
        'paypal.com-secure.xyz', 'amazon.com-order-confirm.cf',
        'www.microsoft-verify.ml', 'appleid-update.gq',
        'facebook-security-alert.buzz', 'instagram-verify.click',
    ]

    phish_paths = [
        '/login.php', '/verify?id=12345&token=abc', '/account/update',
        '/secure/confirm.html', '/@user/verify', '/wp-admin/login.php',
        '/cgi-bin/login', '/index.php?action=verify&user=admin',
        '/signin/confirm?urgent=true', '/auth/reset-password',
        '/billing/update?session=expired', '/security/verify-identity',
    ]

    urls = []
    labels = []

    # Generate legitimate URLs
    for _ in range(2000):
        domain = np.random.choice(legit_domains)
        path = np.random.choice(legit_paths)
        scheme = 'https' if np.random.random() > 0.1 else 'http'
        url = f"{scheme}://{domain}{path}"
        urls.append(url)
        labels.append(0)

    # Generate phishing URLs
    for _ in range(2000):
        domain = np.random.choice(phish_domains)
        path = np.random.choice(phish_paths)
        scheme = 'http' if np.random.random() > 0.3 else 'https'
        url = f"{scheme}://{domain}{path}"
        urls.append(url)
        labels.append(1)

    # Extract features
    print(f"   Extracting features from {len(urls)} URLs...")
    X = np.array([extract_url_features(url) for url in urls])
    y = np.array(labels)

    # Shuffle
    indices = np.random.permutation(len(X))
    X = X[indices]
    y = y[indices]

    return X, y


def train_model(X, y):
    """Train XGBoost classifier with cross-validation"""
    from xgboost import XGBClassifier
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import classification_report, accuracy_score, f1_score

    print("\n🤖 Training XGBoost model...")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train model
    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss',
        use_label_encoder=False
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    print(f"\n📊 Results:")
    print(f"   Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"   F1 Score: {f1:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing'])}")

    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"   Cross-validation: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

    # Feature importance
    feature_names = [
        'url_length', 'domain_length', 'path_length', 'num_dots', 'num_hyphens',
        'num_underscores', 'num_slashes', 'num_query_params', 'has_at', 'has_ip',
        'is_https', 'subdomain_count', 'path_depth', 'num_digits', 'num_special',
        'url_entropy', 'suspicious_tld', 'has_port', 'suspicious_keywords', 'domain_digits'
    ]
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    print("\n📈 Top 10 Features:")
    for i in range(min(10, len(sorted_idx))):
        idx = sorted_idx[i]
        print(f"   {i+1}. {feature_names[idx]}: {importances[idx]:.4f}")

    return model, accuracy, f1


def main():
    print("=" * 60)
    print("🛡️  KAVACH AI Pro - Phishing Model Training")
    print("=" * 60)

    install_dependencies()

    # Generate data
    X, y = generate_training_data()

    # Train
    model, accuracy, f1 = train_model(X, y)

    # Save model
    model_dir = Path("models/pretrained")
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "phishing_xgb.pkl"

    # Save model + feature extractor
    joblib.dump({
        'model': model,
        'feature_extractor': extract_url_features,
        'accuracy': accuracy,
        'f1_score': f1,
        'version': '2.0.0',
        'features': 20
    }, model_path)

    print(f"\n✅ Model saved to {model_path}")
    print(f"   Size: {model_path.stat().st_size / 1024:.1f} KB")
    print(f"\n🚀 Done! Phishing detection model is ready.")


if __name__ == "__main__":
    main()
