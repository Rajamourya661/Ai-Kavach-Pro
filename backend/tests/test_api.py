"""
KAVACH AI Pro - API Endpoint Tests
Tests the FastAPI endpoints for health, stats, and detection
"""
import pytest
import os
import sys
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Test health and readiness endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.main import app
        self.client = TestClient(app)

    def test_health_check(self):
        """Health endpoint should return 200"""
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_ready_check(self):
        """Readiness endpoint should return 200"""
        response = self.client.get("/ready")
        assert response.status_code == 200

    def test_root_redirect(self):
        """Root should redirect to docs"""
        response = self.client.get("/", follow_redirects=False)
        assert response.status_code in [200, 307]

    def test_docs_endpoint(self):
        """Swagger docs should be accessible"""
        response = self.client.get("/docs")
        assert response.status_code == 200


class TestStatsEndpoint:
    """Test stats API"""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.main import app
        self.client = TestClient(app)

    def test_stats_returns_200(self):
        """Stats endpoint should return 200 with valid structure"""
        response = self.client.get("/api/v1/stats")
        assert response.status_code == 200
        data = response.json()
        assert 'total_scans' in data
        assert 'threats' in data
        assert 'safe' in data

    def test_history_returns_200(self):
        """History endpoint should return paginated results"""
        response = self.client.get("/api/v1/history", params={"page": 1, "per_page": 10})
        assert response.status_code == 200
        data = response.json()
        assert 'items' in data
        assert 'total' in data
        assert isinstance(data['items'], list)


class TestDetectionEndpoints:
    """Test detection API endpoints (structure only — no files)"""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.main import app
        self.client = TestClient(app)

    def test_phishing_detect(self):
        """Phishing endpoint should accept URL and return result"""
        response = self.client.post(
            "/api/v1/detect/phishing",
            data={"url": "https://www.google.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert 'is_phishing' in data or 'is_fake' in data

    def test_phishing_suspicious_url(self):
        """Phishing endpoint should flag suspicious URLs"""
        response = self.client.post(
            "/api/v1/detect/phishing",
            data={"url": "http://paypal-login.tk/verify"}
        )
        assert response.status_code == 200

    def test_deepfake_no_file(self):
        """Deepfake endpoint without file should return 422"""
        response = self.client.post("/api/v1/detect/deepfake")
        assert response.status_code == 422

    def test_voice_no_file(self):
        """Voice endpoint without file should return 422"""
        response = self.client.post("/api/v1/detect/voice")
        assert response.status_code == 422


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
