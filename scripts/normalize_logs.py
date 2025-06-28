import json
from pathlib import Path
import sys
from shutil import copy2

LOGS_PATH = Path(__file__).parent.parent / 'data' / 'logs.json'

# Validate file exists
if not LOGS_PATH.exists():
    print(f"Error: Log file not found at {LOGS_PATH}")
    sys.exit(1)

# Create backup
backup_path = LOGS_PATH.with_suffix('.json.backup')
copy2(LOGS_PATH, backup_path)
print(f"Created backup at {backup_path}")

# Load and parse JSON with error handling
try:
    with open(LOGS_PATH, 'r', encoding='utf-8') as f:
        logs = json.load(f)
except (json.JSONDecodeError, IOError) as e:
    print(f"Error reading log file: {e}")
    sys.exit(1)

# Validate top-level structure
if not isinstance(logs, list):
    print(f"Error: Expected list of log entries, got {type(logs)}")
    sys.exit(1)

normalized = []
for entry in logs:
    if not isinstance(entry, dict):
        print(f"Warning: Skipping non-dict entry: {entry}")
        continue

    # Unify id
    entry_id = entry.get('id') or entry.get('message_id')
    if entry_id is None:
        print(f"Warning: Entry missing both 'id' and 'message_id': {entry}")
        continue

    # Unify suggestion
    suggestion = entry.get('suggestion')
    if not suggestion:
        suggestion = entry.get('reply') or ''

    # used_template
    used_template = entry.get('used_template')
    if used_template is None:
        used_template = False

    # resolved
    resolved = entry.get('resolved')
    if resolved is None:
        resolved = False

    # Build normalized entry
    norm = dict(entry)  # copy all fields
    norm['id'] = entry_id
    norm['suggestion'] = suggestion
    norm['used_template'] = used_template
    norm['resolved'] = resolved
    # Remove old keys if present
    norm.pop('message_id', None)
    norm.pop('reply', None)
    normalized.append(norm)

# Write normalized logs with error handling
try:
    with open(LOGS_PATH, 'w', encoding='utf-8') as f:
        json.dump(normalized, f, indent=2)
    print(f"Normalized {len(normalized)} log entries in {LOGS_PATH}")
except (IOError, TypeError, json.JSONDecodeError) as e:
    print(f"Error writing normalized logs to {LOGS_PATH}: {e}")
    sys.exit(1) 