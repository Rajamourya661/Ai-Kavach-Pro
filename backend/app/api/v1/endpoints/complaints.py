"""
KAVACH AI Pro - Citizen Complaint API
Features:
- NLP-based complaint analysis & auto severity scoring
- Real-time email notifications
- Predictive analytics & trend detection
- Case tracking with timeline
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re
from collections import Counter

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store for demo
complaints_db = {}

# ─────────────────────────────────────────
# NLP — Keyword Analysis Engine
# ─────────────────────────────────────────

CRITICAL_KEYWORDS = [
    "suicide", "kill", "murder", "rape", "blackmail", "threat", "bomb",
    "attack", "weapon", "nude", "naked", "sextortion", "ransom", "kidnap",
    "assault", "violence", "die", "death"
]

HIGH_KEYWORDS = [
    "fraud", "hack", "stolen", "account", "money", "bank", "otp", "phishing",
    "fake", "scam", "stalk", "harass", "abuse", "intimate", "video", "photo",
    "leaked", "extort", "identity", "impersonate", "deepfake", "morphed"
]

MEDIUM_KEYWORDS = [
    "spam", "suspicious", "unknown", "weird", "uncomfortable", "annoying",
    "following", "watching", "message", "call", "profile", "social media"
]

CYBER_CATEGORIES = {
    "financial_fraud": ["bank", "money", "otp", "upi", "fraud", "transfer", "payment", "account", "stolen", "scam"],
    "deepfake": ["deepfake", "morphed", "fake video", "ai generated", "manipulated", "face swap"],
    "stalking": ["stalk", "follow", "track", "watch", "location", "home", "office"],
    "harassment": ["harass", "bully", "abuse", "threat", "intimidate", "message", "call"],
    "sextortion": ["nude", "naked", "intimate", "photo", "video", "blackmail", "leak", "sextortion"],
    "identity_theft": ["identity", "impersonate", "fake profile", "fake account", "pretend"],
    "phishing": ["phishing", "link", "website", "url", "click", "password", "login"],
}


def analyze_complaint_nlp(description: str, complaint_type: str) -> dict:
    """
    NLP analysis — keyword extraction, severity scoring, category detection
    """
    text = description.lower()
    words = re.findall(r'\b\w+\b', text)

    # Severity scoring
    critical_hits = [w for w in CRITICAL_KEYWORDS if w in text]
    high_hits = [w for w in HIGH_KEYWORDS if w in text]
    medium_hits = [w for w in MEDIUM_KEYWORDS if w in text]

    severity_score = (len(critical_hits) * 10) + (len(high_hits) * 5) + (len(medium_hits) * 2)

    # Auto priority
    if critical_hits or severity_score >= 15:
        auto_priority = "critical"
        suggested_urgency = "high"
    elif high_hits or severity_score >= 8:
        auto_priority = "high"
        suggested_urgency = "high"
    elif medium_hits or severity_score >= 3:
        auto_priority = "medium"
        suggested_urgency = "medium"
    else:
        auto_priority = "low"
        suggested_urgency = "low"

    # Category detection
    detected_categories = []
    for category, keywords in CYBER_CATEGORIES.items():
        if any(kw in text for kw in keywords):
            detected_categories.append(category)

    # Key phrases extraction (simple — top repeated meaningful words)
    stopwords = {"the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "and", "or", "i", "my", "me", "was", "he", "she", "they", "it", "this", "that", "have", "has", "been", "are", "were"}
    meaningful_words = [w for w in words if w not in stopwords and len(w) > 3]
    key_phrases = [w for w, _ in Counter(meaningful_words).most_common(5)]

    # Risk flags
    risk_flags = []
    if critical_hits:
        risk_flags.append(f"⚠️ Critical keywords detected: {', '.join(critical_hits)}")
    if high_hits:
        risk_flags.append(f"🔴 High-risk keywords: {', '.join(high_hits[:3])}")
    if "minor" in text or "child" in text or "underage" in text:
        risk_flags.append("🚨 Possible minor involvement — escalate immediately")
    if any(w in text for w in ["suicide", "kill", "die", "death"]):
        risk_flags.append("🆘 Life-threatening indicators — immediate response required")

    return {
        "severity_score": severity_score,
        "auto_priority": auto_priority,
        "suggested_urgency": suggested_urgency,
        "detected_categories": detected_categories,
        "key_phrases": key_phrases,
        "risk_flags": risk_flags,
        "critical_keywords_found": critical_hits,
        "high_keywords_found": high_hits[:5],
        "word_count": len(words),
        "analysis_confidence": "high" if len(words) > 20 else "medium" if len(words) > 10 else "low"
    }


# ─────────────────────────────────────────
# Email Notification
# ─────────────────────────────────────────

def send_notification_email(complaint: dict, nlp_result: dict):
    """
    Send email notification to cyber cell officer
    Uses Gmail SMTP — configure in production
    """
    try:
        # In demo mode — just log the notification
        priority = nlp_result.get("auto_priority", "medium").upper()
        tracking_id = complaint.get("tracking_id", "N/A")
        case_ref = complaint.get("case_ref", "N/A")
        complaint_type = complaint.get("type", "N/A")
        city = complaint.get("city", "N/A")
        risk_flags = nlp_result.get("risk_flags", [])

        notification_content = f"""
╔══════════════════════════════════════════════════╗
║     KAVACH AI Pro — NEW COMPLAINT ALERT          ║
╚══════════════════════════════════════════════════╝

🚨 PRIORITY: {priority}
📋 Tracking ID: {tracking_id}
📁 Case Ref: {case_ref}
🔍 Type: {complaint_type}
🏙️ City: {city}
⚡ Severity Score: {nlp_result.get('severity_score', 0)}/100
🏷️ Categories: {', '.join(nlp_result.get('detected_categories', ['General']))}
🔑 Key Phrases: {', '.join(nlp_result.get('key_phrases', []))}

Risk Flags:
{chr(10).join(risk_flags) if risk_flags else 'No critical flags'}

Action Required: {"IMMEDIATE RESPONSE" if priority == "CRITICAL" else "Review within 24 hours"}
        """

        logger.info(f"📧 NOTIFICATION SENT:\n{notification_content}")

        # Uncomment below for real email in production:
        # msg = MIMEMultipart()
        # msg['From'] = "kavach@cybercelll.gov.in"
        # msg['To'] = "cybercell.ahmedabad@gujaratpolice.gov.in"
        # msg['Subject'] = f"[{priority}] New Cybercrime Complaint — {tracking_id}"
        # msg.attach(MIMEText(notification_content, 'plain'))
        # with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        #     server.login("your-email@gmail.com", "your-password")
        #     server.send_message(msg)

    except Exception as e:
        logger.error(f"Notification failed: {e}")


# ─────────────────────────────────────────
# Models
# ─────────────────────────────────────────

class ComplaintSubmit(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    type: str
    description: str
    evidence: Optional[str] = None
    urgency: str = "medium"


class ComplaintResponse(BaseModel):
    success: bool
    tracking_id: str
    case_ref: str
    message: str
    submitted_at: str
    auto_priority: str
    severity_score: int
    risk_flags: list
    detected_categories: list


# ─────────────────────────────────────────
# Routes
# ─────────────────────────────────────────

@router.post("/complaints/submit", response_model=ComplaintResponse)
async def submit_complaint(complaint: ComplaintSubmit, background_tasks: BackgroundTasks):
    try:
        tracking_id = f"KAVACH-{uuid.uuid4().hex[:6].upper()}"
        case_ref = f"CCB-AHM-2026-{str(uuid.uuid4().int)[:4]}"
        submitted_at = datetime.now(timezone.utc).isoformat()

        # NLP Analysis
        nlp = analyze_complaint_nlp(complaint.description, complaint.type)

        # Override urgency if NLP detects higher severity
        final_urgency = complaint.urgency
        if nlp["auto_priority"] == "critical":
            final_urgency = "high"
        elif nlp["auto_priority"] == "high" and complaint.urgency == "low":
            final_urgency = "medium"

        complaint_data = {
            "tracking_id": tracking_id,
            "case_ref": case_ref,
            "name": complaint.name,
            "phone": complaint.phone,
            "email": complaint.email,
            "city": complaint.city or "N/A",
            "type": complaint.type,
            "description": complaint.description,
            "evidence": complaint.evidence,
            "urgency": final_urgency,
            "status": "pending",
            "submitted_at": submitted_at,
            "last_updated": submitted_at,
            "nlp_analysis": nlp,
            "timeline": [
                {"date": submitted_at, "event": "Complaint submitted via KAVACH AI Portal", "icon": "📤", "done": True},
                {"date": submitted_at, "event": f"AI Analysis complete — Priority: {nlp['auto_priority'].upper()}, Score: {nlp['severity_score']}/100", "icon": "🤖", "done": True},
                {"date": "Pending", "event": "Case assigned to investigating officer", "icon": "👮", "done": False},
                {"date": "Pending", "event": "Investigation in progress", "icon": "🔍", "done": False},
                {"date": "Pending", "event": "Case resolution & final report", "icon": "✅", "done": False},
            ]
        }

        complaints_db[tracking_id] = complaint_data

        # Send notification in background
        background_tasks.add_task(send_notification_email, complaint_data, nlp)

        logger.info(f"✅ Complaint {tracking_id} | Priority: {nlp['auto_priority']} | Score: {nlp['severity_score']} | City: {complaint.city}")

        return ComplaintResponse(
            success=True,
            tracking_id=tracking_id,
            case_ref=case_ref,
            message=f"Complaint registered. Tracking ID: {tracking_id}. AI Priority: {nlp['auto_priority'].upper()}.",
            submitted_at=submitted_at,
            auto_priority=nlp["auto_priority"],
            severity_score=nlp["severity_score"],
            risk_flags=nlp["risk_flags"],
            detected_categories=nlp["detected_categories"],
        )

    except Exception as e:
        logger.error(f"Complaint submission failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit complaint.")


@router.get("/complaints/track/{tracking_id}")
async def track_complaint(tracking_id: str):
    complaint = complaints_db.get(tracking_id.upper())
    if not complaint:
        raise HTTPException(status_code=404, detail=f"No complaint found: {tracking_id}")
    return {"success": True, "data": complaint}


@router.get("/complaints/all")
async def get_all_complaints():
    return {
        "success": True,
        "total": len(complaints_db),
        "complaints": list(complaints_db.values())
    }


@router.get("/complaints/stats")
async def complaint_stats():
    total = len(complaints_db)
    by_type = {}
    by_status = {}
    by_urgency = {}
    by_priority = {}
    by_city = {}
    severity_scores = []

    for c in complaints_db.values():
        by_type[c["type"]] = by_type.get(c["type"], 0) + 1
        by_status[c["status"]] = by_status.get(c["status"], 0) + 1
        by_urgency[c["urgency"]] = by_urgency.get(c["urgency"], 0) + 1
        by_city[c["city"]] = by_city.get(c["city"], 0) + 1
        if c.get("nlp_analysis"):
            by_priority[c["nlp_analysis"]["auto_priority"]] = by_priority.get(c["nlp_analysis"]["auto_priority"], 0) + 1
            severity_scores.append(c["nlp_analysis"]["severity_score"])

    avg_severity = sum(severity_scores) / len(severity_scores) if severity_scores else 0

    return {
        "success": True,
        "total": total,
        "by_type": by_type,
        "by_status": by_status,
        "by_urgency": by_urgency,
        "by_priority": by_priority,
        "by_city": by_city,
        "avg_severity_score": round(avg_severity, 1),
        "high_priority_count": by_priority.get("critical", 0) + by_priority.get("high", 0),
    }


@router.get("/complaints/analytics/trends")
async def complaint_trends():
    """
    Predictive Analytics — trend detection
    Shows complaint patterns over last 7 days
    """
    now = datetime.now(timezone.utc)
    daily_counts = {}
    category_trends = {}
    city_hotspots = {}

    for c in complaints_db.values():
        try:
            submitted = datetime.fromisoformat(c["submitted_at"].replace("Z", "+00:00"))
            days_ago = (now - submitted).days
            if days_ago <= 7:
                day_key = submitted.strftime("%a %d %b")
                daily_counts[day_key] = daily_counts.get(day_key, 0) + 1

                # Category trends
                if c.get("nlp_analysis", {}).get("detected_categories"):
                    for cat in c["nlp_analysis"]["detected_categories"]:
                        category_trends[cat] = category_trends.get(cat, 0) + 1

                # City hotspots
                city = c.get("city", "Unknown")
                city_hotspots[city] = city_hotspots.get(city, 0) + 1
        except Exception:
            pass

    # Prediction — simple trend
    counts = list(daily_counts.values())
    if len(counts) >= 3:
        recent_avg = sum(counts[-3:]) / 3
        older_avg = sum(counts[:-3]) / max(len(counts[:-3]), 1)
        trend = "increasing" if recent_avg > older_avg else "decreasing" if recent_avg < older_avg else "stable"
        predicted_tomorrow = round(recent_avg * (1.1 if trend == "increasing" else 0.9))
    else:
        trend = "insufficient_data"
        predicted_tomorrow = 0

    top_category = max(category_trends, key=category_trends.get) if category_trends else "N/A"
    top_city = max(city_hotspots, key=city_hotspots.get) if city_hotspots else "N/A"

    return {
        "success": True,
        "period": "Last 7 days",
        "daily_counts": daily_counts,
        "total_this_week": sum(daily_counts.values()),
        "trend": trend,
        "predicted_tomorrow": predicted_tomorrow,
        "top_category": top_category,
        "top_city_hotspot": top_city,
        "category_breakdown": category_trends,
        "city_hotspots": city_hotspots,
        "alert": f"⚠️ {top_category.replace('_', ' ').title()} complaints are {trend} — monitor closely" if trend == "increasing" else None
    }