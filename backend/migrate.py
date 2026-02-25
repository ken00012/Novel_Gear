import sqlite3
import json

conn = sqlite3.connect('novel_gear.db')
c = conn.cursor()

# Check if columns exist
c.execute("PRAGMA table_info(character_states)")
columns = [col[1] for col in c.fetchall()]

if 'base_stats' not in columns:
    c.execute("ALTER TABLE character_states ADD COLUMN base_stats JSON DEFAULT '{}'")
    print("Added base_stats")

if 'mod_stats' not in columns:
    c.execute("ALTER TABLE character_states ADD COLUMN mod_stats JSON DEFAULT '{}'")
    print("Added mod_stats")

conn.commit()
conn.close()
print("Migration done.")
