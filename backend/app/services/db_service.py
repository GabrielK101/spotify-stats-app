from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from typing import Optional, Dict, Any, List
from ..db.models import User, ListeningHistory

class DBService:
    @staticmethod
    def get_user(db: Session, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.user_id == user_id).first()
    
    @staticmethod
    def upsert_user(db: Session, user_data: Dict[str, Any]) -> User:
        """Insert or update user"""
        user = db.query(User).filter(User.user_id == user_data['user_id']).first()
        
        if user:
            # Update existing user
            for key, value in user_data.items():
                setattr(user, key, value)
            user.updated_at = datetime.utcnow()
        else:
            # Create new user
            user = User(**user_data)
            db.add(user)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_user_tokens(db: Session, user_id: str, access_token: str, 
                          token_expiry: datetime, refresh_token: Optional[str] = None):
        """Update user's access token and expiry"""
        user = db.query(User).filter(User.user_id == user_id).first()
        if user:
            user.access_token = access_token
            user.token_expiry = token_expiry
            if refresh_token:
                user.refresh_token = refresh_token
            user.updated_at = datetime.utcnow()
            db.commit()
    
    @staticmethod
    def save_listening_history(db: Session, user_id: str, tracks_data: List[Dict[str, Any]]) -> int:
        """
        Save listening history tracks for a user
        Returns number of new tracks saved
        """
        saved_count = 0
        
        for track_data in tracks_data:
            try:
                history = ListeningHistory(
                    user_id=user_id,
                    track_id=track_data['track_id'],
                    track_name=track_data.get('track_name'),
                    artist_name=track_data.get('artist_name'),
                    artist_id=track_data.get('artist_id'),
                    album_name=track_data.get('album_name'),
                    played_at=track_data['played_at'],
                    duration_ms=track_data.get('duration_ms'),
                    image_url=track_data.get('image_url')
                )
                db.add(history)
                db.commit()
                saved_count += 1
            except IntegrityError:
                # Track already exists (duplicate), skip it
                db.rollback()
                continue
            except Exception as e:
                print(f"Error saving track {track_data.get('track_id')}: {e}")
                db.rollback()
                continue
        
        return saved_count
    
    @staticmethod
    def get_user_listening_history(db: Session, user_id: str, limit: int = 100, offset: int = 0):
        """Get listening history for a user"""
        return db.query(ListeningHistory)\
            .filter(ListeningHistory.user_id == user_id)\
            .order_by(ListeningHistory.played_at.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()
    
    @staticmethod
    def get_all_active_users(db: Session) -> List[User]:
        """Get all users who have valid tokens for polling"""
        return db.query(User)\
            .filter(User.refresh_token.isnot(None))\
            .all()