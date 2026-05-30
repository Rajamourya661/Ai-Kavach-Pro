"""
KAVACH AI Pro - Detection Endpoints
REAL AI detection — synchronous mode (no Celery needed)
Deepfake (EfficientNet), Voice (librosa), Phishing (XGBoost + heuristics)
"""

import os
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.db.session import get_db
from app.models.database import Detection, DetectionType, DetectionStatus
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


async def _save_upload(file: UploadFile, detection_type: str) -> str:
    """Save uploaded file to disk and return path.
    Handles large files by reading in chunks to avoid memory issues.
    """
    upload_dir = os.path.join(settings.UPLOAD_DIR, detection_type)
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] if file.filename else '.bin'
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)

    # Reset file position to start (crucial — prevents 0-byte saves)
    await file.seek(0)

    # Write in chunks to handle large files without OOM
    total_written = 0
    CHUNK_SIZE = 1024 * 1024  # 1MB chunks
    with open(filepath, 'wb') as f:
        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break
            f.write(chunk)
            total_written += len(chunk)

    # Validate file was saved correctly
    if total_written == 0:
        os.remove(filepath)
        raise ValueError(f"File upload failed — 0 bytes received for {file.filename}")

    saved_size = os.path.getsize(filepath)
    if saved_size < 1024:  # Less than 1KB = corrupt
        os.remove(filepath)
        raise ValueError(f"File upload incomplete — only {saved_size} bytes saved (expected a valid {detection_type} file)")

    logger.info(f"Saved {detection_type} file: {filepath} ({saved_size:,} bytes)")
    return filepath


# Allowed video MIME types — some browsers send application/octet-stream for .mkv/.avi
_ALLOWED_VIDEO_TYPES = {
    'video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime',
    'video/x-matroska', 'video/webm', 'video/mpeg', 'video/3gpp',
    'application/octet-stream',  # Generic binary — we rely on extension check too
    'application/x-matroska',
}
_ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.mpeg', '.3gp'}


@router.post("/detect/deepfake")
async def detect_deepfake(
    video: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a video for REAL deepfake detection using EfficientNet + heuristics"""
    # Validate file type — check both MIME type AND extension
    # Browsers sometimes send 'application/octet-stream' for .mkv/.avi, so extension is the fallback
    filename_ext = os.path.splitext(video.filename or '')[1].lower()
    mime_ok = (
        not video.content_type  # No content type provided — allow and rely on extension
        or video.content_type.startswith('video/')
        or video.content_type in _ALLOWED_VIDEO_TYPES
    )
    ext_ok = filename_ext in _ALLOWED_VIDEO_EXTENSIONS

    if not mime_ok and not ext_ok:
        raise HTTPException(
            status_code=400,
            detail=f"Please upload a video file (MP4, AVI, MOV, MKV). Got: {video.content_type or 'unknown type'}, extension: {filename_ext or 'none'}"
        )

    # Validate file size (reject > MAX_UPLOAD_SIZE early)
    # NOTE: video.size may be None on some clients — we validate again after saving
    if video.size is not None and video.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({video.size // (1024*1024)}MB). Maximum is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB."
        )

    # Save file with validation
    try:
        filepath = await _save_upload(video, "deepfake")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Validate size AFTER saving (catches cases where video.size was None)
    saved_size_check = os.path.getsize(filepath)
    if saved_size_check > settings.MAX_UPLOAD_SIZE:
        os.remove(filepath)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({saved_size_check // (1024*1024)}MB). Maximum is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB."
        )

    # Get actual saved file size (already validated above)
    saved_size = os.path.getsize(filepath)

    # Create detection record
    detection = Detection(
        detection_type=DetectionType.DEEPFAKE,
        status=DetectionStatus.PROCESSING,
        original_filename=video.filename,
        file_path=filepath,
        file_size=saved_size,
        mime_type=video.content_type,
    )
    db.add(detection)
    await db.flush()
    detection_id = detection.id

    # Run REAL AI detection synchronously
    try:
        from app.services.detection.deepfake_service import deepfake_detector
        import asyncio
        result = await asyncio.to_thread(deepfake_detector.analyze, filepath)

        # Update detection with real results
        detection.status = DetectionStatus.COMPLETED
        detection.is_fake = result.get('is_fake', False)
        detection.confidence = result.get('confidence', 0.0)
        detection.explanation = result.get('explanation', '')
        detection.recommended_action = result.get('recommended_action', '')
        detection.processing_time = result.get('processing_time', 0.0)
        detection.completed_at = datetime.now(timezone.utc)
        await db.flush()

        return {
            "detection_id": detection_id,
            "status": "completed",
            "is_fake": result.get('is_fake', False),
            "confidence": result.get('confidence', 0.0),
            "detection_type": "deepfake",
            "detection_method": result.get('detection_method', 'Heuristic'),
            "frames_analyzed": result.get('frames_analyzed', 0),
            "faces_detected": result.get('faces_detected', 0),
            "explanation": result.get('explanation', ''),
            "recommended_action": result.get('recommended_action', ''),
            "processing_time": result.get('processing_time', 0.0),
            "original_filename": video.filename,
            "analysis_details": result.get('analysis_details', {}),
        }
    except Exception as e:
        logger.error(f"Deepfake detection failed for {video.filename}: {e}", exc_info=True)
        detection.status = DetectionStatus.FAILED
        detection.explanation = str(e)[:500]
        await db.flush()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)[:200]}")


@router.post("/detect/voice")
async def detect_voice(
    audio: UploadFile = File(None),
    voice: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Upload audio for REAL voice anti-spoofing analysis using spectral features"""
    file = audio or voice
    if not file:
        raise HTTPException(status_code=400, detail="Please upload an audio file")

    # Save file with validation
    try:
        filepath = await _save_upload(file, "voice")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    saved_size = os.path.getsize(filepath)

    # Create detection record
    detection = Detection(
        detection_type=DetectionType.VOICE,
        status=DetectionStatus.PROCESSING,
        original_filename=file.filename,
        file_path=filepath,
        file_size=saved_size,
        mime_type=file.content_type,
    )
    db.add(detection)
    await db.flush()
    detection_id = detection.id

    # Run REAL AI detection
    try:
        from app.services.detection.voice_service import voice_detector
        import asyncio
        result = await asyncio.to_thread(voice_detector.analyze, filepath)

        detection.status = DetectionStatus.COMPLETED
        detection.is_fake = result.get('is_fake', False)
        detection.confidence = result.get('confidence', 0.0)
        detection.explanation = result.get('explanation', '')
        detection.recommended_action = result.get('recommended_action', '')
        detection.processing_time = result.get('processing_time', 0.0)
        detection.completed_at = datetime.now(timezone.utc)
        await db.flush()

        return {
            "detection_id": detection_id,
            "status": "completed",
            "is_fake": result.get('is_fake', False),
            "confidence": result.get('confidence', 0.0),
            "detection_type": "voice",
            "detection_method": result.get('detection_method', 'Heuristic'),
            "spoof_type": result.get('spoof_type'),
            "explanation": result.get('explanation', ''),
            "recommended_action": result.get('recommended_action', ''),
            "processing_time": result.get('processing_time', 0.0),
            "original_filename": file.filename,
            "analysis_details": result.get('analysis_details', {}),
        }
    except Exception as e:
        logger.error(f"Voice detection failed for {file.filename}: {e}", exc_info=True)
        detection.status = DetectionStatus.FAILED
        detection.explanation = str(e)[:500]
        await db.flush()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)[:200]}")


@router.post("/detect/phishing")
async def detect_phishing(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Analyze a URL for phishing using REAL XGBoost ML model + heuristics"""
    # Accept both JSON and form data
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        url = body.get("url", "")
        content = body.get("content", "")
    else:
        form = await request.form()
        url = form.get("url", "")
        content = form.get("content", "")

    if not url:
        raise HTTPException(status_code=400, detail="Please provide a URL")

    # Create detection record
    detection = Detection(
        detection_type=DetectionType.PHISHING,
        status=DetectionStatus.PROCESSING,
        original_filename=url[:500],
    )
    db.add(detection)
    await db.flush()
    detection_id = detection.id

    # Run REAL phishing detection
    try:
        from app.services.detection.phishing_service import phishing_detector
        result = phishing_detector.analyze(url, content or None)

        detection.status = DetectionStatus.COMPLETED
        detection.is_fake = result.get('is_phishing', False)
        detection.confidence = result.get('confidence', 0.0)
        detection.explanation = result.get('explanation', '')
        detection.recommended_action = result.get('recommended_action', '')
        detection.processing_time = result.get('processing_time', 0.0)
        detection.completed_at = datetime.now(timezone.utc)
        await db.flush()

        return {
            "detection_id": detection_id,
            "status": "completed",
            "is_fake": result.get('is_phishing', False),
            "is_phishing": result.get('is_phishing', False),
            "confidence": result.get('confidence', 0.0),
            "detection_type": "phishing",
            "url": url,
            "threats": result.get('threats', []),
            "risk_level": result.get('risk_level', 'Unknown'),
            "detection_method": result.get('detection_method', 'Heuristic'),
            "explanation": result.get('explanation', ''),
            "recommended_action": result.get('recommended_action', ''),
            "processing_time": result.get('processing_time', 0.0),
            "analysis_details": result.get('analysis_details', {}),
        }
    except Exception as e:
        logger.error(f"Phishing detection failed: {e}", exc_info=True)
        detection.status = DetectionStatus.FAILED
        detection.explanation = str(e)
        await db.flush()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/detections/{detection_id}")
async def get_detection(
    detection_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get detection result by ID"""
    result = await db.execute(
        select(Detection).where(Detection.id == detection_id)
    )
    detection = result.scalar_one_or_none()

    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")

    return {
        "id": detection.id,
        "detection_type": detection.detection_type.value if detection.detection_type else None,
        "status": detection.status.value if detection.status else None,
        "is_fake": detection.is_fake,
        "confidence": detection.confidence,
        "explanation": detection.explanation,
        "recommended_action": detection.recommended_action,
        "processing_time": detection.processing_time,
        "original_filename": detection.original_filename,
        "created_at": detection.created_at.isoformat() if detection.created_at else None,
        "completed_at": detection.completed_at.isoformat() if detection.completed_at else None,
    }


@router.get("/history")
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    detection_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated detection history"""
    query = select(Detection)

    if detection_type:
        query = query.where(Detection.detection_type == detection_type)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Fetch paginated results
    query = query.order_by(desc(Detection.created_at))
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    detections = result.scalars().all()

    items = []
    for d in detections:
        items.append({
            "id": d.id,
            "detection_type": d.detection_type.value if d.detection_type else None,
            "type": d.detection_type.value if d.detection_type else None,
            "status": d.status.value if d.status else None,
            "is_fake": d.is_fake,
            "confidence": d.confidence,
            "explanation": d.explanation,
            "recommended_action": d.recommended_action,
            "processing_time": d.processing_time,
            "original_filename": d.original_filename,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "completed_at": d.completed_at.isoformat() if d.completed_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total
    }


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get detection statistics"""
    total = (await db.execute(select(func.count(Detection.id)))).scalar() or 0
    threats = (await db.execute(
        select(func.count(Detection.id)).where(Detection.is_fake == True)
    )).scalar() or 0
    safe = total - threats
    completed = (await db.execute(
        select(func.count(Detection.id)).where(Detection.status == DetectionStatus.COMPLETED)
    )).scalar() or 0

    return {
        "total_scans": total,
        "threats": threats,
        "safe": safe,
        "success_rate": round((completed / total * 100), 1) if total > 0 else 0.0,
    }
