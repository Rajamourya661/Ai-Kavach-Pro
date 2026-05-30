"""
KAVACH AI Pro - Detection Service Tests
Tests all 3 detection services: Deepfake, Voice, Phishing
"""
import pytest
import os
import sys
import tempfile
import numpy as np

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# ============================================================
# PHISHING SERVICE TESTS (no file I/O needed — pure logic)
# ============================================================

class TestPhishingDetector:
    """Test phishing URL heuristic analysis"""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.services.detection.phishing_service import PhishingDetector
        self.detector = PhishingDetector()

    def test_safe_url(self):
        """Legitimate URL should score low risk"""
        result = self.detector.analyze("https://www.google.com/search?q=test")
        assert result['is_phishing'] == False
        assert result['confidence'] < 50

    def test_phishing_url_suspicious_tld(self):
        """URL with suspicious TLD (.tk) should be flagged"""
        result = self.detector.analyze("http://paypal-login.tk/verify")
        assert result['is_phishing'] == True
        assert result['confidence'] > 40

    def test_phishing_url_brand_impersonation(self):
        """URL impersonating a major brand should be flagged"""
        result = self.detector.analyze("http://secure-paypal-verify.ml/login.php")
        assert result['is_phishing'] == True
        assert 'threats' in result
        assert len(result['threats']) > 0

    def test_phishing_url_with_ip(self):
        """URL with IP address should be suspicious"""
        result = self.detector.analyze("http://192.168.1.1/admin/login")
        assert result['confidence'] > 20  # Should have some risk score

    def test_safe_url_https(self):
        """HTTPS URL from trusted domain"""
        result = self.detector.analyze("https://github.com/user/repo")
        assert result['is_phishing'] == False
        assert result['confidence'] < 30

    def test_result_structure(self):
        """Result should contain all expected fields"""
        result = self.detector.analyze("https://example.com")
        assert 'is_phishing' in result
        assert 'confidence' in result
        assert 'explanation' in result
        assert 'threats' in result
        assert 'analysis_details' in result
        assert 'risk_level' in result

    def test_empty_url(self):
        """Empty URL should not crash"""
        result = self.detector.analyze("")
        assert 'is_phishing' in result

    def test_long_url(self):
        """Very long URL should increase suspicion"""
        long_url = "http://suspicious.tk/" + "a" * 200 + "/login.php?verify=true"
        result = self.detector.analyze(long_url)
        assert result['confidence'] > 30


# ============================================================
# VOICE SERVICE TESTS (uses librosa on generated audio)
# ============================================================

class TestVoiceDetector:
    """Test voice anti-spoofing spectral analysis"""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.services.detection.voice_service import VoiceAntiSpoofing
        self.detector = VoiceAntiSpoofing()

    def _create_test_wav(self, duration=2.0, sr=16000, freq=440.0):
        """Create a minimal WAV file for testing"""
        import wave
        import struct

        filepath = tempfile.mktemp(suffix='.wav')
        n_samples = int(duration * sr)
        # Generate sine wave
        samples = [int(16000 * np.sin(2 * np.pi * freq * t / sr)) for t in range(n_samples)]

        with wave.open(filepath, 'w') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sr)
            wav_file.writeframes(struct.pack(f'{n_samples}h', *samples))
        return filepath

    def test_analyze_returns_result(self):
        """Basic analysis should return complete result"""
        wav_path = self._create_test_wav()
        try:
            result = self.detector.analyze(wav_path)
            assert 'is_fake' in result
            assert 'confidence' in result
            assert 'explanation' in result
            assert isinstance(result['confidence'], (int, float))
        finally:
            os.unlink(wav_path)

    def test_confidence_range(self):
        """Confidence should be between 0-100"""
        wav_path = self._create_test_wav()
        try:
            result = self.detector.analyze(wav_path)
            assert 0 <= result['confidence'] <= 100
        finally:
            os.unlink(wav_path)

    def test_processing_time(self):
        """Result should include processing time"""
        wav_path = self._create_test_wav()
        try:
            result = self.detector.analyze(wav_path)
            assert 'processing_time' in result
            assert result['processing_time'] > 0
        finally:
            os.unlink(wav_path)


# ============================================================
# DEEPFAKE SERVICE TESTS (uses OpenCV on generated images)
# ============================================================

class TestDeepfakeDetector:
    """Test deepfake video/image analysis"""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.services.detection.deepfake_service import DeepfakeDetector
        self.detector = DeepfakeDetector()

    def _create_test_video(self, frames=10, width=320, height=240):
        """Create a minimal test video using OpenCV"""
        import cv2

        filepath = tempfile.mktemp(suffix='.avi')
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(filepath, fourcc, 24.0, (width, height))

        for i in range(frames):
            # Create a simple gradient frame with slight variation
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            frame[:, :, 0] = i * 10  # varying blue
            frame[:, :, 1] = 128     # constant green
            frame[:, :, 2] = 200     # constant red
            # Add a "face-like" rectangle to trigger face detection
            cv2.rectangle(frame, (100, 60), (220, 180), (200, 180, 160), -1)
            cv2.circle(frame, (140, 110), 8, (50, 50, 50), -1)  # left eye
            cv2.circle(frame, (180, 110), 8, (50, 50, 50), -1)  # right eye
            cv2.ellipse(frame, (160, 150), (20, 8), 0, 0, 180, (50, 50, 50), 2)  # mouth
            out.write(frame)

        out.release()
        return filepath

    def test_analyze_returns_result(self):
        """Basic analysis should return complete result"""
        video_path = self._create_test_video()
        try:
            result = self.detector.analyze(video_path)
            assert 'is_fake' in result
            assert 'confidence' in result
            assert 'explanation' in result
            assert isinstance(result['is_fake'], bool)
        finally:
            os.unlink(video_path)

    def test_confidence_range(self):
        """Confidence should be between 0-100"""
        video_path = self._create_test_video()
        try:
            result = self.detector.analyze(video_path)
            assert 0 <= result['confidence'] <= 100
        finally:
            os.unlink(video_path)

    def test_result_fields(self):
        """Result should contain all expected fields"""
        video_path = self._create_test_video()
        try:
            result = self.detector.analyze(video_path)
            assert 'is_fake' in result
            assert 'confidence' in result
            assert 'processing_time' in result
        finally:
            os.unlink(video_path)


# ============================================================
# INTEGRATION: Test that all services import cleanly
# ============================================================

class TestServiceImports:
    """Verify all services can be imported without errors"""

    def test_import_phishing(self):
        from app.services.detection.phishing_service import PhishingDetector
        assert PhishingDetector is not None

    def test_import_voice(self):
        from app.services.detection.voice_service import VoiceAntiSpoofing
        assert VoiceAntiSpoofing is not None

    def test_import_deepfake(self):
        from app.services.detection.deepfake_service import DeepfakeDetector
        assert DeepfakeDetector is not None

    def test_import_config(self):
        from app.core.config import settings
        assert settings.APP_NAME == "KAVACH AI Pro"

    def test_import_security(self):
        from app.utils.security import FileValidator, EncryptionUtils
        assert FileValidator is not None
        assert EncryptionUtils is not None


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
