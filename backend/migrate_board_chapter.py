import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'novel_gear.db')

try:
    conn = sqlite3.connect(db_path)
    conn.execute('ALTER TABLE board_threads ADD COLUMN chapter_number VARCHAR(100)')
    conn.commit()
    conn.close()
    print("Successfully added chapter_number to board_threads")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")
    conn.close()
