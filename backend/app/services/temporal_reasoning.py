import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session
from app.database.models import Memory, TemporalInterval

class TemporalReasoningEngine:
    """
    Parses complex conversational relative temporal references (e.g. 'last week', 
    'recently', 'during final exams') and correlates them with exact calendar events 
    and custom tagged relational temporal bounds.
    """
    
    TEMPORAL_PATTERNS = {
        r"\btoday\b": lambda now: (now.replace(hour=0, minute=0, second=0, microsecond=0), now),
        r"\byesterday\b": lambda now: (
            (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0),
            (now - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        ),
        r"\brecently\b|\ba while ago\b": lambda now: (now - timedelta(days=3), now),
        r"\blast week\b": lambda now: (now - timedelta(days=14), now - timedelta(days=7)),
        r"\bthis week\b": lambda now: (now - timedelta(days=now.weekday()), now),
        r"\blast month\b": lambda now: (now - timedelta(days=60), now - timedelta(days=30)),
        r"\bthis month\b": lambda now: (now.replace(day=1, hour=0, minute=0, second=0), now),
        r"\bthis year\b": lambda now: (now.replace(month=1, day=1, hour=0, minute=0, second=0), now)
    }

    @classmethod
    def parse_temporal_query(cls, query: str) -> Tuple[str, Optional[datetime], Optional[datetime], Optional[str]]:
        """
        Parses relative time markers in the user's string query.
        Returns: (cleaned_query, start_time, end_time, custom_interval_tag)
        """
        now = datetime.now(timezone.utc)
        cleaned_query = query.lower()
        
        # 1. Parse standard patterns
        for pattern, resolver in cls.TEMPORAL_PATTERNS.items():
            if re.search(pattern, cleaned_query):
                start, end = resolver(now)
                # Strip out the time marker to avoid vector skew
                cleaned = re.sub(pattern, "", cleaned_query).strip()
                return cleaned, start, end, None
                
        # 2. Check for relational/custom intervals like "during exams" or "during summer break"
        match = re.search(r"during\s+([a-zA-Z0-9_\s]+)", cleaned_query)
        if match:
            tag_name = match.group(1).strip()
            cleaned = re.sub(r"during\s+[a-zA-Z0-9_\s]+", "", cleaned_query).strip()
            return cleaned, None, None, tag_name
            
        return query, None, None, None

    @classmethod
    def filter_chronological_memories(
        cls,
        db: Session,
        user_id: int,
        query: str
    ) -> List[Dict[str, Any]]:
        """
        Parses temporal tags and extracts exact SQL bounds to reconstruct a 
        chronological event history relevant to the search context.
        """
        cleaned_query, start_time, end_time, custom_tag = cls.parse_temporal_query(query)
        
        # Base query for user memories
        q = db.query(Memory).filter(Memory.user_id == user_id)
        
        # Apply standard date limits
        if start_time and end_time:
            # Shift back to naive datetime to compare with DB timestamp if DB stores local/naive timezone
            q = q.filter(Memory.created_at >= start_time.replace(tzinfo=None), Memory.created_at <= end_time.replace(tzinfo=None))
            
        # Apply custom tag limits by checking joined TemporalInterval tables
        elif custom_tag:
            q = q.join(TemporalInterval).filter(TemporalInterval.name.ilike(f"%{custom_tag}%"))
            
        memories = q.order_by(Memory.created_at.asc()).all()
        
        # Build chronological timeline structure
        timeline = []
        for index, mem in enumerate(memories):
            timeline.append({
                "id": mem.id,
                "content": mem.content,
                "type": mem.type,
                "created_at": mem.created_at.isoformat(),
                "importance": mem.importance_score,
                "relativity": "Target Epoch" if (start_time or custom_tag) else "Standard Chronology",
                "timeline_position": index + 1
            })
            
        return timeline
