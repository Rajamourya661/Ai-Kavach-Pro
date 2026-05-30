"""
KAVACH AI Pro - Deepfake Detection Service
REAL AI: EfficientNet-B0 (trained on 140k Kaggle faces) + OpenCV heuristics
"""

import cv2
import numpy as np
import os
import time
import logging
from typing import Dict

logger = logging.getLogger(__name__)


class DeepfakeDetector:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        # Load trained EfficientNet model
        self.ml_model = None
        self.transform = None
        self._load_model()

    def _load_model(self):
        """Load trained EfficientNet-B0 deepfake model.
        Supports both architectures:
          - 2-class softmax (CrossEntropy training)
          - 1-output sigmoid (BCE training)
        """
        model_paths = [
            os.path.join(os.path.dirname(__file__), '..', '..', '..', 'models', 'pretrained', 'deepfake_efficientnet.pth'),
            'models/pretrained/deepfake_efficientnet.pth'
        ]
        for path in model_paths:
            try:
                import torch
                import torchvision.transforms as transforms
                from torchvision import models

                # Load checkpoint to inspect structure
                checkpoint = torch.load(path, map_location='cpu', weights_only=True)
                state_dict = checkpoint.get('model_state_dict', checkpoint)

                # Detect model output shape from saved weights
                # Check classifier layer to determine 1-output (sigmoid) vs 2-output (softmax)
                classifier_key = None
                for key in state_dict:
                    if 'classifier' in key and 'weight' in key:
                        classifier_key = key
                out_features = state_dict[classifier_key].shape[0] if classifier_key else 2

                if out_features == 1:
                    # BCE/Sigmoid architecture from training script
                    model = models.efficientnet_b0(weights=None)
                    n = model.classifier[1].in_features
                    model.classifier = torch.nn.Sequential(
                        torch.nn.Dropout(0.3),
                        torch.nn.Linear(n, 256),
                        torch.nn.ReLU(),
                        torch.nn.Dropout(0.2),
                        torch.nn.Linear(256, 1),
                        torch.nn.Sigmoid()
                    )
                    self._model_type = 'sigmoid'
                else:
                    # 2-class CrossEntropy architecture
                    model = models.efficientnet_b0(weights=None)
                    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 2)
                    self._model_type = 'softmax'

                model.load_state_dict(state_dict)
                model.eval()
                self.ml_model = model

                # Image transform
                self.transform = transforms.Compose([
                    transforms.ToPILImage(),
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
                ])

                logger.info(f"Loaded EfficientNet deepfake model from {path} (type={self._model_type})")
                return
            except Exception as e:
                logger.debug(f"Could not load from {path}: {e}")
                continue
        self._model_type = None
        logger.warning("No trained deepfake model found, using heuristic-only mode")

    def _predict_frame(self, frame, face_roi):
        """Run EfficientNet prediction on a face crop.
        Handles both sigmoid (1-output) and softmax (2-output) models.
        """
        if self.ml_model is None or self.transform is None:
            return None

        try:
            import torch
            # Convert BGR to RGB
            face_rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
            input_tensor = self.transform(face_rgb).unsqueeze(0)

            with torch.no_grad():
                output = self.ml_model(input_tensor)

                if self._model_type == 'sigmoid':
                    # Single output with sigmoid — output IS the fake probability
                    fake_prob = output.squeeze().item()
                else:
                    # 2-class softmax — class 1 = fake
                    probabilities = torch.softmax(output, dim=1)
                    fake_prob = probabilities[0][1].item()

                return fake_prob
        except Exception as e:
            logger.debug(f"ML prediction failed on frame: {e}")
            return None

    def analyze(self, video_path: str) -> Dict:
        """
        Hybrid deepfake analysis:
        1. EfficientNet-B0 ML model (if available) for primary classification
        2. OpenCV heuristics for explainability:
           - Face consistency across frames
           - Edge artifact detection
           - Blink pattern analysis
           - Color histogram consistency
           - Compression anomaly detection
        """
        start_time = time.time()

        # Validate file exists and is not empty
        if not os.path.exists(video_path):
            raise ValueError(f"Video file not found: {video_path}")

        file_size = os.path.getsize(video_path)
        if file_size < 1024:
            raise ValueError(f"Video file too small ({file_size} bytes) — likely corrupt upload")

        logger.info(f"Starting deepfake analysis: {video_path} ({file_size:,} bytes)")

        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            file_ext = os.path.splitext(video_path)[1].lower()
            logger.error(f"OpenCV could not open video: {video_path} (size={file_size:,} bytes, ext={file_ext})")
            # Common issue on Windows: .mkv and .avi need proper codec packs
            ext_hint = ""
            if file_ext in ('.mkv', '.avi'):
                ext_hint = f" Note: {file_ext.upper()} files require codec support. Try converting to MP4 (H.264)."
            return {
                "is_fake": False, "confidence": 0.0,
                "detection_method": "Heuristic Only",
                "frames_analyzed": 0, "faces_detected": 0,
                "explanation": f"Could not open video file — the format may not be supported.{ext_hint}",
                "processing_time": round(time.time() - start_time, 2),
                "recommended_action": "Please re-upload as MP4 (H.264) format"
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        sample_interval = max(1, int(fps / 5))  # Analyze 5 frames per second

        frames_analyzed = 0
        faces_detected = 0
        face_sizes = []
        face_positions = []
        edge_scores = []
        blink_count = 0
        color_histograms = []
        compression_scores = []
        ml_predictions = []  # EfficientNet predictions

        max_frames = min(total_frames, 150)

        frame_idx = 0
        while cap.isOpened() and frame_idx < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_interval == 0:
                frames_analyzed += 1
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

                # Face detection
                faces = self.face_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
                )

                if len(faces) > 0:
                    faces_detected += 1
                    x, y, w, h = faces[0]
                    face_sizes.append((w, h))
                    face_positions.append((x + w // 2, y + h // 2))

                    # ML prediction on face crop
                    face_roi_color = frame[y:y+h, x:x+w]
                    if face_roi_color.size > 0 and w > 50 and h > 50:
                        ml_pred = self._predict_frame(frame, face_roi_color)
                        if ml_pred is not None:
                            ml_predictions.append(ml_pred)

                    # Edge artifact detection
                    face_roi = gray[y:y+h, x:x+w]
                    if face_roi.size > 0:
                        laplacian = cv2.Laplacian(face_roi, cv2.CV_64F)
                        edge_scores.append(laplacian.var())

                    # Eye detection for blink analysis
                    eyes = self.eye_cascade.detectMultiScale(
                        face_roi, scaleFactor=1.1, minNeighbors=3
                    )
                    if len(eyes) < 2:
                        blink_count += 1

                    # Color histogram
                    face_color = frame[y:y+h, x:x+w]
                    if face_color.size > 0:
                        hist = cv2.calcHist([face_color], [0, 1, 2], None,
                                           [8, 8, 8], [0, 256, 0, 256, 0, 256])
                        hist = cv2.normalize(hist, hist).flatten()
                        color_histograms.append(hist)

                # Compression artifact detection
                if gray.shape[0] >= 8 and gray.shape[1] >= 8:
                    block = gray[:8, :8].astype(np.float32)
                    dct_block = cv2.dct(block)
                    compression_scores.append(np.abs(dct_block).mean())

            frame_idx += 1

        cap.release()

        # === ML MODEL SCORING ===
        ml_confidence = None
        ml_is_fake = None
        detection_method = "Heuristic Only"

        if len(ml_predictions) >= 3:
            avg_fake_prob = float(np.mean(ml_predictions))
            ml_confidence = round(avg_fake_prob * 100, 1)
            ml_is_fake = avg_fake_prob > 0.5
            detection_method = "EfficientNet-B0 + Heuristic"
            logger.info(f"ML prediction: avg_fake_prob={avg_fake_prob:.3f} from {len(ml_predictions)} frames")

        # === HEURISTIC SCORING ===
        scores = {}

        # 1. Face consistency (0-25)
        if len(face_sizes) >= 3:
            size_widths = [s[0] for s in face_sizes]
            size_cv = np.std(size_widths) / (np.mean(size_widths) + 1e-6)
            pos_x = [p[0] for p in face_positions]
            pos_jitter = np.std(pos_x) / (np.mean(pos_x) + 1e-6)
            scores['face_consistency'] = round(min(25, (size_cv * 50 + pos_jitter * 50)), 2)
        else:
            scores['face_consistency'] = 0

        # 2. Edge artifacts (0-25)
        if len(edge_scores) >= 3:
            edge_mean = np.mean(edge_scores)
            edge_std = np.std(edge_scores)
            if edge_mean < 50 or edge_mean > 2000:
                scores['edge_artifact'] = 20
            elif edge_std / (edge_mean + 1e-6) > 0.5:
                scores['edge_artifact'] = 15
            else:
                scores['edge_artifact'] = round(max(0, (edge_std / (edge_mean + 1e-6)) * 25), 2)
        else:
            scores['edge_artifact'] = 0

        # 3. Blink analysis (0-20)
        if frames_analyzed > 10 and faces_detected > 5:
            blink_ratio = blink_count / faces_detected
            if blink_ratio < 0.05:
                scores['blink_analysis'] = 18
            elif blink_ratio > 0.8:
                scores['blink_analysis'] = 12
            else:
                scores['blink_analysis'] = round(max(0, (0.5 - blink_ratio) * 20), 2)
        else:
            scores['blink_analysis'] = 0

        # 4. Color consistency (0-15)
        if len(color_histograms) >= 3:
            correlations = []
            for i in range(1, len(color_histograms)):
                corr = cv2.compareHist(color_histograms[i-1], color_histograms[i], cv2.HISTCMP_CORREL)
                correlations.append(corr)
            avg_corr = np.mean(correlations)
            scores['color_consistency'] = round(min(15, (1 - avg_corr) * 30), 2) if avg_corr < 0.85 else 0
        else:
            scores['color_consistency'] = 0

        # 5. Compression anomaly (0-15)
        if len(compression_scores) >= 3:
            comp_cv = np.std(compression_scores) / (np.mean(compression_scores) + 1e-6)
            scores['compression_anomaly'] = round(min(15, comp_cv * 30), 2)
        else:
            scores['compression_anomaly'] = 0

        # === FINAL VERDICT ===
        heuristic_score = sum(scores.values())

        if ml_is_fake is not None:
            # ML model available — use it as primary, heuristics as secondary
            is_fake = ml_is_fake
            confidence = ml_confidence
        else:
            # Heuristic only
            is_fake = heuristic_score > 35
            confidence = min(99, max(1, heuristic_score))

        processing_time = round(time.time() - start_time, 2)

        # Generate explanation
        if is_fake:
            top_factors = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]
            factor_names = {
                'face_consistency': 'face position inconsistencies',
                'edge_artifact': 'edge artifacts in face regions',
                'blink_analysis': 'abnormal eye blink patterns',
                'color_consistency': 'color histogram anomalies',
                'compression_anomaly': 'compression artifacts'
            }
            factors_text = ", ".join([factor_names.get(f[0], f[0]) for f in top_factors if f[1] > 3])
            ml_note = f" [{detection_method}]" if ml_confidence is not None else ""
            explanation = f"{ml_note} Potential manipulation detected. Key indicators: {factors_text}."
        else:
            explanation = f"[{detection_method}] No significant indicators of manipulation found. Content appears authentic."

        # Convert all numpy types to native Python types for JSON serialization
        safe_scores = {k: float(v) for k, v in scores.items()}

        return {
            "is_fake": bool(is_fake),
            "confidence": float(round(confidence, 1)),
            "detection_method": detection_method,
            "frames_analyzed": int(frames_analyzed),
            "faces_detected": int(faces_detected),
            "ml_frames_scored": int(len(ml_predictions)),
            "explanation": str(explanation),
            "processing_time": float(processing_time),
            "recommended_action": "Exercise caution — manipulation indicators detected" if is_fake else "Content appears authentic",
            "analysis_details": safe_scores
        }


deepfake_detector = DeepfakeDetector()
