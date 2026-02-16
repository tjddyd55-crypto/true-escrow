FROM gradle:7.6-jdk17 AS build

WORKDIR /app

# Copy project files from build context at once
# (avoids brittle path-specific COPY cache-key failures in some remote builders)
COPY . .

# Build application and normalize JAR name
RUN gradle build --no-daemon -x test \
    && JAR_FILE=$(ls build/libs/*.jar | grep -v plain | head -n 1) \
    && if [ -z "$JAR_FILE" ]; then echo "JAR file not found in build/libs"; exit 1; fi \
    && cp "$JAR_FILE" /app/app.jar

# Runtime stage
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy built JAR
COPY --from=build /app/app.jar app.jar

# Expose port
EXPOSE 8080

# Environment
ENV SPRING_PROFILES_ACTIVE=production
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Run application (inline entrypoint to avoid build-context missing script issues)
ENTRYPOINT ["sh", "-c", "set -e; normalize_jdbc_url(){ case \"$1\" in jdbc:*) echo \"$1\" ;; postgres://*) echo \"jdbc:postgresql://${1#postgres://}\" ;; postgresql://*) echo \"jdbc:postgresql://${1#postgresql://}\" ;; *) echo \"$1\" ;; esac; }; if [ -n \"$SPRING_DATASOURCE_URL\" ]; then SPRING_DATASOURCE_URL=\"$(normalize_jdbc_url \"$SPRING_DATASOURCE_URL\")\"; export SPRING_DATASOURCE_URL; elif [ -n \"$DATABASE_URL\" ]; then SPRING_DATASOURCE_URL=\"$(normalize_jdbc_url \"$DATABASE_URL\")\"; export SPRING_DATASOURCE_URL; fi; exec java $JAVA_OPTS -jar /app/app.jar"]
