#!/usr/bin/env sh
set -e

echo "===== ENTRYPOINT START ====="
echo "DATABASE_URL=$DATABASE_URL"
echo "SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL"

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

echo "SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL"
echo "===== ENTRYPOINT END ====="

exec java $JAVA_OPTS -jar /app/app.jar
