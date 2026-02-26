import sqlite3
import json

def migrate():
    conn = sqlite3.connect('novel_gear.db')
    c = conn.cursor()

    # 1. Drop is_active from status_attributes
    try:
        # SQLite >= 3.35.0 supports DROP COLUMN
        c.execute("ALTER TABLE status_attributes DROP COLUMN is_active")
        print("Dropped is_active column from status_attributes.")
    except sqlite3.OperationalError as e:
        print(f"Could not drop column (maybe SQLite version too old or already dropped): {e}")

    # 2. Update modifiers in skills
    # First, get all status attributes to map key to name
    c.execute("SELECT key, name FROM status_attributes")
    attr_map = {row[0]: row[1] for row in c.fetchall()}
    print(f"Loaded {len(attr_map)} status attributes.")

    c.execute("SELECT id, modifiers FROM skills")
    skills = c.fetchall()
    for skill_id, mods_json in skills:
        if not mods_json:
            continue
        try:
            mods = json.loads(mods_json)
            updated = False
            for mod in mods:
                if 'attribute' in mod and 'attribute_name' not in mod:
                    mod['attribute_name'] = attr_map.get(mod['attribute'], "(不明なステータス)")
                    updated = True
            if updated:
                c.execute("UPDATE skills SET modifiers = ? WHERE id = ?", (json.dumps(mods), skill_id))
                print(f"Updated skill {skill_id} modifiers.")
        except Exception as e:
            print(f"Error updating skill {skill_id}: {e}")

    # 3. Update modifiers in equipments
    c.execute("SELECT id, modifiers FROM equipments")
    equipments = c.fetchall()
    for eq_id, mods_json in equipments:
        if not mods_json:
            continue
        try:
            mods = json.loads(mods_json)
            updated = False
            for mod in mods:
                if 'attribute' in mod and 'attribute_name' not in mod:
                    mod['attribute_name'] = attr_map.get(mod['attribute'], "(不明なステータス)")
                    updated = True
            if updated:
                c.execute("UPDATE equipments SET modifiers = ? WHERE id = ?", (json.dumps(mods), eq_id))
                print(f"Updated equipment {eq_id} modifiers.")
        except Exception as e:
            print(f"Error updating equipment {eq_id}: {e}")

    conn.commit()
    conn.close()
    print("Migration Phase 9.2 completed.")

if __name__ == "__main__":
    migrate()
