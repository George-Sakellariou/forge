#!/bin/bash
# Forge DB Backup Script
# Creates timestamped backups and keeps the last 10

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/forge_${TIMESTAMP}.sql"
MAX_BACKUPS=10

mkdir -p "$BACKUP_DIR"

echo "Backing up Forge database..."

docker exec forge_db pg_dump -U forge -d forge --clean --if-exists > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
  FILESIZE=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
  echo "Backup created: $BACKUP_FILE (${FILESIZE} bytes)"

  # Keep only last N backups
  cd "$BACKUP_DIR"
  ls -t forge_*.sql 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null

  REMAINING=$(ls forge_*.sql 2>/dev/null | wc -l | tr -d ' ')
  echo "Backups retained: $REMAINING / $MAX_BACKUPS max"
else
  echo "ERROR: Backup failed. Is the database running?"
  rm -f "$BACKUP_FILE"
  exit 1
fi
