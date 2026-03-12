#!/bin/bash
# Forge Stop Script
# Backs up data then stops the database

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Stopping Forge..."
echo ""

# Backup before stopping
if docker exec forge_db pg_isready -U forge -d forge > /dev/null 2>&1; then
  echo "1. Backing up database before shutdown..."
  bash "$SCRIPT_DIR/backup.sh"
  echo ""
fi

# Stop database
echo "2. Stopping database container..."
docker compose down

echo ""
echo "Forge stopped. Data is preserved in Docker volume 'forge_forge_data'."
echo "Backups are in ./backups/"
