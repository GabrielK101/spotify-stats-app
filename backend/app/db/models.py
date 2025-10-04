from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String(255), primary_key=True)
    display_name = Column(String(255))
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expiry = Column(DateTime(timezone=True))
    profile_pic_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ListeningHistory(Base):
    __tablename__ = "listening_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    track_id = Column(String(255), nullable=False)
    track_name = Column(String(500))
    artist_name = Column(String(500))
    artist_id = Column(String(255))
    album_name = Column(String(500))
    played_at = Column(DateTime(timezone=True), nullable=False)
    duration_ms = Column(Integer)
    image_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('user_id', 'track_id', 'played_at', name='uix_user_track_played'),
    )