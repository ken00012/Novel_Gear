from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True)
    age = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    faction = Column(String(50), nullable=True)
    appearance = Column(Text, nullable=True)
    personality = Column(Text, nullable=True)
    memo = Column(Text, nullable=True)
    
    # JSON to store visibility flags: e.g. {"age": True, "gender": False}
    visibility_settings = Column(JSON, default={})

    attributes = relationship("CustomAttribute", back_populates="character", cascade="all, delete-orphan")
    states = relationship("CharacterState", back_populates="character", cascade="all, delete-orphan")


class CustomAttribute(Base):
    __tablename__ = "custom_attributes"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"))
    attribute_name = Column(String(100))
    attribute_value = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)

    character = relationship("Character", back_populates="attributes")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    chapter_number = Column(String(50))
    event_name = Column(String(100))
    order_index = Column(Integer, default=0, index=True)

    states = relationship("CharacterState", back_populates="event", cascade="all, delete-orphan")


class CharacterState(Base):
    __tablename__ = "character_states"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"))
    event_id = Column(Integer, ForeignKey("events.id"))

    # stats
    hp_base = Column(Integer, default=0)
    hp_mod = Column(Integer, default=0)
    mp_base = Column(Integer, default=0)
    mp_mod = Column(Integer, default=0)
    str_base = Column(Integer, default=0)
    str_mod = Column(Integer, default=0)
    mag_base = Column(Integer, default=0)
    mag_mod = Column(Integer, default=0)
    spd_base = Column(Integer, default=0)
    spd_mod = Column(Integer, default=0)
    luk_base = Column(Integer, default=0)
    luk_mod = Column(Integer, default=0)

    # visibility for stats
    visibility_settings = Column(JSON, default={})

    character = relationship("Character", back_populates="states")
    event = relationship("Event", back_populates="states")
