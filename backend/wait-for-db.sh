#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Parsing DATABASE_URL..."

  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's#.*@([^:/]+):.*#\1#')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's#.*:([0-9]+)/.*#\1#')
  DB_USER=$(echo "$DATABASE_URL" | sed -E 's#postgres://([^:]+):.*#\1#')
fi

host="${DB_HOST:-localhost}"
port="${DB_PORT:-5432}"

echo "Waiting for PostgreSQL at $host:$port..."

until pg_isready -h "$host" -p "$port" -U "$DB_USER" > /dev/null 2>&1; do
  sleep 1
done

echo "PostgreSQL is ready — starting application."

exec "$@"