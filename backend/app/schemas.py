from pydantic import BaseModel
from typing import Optional, Dict, Any, List

# Custom Attribute
class CustomAttributeBase(BaseModel):
    attribute_name: str
    attribute_value: Optional[str] = None
    is_public: bool = False

class CustomAttributeCreate(CustomAttributeBase):
    pass

class CustomAttribute(CustomAttributeBase):
    id: int
    character_id: int

    class Config:
        from_attributes = True

# Character State
class CharacterStateBase(BaseModel):
    hp_base: int = 0
    hp_mod: int = 0
    mp_base: int = 0
    mp_mod: int = 0
    str_base: int = 0
    str_mod: int = 0
    mag_base: int = 0
    mag_mod: int = 0
    spd_base: int = 0
    spd_mod: int = 0
    luk_base: int = 0
    luk_mod: int = 0
    visibility_settings: Dict[str, Any] = {}
    memo: Optional[str] = None
    job_id: Optional[int] = None
    level: Optional[int] = None

class CharacterStateCreate(CharacterStateBase):
    event_id: int

class CharacterState(CharacterStateBase):
    id: int
    character_id: int
    event_id: int
    job: Optional['Job'] = None
    skills: List['Skill'] = []
    equipments: List['Equipment'] = []

    class Config:
        from_attributes = True

# CharacterState Relationships Update (for saving state specific skills/equipments)
class CharacterStateRelationshipsUpdate(BaseModel):
    skill_ids: List[int] = []
    equipment_ids: List[int] = []

# Event
class EventBase(BaseModel):
    chapter_number: str
    event_name: str
    order_index: int = 0

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int

    class Config:
        from_attributes = True

# Character
class CharacterBase(BaseModel):
    name: str
    age: Optional[str] = None
    gender: Optional[str] = None
    faction: Optional[str] = None
    appearance: Optional[str] = None
    personality: Optional[str] = None
    memo: Optional[str] = None
    visibility_settings: Dict[str, Any] = {}
    is_status_enabled: bool = True
    job_id: Optional[int] = None
    level: int = 1
    talent_bonuses: Dict[str, Any] = {}

class CharacterCreate(CharacterBase):
    pass

class Character(CharacterBase):
    id: int
    attributes: List[CustomAttribute] = []
    job: Optional['Job'] = None
    skills: List['Skill'] = []
    equipments: List['Equipment'] = []

    class Config:
        from_attributes = True

# Job
class JobBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_stats: Dict[str, Any] = {}
    stat_growth: Dict[str, Any] = {}

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int

    class Config:
        from_attributes = True

# Skill
class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None
    modifiers: List[Dict[str, Any]] = []

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int

    class Config:
        from_attributes = True

# Equipment
class EquipmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    rarity: Optional[str] = None
    modifiers: List[Dict[str, Any]] = []

class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: int

    class Config:
        from_attributes = True

# Glossary
class GlossaryBase(BaseModel):
    term: str
    description: Optional[str] = None

class GlossaryCreate(GlossaryBase):
    pass

class Glossary(GlossaryBase):
    id: int

    class Config:
        from_attributes = True

# Character Relationships Update
class CharacterRelationshipsUpdate(BaseModel):
    skill_ids: List[int] = []
    equipment_ids: List[int] = []

# Plot (起承転結ボード)
class PlotBase(BaseModel):
    event_id: Optional[int] = None
    phase_type: str
    title: str
    character_arc: Optional[str] = None
    content: Optional[str] = None
    order_index: int = 0

class PlotCreate(PlotBase):
    pass

class Plot(PlotBase):
    id: int

    class Config:
        from_attributes = True

# Board Simulator
class BoardNamePresetBase(BaseModel):
    name: str
    user_id_str: Optional[str] = None
    order_index: int = 0

class BoardNamePresetCreate(BoardNamePresetBase):
    pass

class BoardNamePreset(BoardNamePresetBase):
    id: int

    class Config:
        from_attributes = True

class BoardPostBase(BaseModel):
    number: int
    name: str
    user_id_str: str
    content: str
    order_index: int = 0

class BoardPostCreate(BoardPostBase):
    thread_id: int

class BoardPost(BoardPostBase):
    id: int
    thread_id: int

    class Config:
        from_attributes = True

class BoardThreadBase(BaseModel):
    title: str
    thread_template: str = "1: 名無しさん : {{date}} ID:{{id}}\n{{title}}\n"
    post_template: str = "{{number}}: {{name}} ID:{{id}}\n{{content}}\n"

class BoardThreadCreate(BoardThreadBase):
    pass

class BoardThread(BoardThreadBase):
    id: int
    created_at: str
    posts: List[BoardPost] = []

    class Config:
        from_attributes = True
