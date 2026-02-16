FROM gradle:7.6-jdk17 AS build

WORKDIR /app

# Copy build files
COPY build.gradle settings.gradle ./

# Copy source code
COPY src ./src

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

# Copy entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 8080

# Environment
ENV SPRING_PROFILES_ACTIVE=production
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Run application
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["java", "-jar", "/app/app.jar"]
