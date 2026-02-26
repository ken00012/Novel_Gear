from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from . import models, schemas
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=engine)

def init_default_status_attributes():
    db = next(get_db())
    try:
        if db.query(models.StatusAttribute).count() == 0:
            defaults = [
                {"key": "hp", "name": "HP", "order_index": 1},
                {"key": "mp", "name": "MP", "order_index": 2},
                {"key": "str", "name": "筋力", "order_index": 3},
                {"key": "mag", "name": "魔力", "order_index": 4},
                {"key": "spd", "name": "速さ", "order_index": 5},
                {"key": "luk", "name": "運", "order_index": 6},
            ]
            for data in defaults:
                attr = models.StatusAttribute(**data)
                db.add(attr)
            db.commit()
    finally:
        db.close()

# Initialize default data
init_default_status_attributes()

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

@app.put("/api/profile_attributes/reorder")
def reorder_profile_attributes(updates: List[schemas.OrderUpdate], db: Session = Depends(get_db)):
    for update in updates:
        db.execute(
            models.CharacterProfileAttribute.__table__.update()
            .where(models.CharacterProfileAttribute.id == update.id)
            .values(order_index=update.order_index)
        )
    db.commit()
    return {"ok": True}

@app.get("/api/profile_attributes/", response_model=List[schemas.CharacterProfileAttribute])
def read_profile_attributes(db: Session = Depends(get_db)):
    return db.query(models.CharacterProfileAttribute).order_by(models.CharacterProfileAttribute.order_index).all()

@app.post("/api/profile_attributes/", response_model=schemas.CharacterProfileAttribute)
def create_profile_attribute(attr: schemas.CharacterProfileAttributeCreate, db: Session = Depends(get_db)):
    new_key = "attr_" + str(uuid.uuid4())[:8]
    db_attr = models.CharacterProfileAttribute(**attr.model_dump(), key=new_key)
    db.add(db_attr)
    db.commit()
    db.refresh(db_attr)
    return db_attr

@app.put("/api/profile_attributes/{attribute_id}", response_model=schemas.CharacterProfileAttribute)
def update_profile_attribute(attribute_id: int, attr: schemas.CharacterProfileAttributeCreate, db: Session = Depends(get_db)):
    db_attr = db.query(models.CharacterProfileAttribute).filter(models.CharacterProfileAttribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Profile Attribute not found")
    for var, value in attr.model_dump().items():
        setattr(db_attr, var, value)
    db.commit()
    db.refresh(db_attr)
    return db_attr

@app.delete("/api/profile_attributes/{attribute_id}")
def delete_profile_attribute(attribute_id: int, db: Session = Depends(get_db)):
    db_attr = db.query(models.CharacterProfileAttribute).filter(models.CharacterProfileAttribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Profile Attribute not found")
    db.delete(db_attr)
    db.commit()
    return {"ok": True}

# --- Tags ---
@app.post("/api/profile_attributes/{attribute_id}/tags/", response_model=schemas.Tag)
def create_tag(attribute_id: int, tag: schemas.TagCreate, db: Session = Depends(get_db)):
    db_attr = db.query(models.CharacterProfileAttribute).filter(models.CharacterProfileAttribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Profile Attribute not found")
    db_tag = models.Tag(**tag.model_dump(), attribute_id=attribute_id)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.put("/api/tags/{tag_id}", response_model=schemas.Tag)
def update_tag(tag_id: int, tag: schemas.TagCreate, db: Session = Depends(get_db)):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    for var, value in tag.model_dump().items():
        setattr(db_tag, var, value)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.delete("/api/tags/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(db_tag)
    db.commit()
    return {"ok": True}

# --- Status Attributes (Dynamic Settings) ---
@app.get("/api/status_attributes/", response_model=List[schemas.StatusAttribute])
def read_status_attributes(db: Session = Depends(get_db)):
    return db.query(models.StatusAttribute).order_by(models.StatusAttribute.order_index).all()

@app.put("/api/status_attributes/reorder")
def reorder_status_attributes(updates: List[schemas.OrderUpdate], db: Session = Depends(get_db)):
    for update in updates:
        db.execute(
            models.StatusAttribute.__table__.update()
            .where(models.StatusAttribute.id == update.id)
            .values(order_index=update.order_index)
        )
    db.commit()
    return {"ok": True}

@app.post("/api/status_attributes/", response_model=schemas.StatusAttribute)
def create_status_attribute(attr: schemas.StatusAttributeCreate, db: Session = Depends(get_db)):
    new_key = "stat_" + str(uuid.uuid4())[:8]
    db_attr = models.StatusAttribute(**attr.model_dump(), key=new_key)
    db.add(db_attr)
    db.commit()
    db.refresh(db_attr)
    return db_attr

@app.put("/api/status_attributes/{attribute_id}", response_model=schemas.StatusAttribute)
def update_status_attribute(attribute_id: int, attr: schemas.StatusAttributeCreate, db: Session = Depends(get_db)):
    db_attr = db.query(models.StatusAttribute).filter(models.StatusAttribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Status Attribute not found")
    for var, value in attr.model_dump().items():
        setattr(db_attr, var, value)
    db.commit()
    db.refresh(db_attr)
    return db_attr

@app.delete("/api/status_attributes/{attribute_id}")
def delete_status_attribute(attribute_id: int, db: Session = Depends(get_db)):
    db_attr = db.query(models.StatusAttribute).filter(models.StatusAttribute.id == attribute_id).first()
    if not db_attr:
        raise HTTPException(status_code=404, detail="Status Attribute not found")
    db.delete(db_attr)
    db.commit()
    return {"ok": True}

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

# --- Plots ---
@app.get("/api/plots/", response_model=List[schemas.Plot])
def read_plots(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Plot).order_by(models.Plot.order_index).offset(skip).limit(limit).all()

@app.post("/api/plots/", response_model=schemas.Plot)
def create_plot(plot: schemas.PlotCreate, db: Session = Depends(get_db)):
    db_plot = models.Plot(**plot.model_dump())
    db.add(db_plot)
    db.commit()
    db.refresh(db_plot)
    return db_plot

@app.put("/api/plots/{plot_id}", response_model=schemas.Plot)
def update_plot(plot_id: int, plot: schemas.PlotCreate, db: Session = Depends(get_db)):
    db_plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    if not db_plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    for var, value in plot.model_dump().items():
        setattr(db_plot, var, value)
    db.commit()
    db.refresh(db_plot)
    return db_plot

@app.delete("/api/plots/{plot_id}")
def delete_plot(plot_id: int, db: Session = Depends(get_db)):
    db_plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    if not db_plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    db.delete(db_plot)
    db.commit()
    return {"ok": True}

# --- Board Threads ---
@app.get("/api/board_threads/", response_model=List[schemas.BoardThread])
def read_board_threads(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.BoardThread).order_by(models.BoardThread.id.desc()).offset(skip).limit(limit).all()

@app.post("/api/board_threads/", response_model=schemas.BoardThread)
def create_board_thread(thread: schemas.BoardThreadCreate, db: Session = Depends(get_db)):
    db_thread = models.BoardThread(**thread.model_dump())
    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)
    return db_thread

@app.put("/api/board_threads/{thread_id}", response_model=schemas.BoardThread)
def update_board_thread(thread_id: int, thread: schemas.BoardThreadCreate, db: Session = Depends(get_db)):
    db_thread = db.query(models.BoardThread).filter(models.BoardThread.id == thread_id).first()
    if not db_thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    for var, value in thread.model_dump().items():
        setattr(db_thread, var, value)
    db.commit()
    db.refresh(db_thread)
    return db_thread

@app.delete("/api/board_threads/{thread_id}")
def delete_board_thread(thread_id: int, db: Session = Depends(get_db)):
    db_thread = db.query(models.BoardThread).filter(models.BoardThread.id == thread_id).first()
    if not db_thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    db.delete(db_thread)
    db.commit()
    return {"ok": True}

# --- Board Posts ---
@app.get("/api/board_threads/{thread_id}/posts/", response_model=List[schemas.BoardPost])
def read_board_posts(thread_id: int, db: Session = Depends(get_db)):
    return db.query(models.BoardPost).filter(models.BoardPost.thread_id == thread_id).order_by(models.BoardPost.number).all()

@app.post("/api/board_posts/", response_model=schemas.BoardPost)
def create_board_post(post: schemas.BoardPostCreate, db: Session = Depends(get_db)):
    db_post = models.BoardPost(**post.model_dump())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.put("/api/board_posts/{post_id}", response_model=schemas.BoardPost)
def update_board_post(post_id: int, post: schemas.BoardPostCreate, db: Session = Depends(get_db)):
    db_post = db.query(models.BoardPost).filter(models.BoardPost.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    for var, value in post.model_dump().items():
        setattr(db_post, var, value)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.delete("/api/board_posts/{post_id}")
def delete_board_post(post_id: int, db: Session = Depends(get_db)):
    db_post = db.query(models.BoardPost).filter(models.BoardPost.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(db_post)
    db.commit()
    return {"ok": True}

@app.put("/api/board_posts/bulk_update/")
def bulk_update_board_posts(posts: List[schemas.BoardPost], db: Session = Depends(get_db)):
    for post in posts:
        db_post = db.query(models.BoardPost).filter(models.BoardPost.id == post.id).first()
        if db_post:
            db_post.number = post.number
            db_post.order_index = post.order_index
            db_post.name = post.name
            db_post.user_id_str = post.user_id_str
            db_post.content = post.content
    db.commit()
    return {"ok": True}

# --- Board Name Presets ---
@app.get("/api/board_name_presets/", response_model=List[schemas.BoardNamePreset])
def read_board_name_presets(db: Session = Depends(get_db)):
    return db.query(models.BoardNamePreset).order_by(models.BoardNamePreset.order_index).all()

@app.post("/api/board_name_presets/", response_model=schemas.BoardNamePreset)
def create_board_name_preset(preset: schemas.BoardNamePresetCreate, db: Session = Depends(get_db)):
    db_preset = models.BoardNamePreset(**preset.model_dump())
    db.add(db_preset)
    db.commit()
    db.refresh(db_preset)
    return db_preset

@app.put("/api/board_name_presets/{preset_id}", response_model=schemas.BoardNamePreset)
def update_board_name_preset(preset_id: int, preset: schemas.BoardNamePresetCreate, db: Session = Depends(get_db)):
    db_preset = db.query(models.BoardNamePreset).filter(models.BoardNamePreset.id == preset_id).first()
    if not db_preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    for var, value in preset.model_dump().items():
        setattr(db_preset, var, value)
    db.commit()
    db.refresh(db_preset)
    return db_preset

@app.delete("/api/board_name_presets/{preset_id}")
def delete_board_name_preset(preset_id: int, db: Session = Depends(get_db)):
    db_preset = db.query(models.BoardNamePreset).filter(models.BoardNamePreset.id == preset_id).first()
    if not db_preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    db.delete(db_preset)
    db.commit()
    return {"ok": True}

# --- App Settings ---
@app.get("/api/app_settings/{key}", response_model=schemas.AppSettings)
def read_app_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(models.AppSettings).filter(models.AppSettings.setting_key == key).first()
    if not setting:
        # Default fallback mechanism for UI settings
        default_value = []
        if key == "card_display_items":
            default_value = ["陣営"] # デフォルトでは陣営を表示する
            
        setting = models.AppSettings(setting_key=key, setting_value=default_value)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@app.put("/api/app_settings/{key}", response_model=schemas.AppSettings)
def update_app_setting(key: str, setting_update: schemas.AppSettingsCreate, db: Session = Depends(get_db)):
    setting = db.query(models.AppSettings).filter(models.AppSettings.setting_key == key).first()
    if not setting:
        setting = models.AppSettings(setting_key=key, setting_value=setting_update.setting_value)
        db.add(setting)
    else:
        setting.setting_value = setting_update.setting_value
    db.commit()
    db.refresh(setting)
    return setting
