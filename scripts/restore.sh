#!/bin/bash
# Forge DB Restore Script
# Restores from the latest backup or a specific file

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"

if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/forge_*.sql 2>/dev/null | head -1)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: No backup file found."
  echo "Usage: $0 [backup_file.sql]"
  echo ""
  echo "Available backups:"
  ls -lt "$BACKUP_DIR"/forge_*.sql 2>/dev/null || echo "  (none)"
  exit 1
fi

echo "Restoring from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database. Continue? (y/N)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Cancelled."
  exit 0
fi

cat "$BACKUP_FILE" | docker exec -i forge_db psql -U forge -d forge 2>/dev/null

if [ $? -eq 0 ]; then
  echo "Restore complete."
else
  echo "ERROR: Restore failed."
  exit 1
fi
