from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Novel Gear API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Characters ---
@app.get("/api/characters/", response_model=List[schemas.Character])
def read_characters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    characters = db.query(models.Character).offset(skip).limit(limit).all()
    return characters

@app.post("/api/characters/", response_model=schemas.Character)
def create_character(character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    db_character = models.Character(**character.model_dump())
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

@app.get("/api/characters/{character_id}", response_model=schemas.Character)
def read_character(character_id: int, db: Session = Depends(get_db)):
    db_character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@app.put("/api/characters/{character_id}", response_model=schemas.Character)
def update_character(character_id: int, character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    db_character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not db_character:
        raise HTTPException(status_code=404, detail="Character not found")
    for var, value in character.model_dump().items():
        setattr(db_character, var, value)
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

@app.delete("/api/characters/{character_id}")
def delete_character(character_id: int, db: Session = Depends(get_db)):
    db_character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not db_character:
        raise HTTPException(status_code=404, detail="Character not found")
    db.delete(db_character)
    db.commit()
    return {"ok": True}

# --- Custom Attributes ---
@app.post("/api/characters/{character_id}/attributes/", response_model=schemas.CustomAttribute)
def create_character_attribute(character_id: int, attribute: schemas.CustomAttributeCreate, db: Session = Depends(get_db)):
    db_attr = models.CustomAttribute(**attribute.model_dump(), character_id=character_id)
    db.add(db_attr)
    db.commit()
    db.refresh(db_attr)
    return db_attr

@app.delete("/api/attributes/{attribute_id}")
def delete_attribute(attribute_id: int, db: Session = Depends(get_db)):
    db_attr = db.query(models.CustomAttribute).filter(models.CustomAttribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    db.delete(db_attr)
    db.commit()
    return {"ok": True}

@app.put("/api/attributes/{attribute_id}", response_model=schemas.CustomAttribute)
def update_attribute(attribute_id: int, attribute: schemas.CustomAttributeCreate, db: Session = Depends(get_db)):
    db_attr = db.query(models.CustomAttribute).filter(models.CustomAttribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
    for var, value in attribute.model_dump().items():
        setattr(db_attr, var, value)
    db.add(db_attr)
    db.commit()
    db.refresh(db_attr)
    return db_attr

# --- Events ---
@app.get("/api/events/", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.order_index).offset(skip).limit(limit).all()

@app.post("/api/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    db_event = models.Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

# --- Character States ---
@app.get("/api/states/", response_model=List[schemas.CharacterState])
def get_states(character_id: int = None, event_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.CharacterState)
    if character_id:
        query = query.filter(models.CharacterState.character_id == character_id)
    if event_id:
        query = query.filter(models.CharacterState.event_id == event_id)
    return query.all()

@app.post("/api/characters/{character_id}/states/", response_model=schemas.CharacterState)
def create_or_update_state(character_id: int, state: schemas.CharacterStateCreate, db: Session = Depends(get_db)):
    db_state = db.query(models.CharacterState).filter(
        models.CharacterState.character_id == character_id,
        models.CharacterState.event_id == state.event_id
    ).first()
    
    if db_state:
        for var, value in state.model_dump().items():
            setattr(db_state, var, value)
    else:
        db_state = models.CharacterState(**state.model_dump(), character_id=character_id)
        
    db.add(db_state)
    db.commit()
    db.refresh(db_state)
    return db_state
