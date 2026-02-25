from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, JSON, Table
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

    is_status_enabled = Column(Boolean, default=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    level = Column(Integer, default=1)
    talent_bonuses = Column(JSON, default={})

    attributes = relationship("CustomAttribute", back_populates="character", cascade="all, delete-orphan")
    states = relationship("CharacterState", back_populates="character", cascade="all, delete-orphan")
    
    job = relationship("Job", back_populates="characters")
    skills = relationship("Skill", secondary="character_skills", backref="characters")
    equipments = relationship("Equipment", secondary="character_equipments", backref="characters")


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

    # Event specific note
    memo = Column(Text, nullable=True)

    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    level = Column(Integer, nullable=True)

    character = relationship("Character", back_populates="states")
    event = relationship("Event", back_populates="states")
    job = relationship("Job", foreign_keys=[job_id])
    skills = relationship("Skill", secondary="character_state_skills")
    equipments = relationship("Equipment", secondary="character_state_equipments")

# Many-to-Many Association Tables for Global Character
character_skills = Table(
    "character_skills",
    Base.metadata,
    Column("character_id", Integer, ForeignKey("characters.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True)
)

character_equipments = Table(
    "character_equipments",
    Base.metadata,
    Column("character_id", Integer, ForeignKey("characters.id"), primary_key=True),
    Column("equipment_id", Integer, ForeignKey("equipments.id"), primary_key=True)
)

# Many-to-Many Association Tables for CharacterState (Event specific)
character_state_skills = Table(
    "character_state_skills",
    Base.metadata,
    Column("state_id", Integer, ForeignKey("character_states.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id"), primary_key=True)
)

character_state_equipments = Table(
    "character_state_equipments",
    Base.metadata,
    Column("state_id", Integer, ForeignKey("character_states.id"), primary_key=True),
    Column("equipment_id", Integer, ForeignKey("equipments.id"), primary_key=True)
)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    base_stats = Column(JSON, default={})
    stat_growth = Column(JSON, default={})
    
    characters = relationship("Character", back_populates="job")

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    modifiers = Column(JSON, default=[])

class Equipment(Base):
    __tablename__ = "equipments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    rarity = Column(String(20), nullable=True)
    modifiers = Column(JSON, default=[])

class Glossary(Base):
    __tablename__ = "glossary"
    id = Column(Integer, primary_key=True, index=True)
    term = Column(String(200), index=True)
    description = Column(Text, nullable=True)

class Plot(Base):
    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    phase_type = Column(String(20), index=True)
    title = Column(String(200))
    character_arc = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, index=True)

    event = relationship("Event", backref="plots")

# --- Status Attributes ---
class StatusAttribute(Base):
    __tablename__ = "status_attributes"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True)
    name = Column(String(50))
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, index=True)
    is_active = Column(Boolean, default=True, index=True)

# --- Board Simulator ---
from datetime import datetime

class BoardThread(Base):
    __tablename__ = "board_threads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True)
    thread_template = Column(Text, default="1: 名無しさん : {{date}} ID:{{id}}\n{{title}}\n")
    post_template = Column(Text, default="{{number}}: {{name}} ID:{{id}}\n{{content}}\n")
    created_at = Column(String(50), default=lambda: datetime.now().isoformat())

    posts = relationship("BoardPost", back_populates="thread", cascade="all, delete-orphan")

class BoardPost(Base):
    __tablename__ = "board_posts"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("board_threads.id"))
    number = Column(Integer, index=True)
    name = Column(String(100))
    user_id_str = Column(String(50))
    content = Column(Text)
    order_index = Column(Integer, default=0, index=True)

    thread = relationship("BoardThread", back_populates="posts")

class BoardNamePreset(Base):
    __tablename__ = "board_name_presets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    user_id_str = Column(String(50), nullable=True)
    order_index = Column(Integer, default=0, index=True)
