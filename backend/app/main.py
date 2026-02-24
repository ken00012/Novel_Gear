from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

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

@app.put("/api/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event: schemas.EventCreate, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    for var, value in event.model_dump().items():
        setattr(db_event, var, value)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"ok": True}

# --- Character States ---
@app.get("/api/states/", response_model=List[schemas.CharacterState])
def get_states(character_id: Optional[int] = None, event_id: Optional[int] = None, db: Session = Depends(get_db)):
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

@app.put("/api/characters/{character_id}/states/{state_id}/relationships", response_model=schemas.CharacterState)
def update_state_relationships(character_id: int, state_id: int, req: schemas.CharacterStateRelationshipsUpdate, db: Session = Depends(get_db)):
    db_state = db.query(models.CharacterState).filter(
        models.CharacterState.id == state_id,
        models.CharacterState.character_id == character_id
    ).first()

    if not db_state:
        raise HTTPException(status_code=404, detail="Character State not found")
    
    # Update skills
    skills = db.query(models.Skill).filter(models.Skill.id.in_(req.skill_ids)).all()
    db_state.skills = skills
    
    # Update equipments
    equipments = db.query(models.Equipment).filter(models.Equipment.id.in_(req.equipment_ids)).all()
    db_state.equipments = equipments

    db.commit()
    db.refresh(db_state)
    return db_state

# --- Character Relationships (Skills/Equipments) ---
@app.put("/api/characters/{character_id}/relationships", response_model=schemas.Character)
def update_character_relationships(character_id: int, req: schemas.CharacterRelationshipsUpdate, db: Session = Depends(get_db)):
    db_character = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not db_character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Update skills
    skills = db.query(models.Skill).filter(models.Skill.id.in_(req.skill_ids)).all()
    db_character.skills = skills
    
    # Update equipments
    equipments = db.query(models.Equipment).filter(models.Equipment.id.in_(req.equipment_ids)).all()
    db_character.equipments = equipments

    db.commit()
    db.refresh(db_character)
    return db_character

# --- Jobs ---
@app.get("/api/jobs/", response_model=List[schemas.Job])
def read_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Job).offset(skip).limit(limit).all()

@app.post("/api/jobs/", response_model=schemas.Job)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = models.Job(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.put("/api/jobs/{job_id}", response_model=schemas.Job)
def update_job(job_id: int, job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    for var, value in job.model_dump().items():
        setattr(db_job, var, value)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    db_job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(db_job)
    db.commit()
    return {"ok": True}

# --- Skills ---
@app.get("/api/skills/", response_model=List[schemas.Skill])
def read_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Skill).offset(skip).limit(limit).all()

@app.post("/api/skills/", response_model=schemas.Skill)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    db_skill = models.Skill(**skill.model_dump())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@app.put("/api/skills/{skill_id}", response_model=schemas.Skill)
def update_skill(skill_id: int, skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    for var, value in skill.model_dump().items():
        setattr(db_skill, var, value)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@app.delete("/api/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(db_skill)
    db.commit()
    return {"ok": True}

# --- Equipments ---
@app.get("/api/equipments/", response_model=List[schemas.Equipment])
def read_equipments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Equipment).offset(skip).limit(limit).all()

@app.post("/api/equipments/", response_model=schemas.Equipment)
def create_equipment(equipment: schemas.EquipmentCreate, db: Session = Depends(get_db)):
    db_equipment = models.Equipment(**equipment.model_dump())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

@app.put("/api/equipments/{equipment_id}", response_model=schemas.Equipment)
def update_equipment(equipment_id: int, equipment: schemas.EquipmentCreate, db: Session = Depends(get_db)):
    db_equipment = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for var, value in equipment.model_dump().items():
        setattr(db_equipment, var, value)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

@app.delete("/api/equipments/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    db_equipment = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(db_equipment)
    db.commit()
    return {"ok": True}

# --- Glossary ---
@app.get("/api/glossary/", response_model=List[schemas.Glossary])
def read_glossary(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Glossary).offset(skip).limit(limit).all()

@app.post("/api/glossary/", response_model=schemas.Glossary)
def create_glossary(glossary: schemas.GlossaryCreate, db: Session = Depends(get_db)):
    db_glossary = models.Glossary(**glossary.model_dump())
    db.add(db_glossary)
    db.commit()
    db.refresh(db_glossary)
    return db_glossary

@app.put("/api/glossary/{glossary_id}", response_model=schemas.Glossary)
def update_glossary(glossary_id: int, glossary: schemas.GlossaryCreate, db: Session = Depends(get_db)):
    db_glossary = db.query(models.Glossary).filter(models.Glossary.id == glossary_id).first()
    if not db_glossary:
        raise HTTPException(status_code=404, detail="Glossary not found")
    for var, value in glossary.model_dump().items():
        setattr(db_glossary, var, value)
    db.commit()
    db.refresh(db_glossary)
    return db_glossary

@app.delete("/api/glossary/{glossary_id}")
def delete_glossary(glossary_id: int, db: Session = Depends(get_db)):
    db_glossary = db.query(models.Glossary).filter(models.Glossary.id == glossary_id).first()
    if not db_glossary:
        raise HTTPException(status_code=404, detail="Glossary not found")
    db.delete(db_glossary)
    db.commit()
    return {"ok": True}
