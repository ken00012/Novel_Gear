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

class CharacterStateCreate(CharacterStateBase):
    event_id: int

class CharacterState(CharacterStateBase):
    id: int
    character_id: int
    event_id: int

    class Config:
        from_attributes = True

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

class CharacterCreate(CharacterBase):
    pass

class Character(CharacterBase):
    id: int
    attributes: List[CustomAttribute] = []

    class Config:
        from_attributes = True
