#!/bin/sh
set -e

echo "===== ENTRYPOINT START ====="
echo "DATABASE_URL=$DATABASE_URL"
echo "SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL"

normalize() {
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
  export SPRING_DATASOURCE_URL="$(normalize "$SPRING_DATASOURCE_URL")"
elif [ -n "$DATABASE_URL" ]; then
  export SPRING_DATASOURCE_URL="$(normalize "$DATABASE_URL")"
fi

echo "FINAL JDBC URL=$SPRING_DATASOURCE_URL"
echo "===== ENTRYPOINT END ====="

exec "$@"
