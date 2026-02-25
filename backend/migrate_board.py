import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'app', 'sql_app.db')
if not os.path.exists(db_path):
    print(f"DB not found at: {db_path}")
    db_path = os.path.join(os.path.dirname(__file__), 'sql_app.db')

print(f"Using DB at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    conn.execute('ALTER TABLE board_threads ADD COLUMN start_index INTEGER DEFAULT 1')
    conn.commit()
    conn.close()
    print("Successfully added start_index to board_threads")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")
    conn.close()
