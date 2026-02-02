#!/bin/sh
set -e

echo "Starting true-escrow service..."

if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
  case "$DATABASE_URL" in
    postgres://*)
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${DATABASE_URL#postgres://}"
      ;;
    postgresql://*)
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${DATABASE_URL#postgresql://}"
      ;;
    jdbc:*)
      export SPRING_DATASOURCE_URL="$DATABASE_URL"
      ;;
  esac
fi

echo "SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL:-<not set>}"
echo "SERVER_PORT=${PORT:-8080}"

java $JAVA_OPTS -jar /app/app.jar
