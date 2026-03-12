#!/bin/bash
# Forge Start Script
# Starts the database and dev server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Starting Forge..."
echo ""

# Start database
echo "1. Starting database..."
docker compose up -d

# Wait for healthy
echo "   Waiting for database to be ready..."
until docker exec forge_db pg_isready -U forge -d forge > /dev/null 2>&1; do
  sleep 1
done
echo "   Database ready."
echo ""

# Run backup of existing data before starting
if docker exec forge_db psql -U forge -d forge -c "SELECT 1 FROM agents LIMIT 1" > /dev/null 2>&1; then
  echo "2. Backing up existing data..."
  bash "$SCRIPT_DIR/backup.sh"
  echo ""
fi

# Start dev server
echo "3. Starting Next.js dev server..."
echo "   Open http://localhost:3000"
echo ""
npm run dev
