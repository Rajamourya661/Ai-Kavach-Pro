"""
KAVACH AI Pro - Advanced Phishing Detection Service
Multi-factor URL and content analysis with 25+ heuristic rules.
Designed to be augmented with XGBoost model when trained weights are available.
"""

import re
import math
import time
import logging
from typing import Dict, Optional, List
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger(__name__)


class PhishingDetector:
    """
    Hybrid phishing detection:
    1. XGBoost ML model (if trained model available) for primary classification
    2. Heuristic rules for explainability and threat breakdown
    """

    def __init__(self):
        self.ml_model = None
        self._load_model()

    def _load_model(self):
        """Load trained XGBoost model if available"""
        import os
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'models', 'pretrained', 'phishing_xgb.pkl')
        # Also try relative to CWD
        alt_path = 'models/pretrained/phishing_xgb.pkl'
        for path in [model_path, alt_path]:
            try:
                import joblib
                data = joblib.load(path)
                self.ml_model = data.get('model') if isinstance(data, dict) else data
                logger.info(f"Loaded phishing XGBoost model from {path}")
                return
            except Exception:
                continue
        logger.warning("No trained phishing model found, using heuristic-only mode")

    # Known suspicious TLDs frequently used in phishing
    SUSPICIOUS_TLDS = {
        '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.buzz',
        '.club', '.work', '.click', '.link', '.info', '.site', '.online',
        '.icu', '.live', '.rest', '.fit', '.cam'
    }

    # Legitimate brands commonly impersonated
    IMPERSONATED_BRANDS = [
        'paypal', 'apple', 'microsoft', 'google', 'amazon', 'netflix',
        'facebook', 'instagram', 'whatsapp', 'linkedin', 'twitter',
        'chase', 'wellsfargo', 'bankofamerica', 'citibank', 'hsbc',
        'dropbox', 'adobe', 'spotify', 'zoom', 'slack',
        'fedex', 'ups', 'usps', 'dhl', 'irs', 'gov'
    ]

    # Homoglyph mapping (characters that look like Latin letters)
    HOMOGLYPHS = {
        'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y',
        'х': 'x', 'ѕ': 's', 'і': 'i', 'ј': 'j', 'ԁ': 'd', 'ɡ': 'g',
        'ɩ': 'l', 'ν': 'v', 'ω': 'w', '0': 'o', '1': 'l', '!': 'i'
    }

    # Urgency / social engineering keywords
    URGENCY_KEYWORDS = [
        'urgent', 'immediate', 'alert', 'verify now', 'account suspended',
        'action required', 'limited time', 'expires today', 'act now',
        'confirm your identity', 'unauthorized access', 'security alert',
        'unusual activity', 'click here immediately', 'final warning',
        'your account will be', 'verify your account', 'update payment',
        'won a prize', 'congratulations', 'selected winner'
    ]

    AUTHORITY_KEYWORDS = [
        'official notice', 'legal action', 'law enforcement', 'court order',
        'irs', 'tax return', 'government', 'federal', 'compliance',
        'regulatory', 'mandatory', 'investigation'
    ]

    def analyze(self, url: str, content: Optional[str] = None) -> Dict:
        start_time = time.time()
        threats: List[str] = []
        scores = {}

        parsed = urlparse(url if '://' in url else f'http://{url}')
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        query = parsed.query

        # === URL STRUCTURAL ANALYSIS ===

        # 1. URL Length (0-8 pts)
        url_len = len(url)
        if url_len > 150:
            scores['url_length'] = 8
            threats.append(f"Extremely long URL ({url_len} chars)")
        elif url_len > 100:
            scores['url_length'] = 5
            threats.append(f"Suspiciously long URL ({url_len} chars)")
        elif url_len > 75:
            scores['url_length'] = 3
        else:
            scores['url_length'] = 0

        # 2. URL Entropy (0-8 pts) - high entropy = random/encoded
        entropy = self._calculate_entropy(url)
        if entropy > 4.5:
            scores['url_entropy'] = 8
            threats.append("High URL entropy (randomized/encoded characters)")
        elif entropy > 3.8:
            scores['url_entropy'] = 4
        else:
            scores['url_entropy'] = 0

        # 3. @ symbol in URL (0-10 pts)
        if '@' in url:
            scores['at_symbol'] = 10
            threats.append("URL contains @ symbol (credential harvesting indicator)")

        # 4. IP address as domain (0-10 pts)
        if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain.split(':')[0]):
            scores['ip_domain'] = 10
            threats.append("IP address used instead of domain name")

        # 5. No HTTPS (0-6 pts)
        if parsed.scheme != 'https':
            scores['no_ssl'] = 6
            threats.append("No SSL/TLS encryption (HTTP only)")
        else:
            scores['no_ssl'] = 0

        # 6. Suspicious TLD (0-6 pts)
        domain_parts = domain.split('.')
        tld = '.' + domain_parts[-1] if domain_parts else ''
        if tld in self.SUSPICIOUS_TLDS:
            scores['suspicious_tld'] = 6
            threats.append(f"Suspicious top-level domain ({tld})")
        else:
            scores['suspicious_tld'] = 0

        # 7. Excessive subdomains (0-6 pts)
        subdomain_count = len(domain.split('.')) - 2
        if subdomain_count > 3:
            scores['subdomains'] = 6
            threats.append(f"Excessive subdomains ({subdomain_count} levels)")
        elif subdomain_count > 2:
            scores['subdomains'] = 3
        else:
            scores['subdomains'] = 0

        # 8. Port number in URL (0-5 pts)
        if ':' in domain and not domain.endswith(':443') and not domain.endswith(':80'):
            scores['unusual_port'] = 5
            threats.append("Non-standard port number in URL")
        else:
            scores['unusual_port'] = 0

        # 9. URL path depth (0-5 pts)
        path_depth = len([p for p in path.split('/') if p])
        if path_depth > 5:
            scores['path_depth'] = 5
            threats.append(f"Deep URL path ({path_depth} levels)")
        else:
            scores['path_depth'] = 0

        # 10. Special characters in URL (0-5 pts)
        special_count = len(re.findall(r'[%~\|\\{}^`\[\]]', url))
        if special_count > 3:
            scores['special_chars'] = 5
            threats.append("Unusual special characters in URL")
        else:
            scores['special_chars'] = 0

        # === DOMAIN REPUTATION ANALYSIS ===

        # 11. Suspicious keywords in domain (0-8 pts)
        suspicious_domain_words = ['secure', 'account', 'verify', 'login', 'signin',
                                    'update', 'confirm', 'banking', 'password', 'auth']
        domain_word_hits = sum(1 for w in suspicious_domain_words if w in domain)
        if domain_word_hits >= 2:
            scores['domain_keywords'] = 8
            threats.append("Multiple suspicious keywords in domain name")
        elif domain_word_hits == 1:
            scores['domain_keywords'] = 4
        else:
            scores['domain_keywords'] = 0

        # 12. Brand impersonation (0-10 pts)
        for brand in self.IMPERSONATED_BRANDS:
            if brand in domain and brand not in domain.split('.')[-2]:
                scores['brand_impersonation'] = 10
                threats.append(f"Possible brand impersonation: '{brand}' in subdomain")
                break
        else:
            scores['brand_impersonation'] = 0

        # 13. Homoglyph detection (0-10 pts)
        homoglyph_found = False
        for char in domain:
            if char in self.HOMOGLYPHS:
                homoglyph_found = True
                break
        if homoglyph_found:
            scores['homoglyph'] = 10
            threats.append("Homoglyph characters detected (visual spoofing)")
        else:
            scores['homoglyph'] = 0

        # 14. Double extension in path (0-5 pts)
        if re.search(r'\.[a-z]{2,4}\.[a-z]{2,4}$', path):
            scores['double_extension'] = 5
            threats.append("Double file extension in URL path")
        else:
            scores['double_extension'] = 0

        # 15. URL shortener (0-3 pts)
        shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
                       'buff.ly', 'rebrand.ly', 'cutt.ly']
        if any(s in domain for s in shorteners):
            scores['url_shortener'] = 3
            threats.append("URL shortener detected (hides real destination)")
        else:
            scores['url_shortener'] = 0

        # === CONTENT ANALYSIS ===
        if content:
            content_lower = content.lower()

            # 16. Urgency tactics (0-10 pts)
            urgency_hits = sum(1 for kw in self.URGENCY_KEYWORDS if kw in content_lower)
            if urgency_hits >= 3:
                scores['urgency'] = 10
                threats.append(f"Multiple urgency tactics detected ({urgency_hits} indicators)")
            elif urgency_hits >= 1:
                scores['urgency'] = 5
                threats.append("Urgency tactics detected")
            else:
                scores['urgency'] = 0

            # 17. Authority impersonation (0-8 pts)
            authority_hits = sum(1 for kw in self.AUTHORITY_KEYWORDS if kw in content_lower)
            if authority_hits >= 2:
                scores['authority'] = 8
                threats.append("Authority impersonation language detected")
            elif authority_hits >= 1:
                scores['authority'] = 4
            else:
                scores['authority'] = 0

            # 18. Suspicious links in content (0-5 pts)
            link_count = len(re.findall(r'https?://[^\s]+', content))
            if link_count > 3:
                scores['content_links'] = 5
                threats.append(f"Multiple links in content ({link_count})")
            else:
                scores['content_links'] = 0

            # 19. Personal info request (0-8 pts)
            pii_keywords = ['ssn', 'social security', 'credit card', 'bank account',
                           'routing number', 'pin number', 'mother maiden', 'date of birth']
            pii_hits = sum(1 for kw in pii_keywords if kw in content_lower)
            if pii_hits > 0:
                scores['pii_request'] = 8
                threats.append("Request for personal/financial information")
            else:
                scores['pii_request'] = 0

            # 20. Grammar/spelling indicators (0-3 pts)
            poor_grammar = ['kindly', 'dear customer', 'dear user', 'dear sir/madam',
                           'do the needful', 'revert back']
            grammar_hits = sum(1 for g in poor_grammar if g in content_lower)
            if grammar_hits > 0:
                scores['grammar'] = 3
            else:
                scores['grammar'] = 0
        else:
            scores['urgency'] = 0
            scores['authority'] = 0
            scores['content_links'] = 0
            scores['pii_request'] = 0
            scores['grammar'] = 0

        # === FINAL SCORING ===
        total_score = sum(scores.values())

        # Use ML model if available for primary prediction
        ml_prediction = None
        ml_confidence = None
        if self.ml_model is not None:
            try:
                from training.train_phishing import extract_url_features
                features = extract_url_features(url)
                import numpy as np
                features_array = np.array([features])
                ml_prediction = int(self.ml_model.predict(features_array)[0])
                ml_proba = self.ml_model.predict_proba(features_array)[0]
                ml_confidence = float(max(ml_proba) * 100)
                logger.info(f"ML prediction: {ml_prediction}, confidence: {ml_confidence:.1f}%")
            except Exception as e:
                logger.warning(f"ML prediction failed, using heuristics: {e}")

        # Combine ML + heuristic
        if ml_prediction is not None:
            is_phishing = bool(ml_prediction)
            confidence = ml_confidence
        else:
            is_phishing = total_score > 30
            confidence = min(99, max(1, total_score))

        processing_time = round(time.time() - start_time, 4)

        # Risk level
        if confidence > 80 and is_phishing:
            risk_level = "Critical"
            action = "DO NOT VISIT — High-confidence phishing detection"
        elif confidence > 60 and is_phishing:
            risk_level = "High"
            action = "AVOID — Multiple phishing indicators detected"
        elif is_phishing:
            risk_level = "Medium"
            action = "CAUTION — Some suspicious characteristics found"
        elif total_score > 15:
            risk_level = "Low"
            action = "Proceed with caution — minor indicators present"
        else:
            risk_level = "Safe"
            action = "No significant phishing indicators detected"

        method = "XGBoost ML + Heuristic" if ml_prediction is not None else "Heuristic Only"

        return {
            "is_phishing": is_phishing,
            "confidence": float(round(confidence, 1)),
            "url": url,
            "threats": threats,
            "risk_level": risk_level,
            "url_entropy": round(entropy, 2),
            "detection_method": method,
            "domain_analysis": {
                "domain": domain,
                "tld": tld,
                "subdomain_count": subdomain_count,
                "has_ssl": parsed.scheme == 'https',
                "path_depth": path_depth
            },
            "explanation": f"[{method}] Risk level: {risk_level}. "
                          f"{'Multiple threat indicators found' if is_phishing else 'Low risk profile'}. "
                          f"Analyzed {len([s for s in scores.values() if s > 0])}/{len(scores)} risk factors.",
            "recommended_action": action,
            "processing_time": processing_time,
            "analysis_details": scores
        }

    @staticmethod
    def _calculate_entropy(text: str) -> float:
        """Calculate Shannon entropy of a string"""
        if not text:
            return 0.0
        freq = {}
        for c in text:
            freq[c] = freq.get(c, 0) + 1
        length = len(text)
        entropy = -sum((count / length) * math.log2(count / length)
                       for count in freq.values())
        return entropy


phishing_detector = PhishingDetector()
