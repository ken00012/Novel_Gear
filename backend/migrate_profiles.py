import sys
import os
import uuid

# Add the parent directory to sys.path to easily import the app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app import models
from sqlalchemy import text

def get_or_create_attribute(db, name, type="text"):
    attr = db.query(models.CharacterProfileAttribute).filter_by(name=name).first()
    if not attr:
        attr = models.CharacterProfileAttribute(
            key="attr_" + str(uuid.uuid4())[:8],
            name=name,
            type=type,
            order_index=db.query(models.CharacterProfileAttribute).count() + 1
        )
        db.add(attr)
        db.commit()
        db.refresh(attr)
    return attr

def migrate():
    # 1. データベース上のテーブルを作成 (既存テーブルはそのまま、新テーブルが作られる)
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1.1 Add column if it doesn't exist
        try:
            db.execute(text("ALTER TABLE characters ADD COLUMN profile_data TEXT DEFAULT '{}';"))
            db.commit()
            print("Added profile_data column to characters table.")
        except Exception as e:
            # Column might already exist
            db.rollback()
            pass
        # 2. デフォルトのプロファイル属性項目を作成
        attr_age = get_or_create_attribute(db, "年齢", "text")
        attr_gender = get_or_create_attribute(db, "性別", "text")
        attr_faction = get_or_create_attribute(db, "陣営", "tag")
        attr_appearance = get_or_create_attribute(db, "外見", "text")
        attr_personality = get_or_create_attribute(db, "性格", "text")
        attr_memo = get_or_create_attribute(db, "メモ", "text")

        # 3. 既存のキャラクターを取得
        characters = db.query(models.Character).all()

        # 陣営のユニークな値を抽出してタグを作成
        factions = set()
        for char in characters:
            if char.faction and char.faction.strip():
                factions.add(char.faction.strip())

        tag_map = {}
        for f in factions:
            tag = db.query(models.Tag).filter_by(attribute_id=attr_faction.id, name=f).first()
            if not tag:
                tag = models.Tag(attribute_id=attr_faction.id, name=f)
                db.add(tag)
                db.commit()
                db.refresh(tag)
            tag_map[f] = tag

        # 4. キャラクターデータの移行
        migrated_count = 0
        for char in characters:
            profile_data = char.profile_data or {}
            updated = False

            if char.age and not profile_data.get(attr_age.key):
                profile_data[attr_age.key] = char.age
                updated = True
            if char.gender and not profile_data.get(attr_gender.key):
                profile_data[attr_gender.key] = char.gender
                updated = True
            if char.faction and char.faction.strip() and not profile_data.get(attr_faction.key):
                # Save just the tag name or ID? Let's save the tag name or an array of tags
                # Tag selection UI usually handles an array of strings
                tag = tag_map.get(char.faction.strip())
                if tag:
                    profile_data[attr_faction.key] = tag.name
                    updated = True
            if char.appearance and not profile_data.get(attr_appearance.key):
                profile_data[attr_appearance.key] = char.appearance
                updated = True
            if char.personality and not profile_data.get(attr_personality.key):
                profile_data[attr_personality.key] = char.personality
                updated = True
            if char.memo and not profile_data.get(attr_memo.key):
                profile_data[attr_memo.key] = char.memo
                updated = True

            if updated:
                char.profile_data = profile_data
                migrated_count += 1

        db.commit()
        print(f"Migration completed successfully. Migrated {migrated_count} characters.")

    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
