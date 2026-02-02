#!/bin/sh
set -e

echo "Starting true-escrow service..."
echo "[ENTRYPOINT] RAW DATABASE_URL=${DATABASE_URL:-<not set>}"
echo "[ENTRYPOINT] RAW SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL:-<not set>}"

normalize_jdbc_url() {
  case "$1" in
    jdbc:*)
      echo "$1"
      ;;
    postgres://*)
      echo "jdbc:postgresql://${1#postgres://}"
      ;;
    postgresql://*)
      echo "jdbc:postgresql://${1#postgresql://}"
      ;;
    *)
      echo "$1"
      ;;
  esac
}

if [ -n "$SPRING_DATASOURCE_URL" ]; then
  SPRING_DATASOURCE_URL="$(normalize_jdbc_url "$SPRING_DATASOURCE_URL")"
  export SPRING_DATASOURCE_URL
elif [ -n "$DATABASE_URL" ]; then
  SPRING_DATASOURCE_URL="$(normalize_jdbc_url "$DATABASE_URL")"
  export SPRING_DATASOURCE_URL
fi

echo "[ENTRYPOINT] FINAL SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL:-<not set>}"
echo "[ENTRYPOINT] SERVER_PORT=${PORT:-8080}"

if [ -z "$SPRING_DATASOURCE_URL" ]; then
  echo "[ENTRYPOINT] FATAL: SPRING_DATASOURCE_URL is empty"
  exit 1
fi

if [ -n "$SPRING_DATASOURCE_URL" ] && [ "${SPRING_DATASOURCE_URL#jdbc:}" = "$SPRING_DATASOURCE_URL" ]; then
  echo "Error: SPRING_DATASOURCE_URL must start with jdbc: (current value is not JDBC)"
  exit 1
fi

java $JAVA_OPTS -jar /app/app.jar
