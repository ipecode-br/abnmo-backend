#!/bin/sh
set -e

echo "Waiting for database..."

until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done

echo "Database is up"

echo "Running migrations..."
node node_modules/typeorm/cli.js \
  -d dist/infra/database/data.source.js \
  migration:run

echo "Starting API..."
exec node dist/src/app/main.js
