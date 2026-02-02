# Dockerfile for True Escrow

**Location**: Repository root  
**Purpose**: Railway deployment container

```dockerfile
FROM gradle:7.6-jdk17 AS build

WORKDIR /app

# Copy build files
COPY server/build.gradle server/settings.gradle ./
COPY server/gradle ./gradle

# Copy source code
COPY server/src ./src

# Build application
RUN gradle build --no-daemon -x test

# Runtime stage
FROM openjdk:17-jre-slim

WORKDIR /app

# Copy built JAR
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Environment
ENV SPRING_PROFILES_ACTIVE=production
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**Notes**:
- Multi-stage build for smaller image
- Health check for Railway
- Java memory settings for Railway limits
- Production profile by default
