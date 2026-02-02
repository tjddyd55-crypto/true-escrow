#!/bin/sh
set -e

echo "Starting true-escrow service..."

# Check Java version
java -version

# Use Gradle wrapper if available, otherwise use system gradle
if [ -f "./gradlew" ]; then
    echo "Using Gradle wrapper..."
    chmod +x ./gradlew
    ./gradlew build --no-daemon -x test
    JAR_FILE=$(find build/libs -name "*.jar" ! -name "*-plain.jar" | head -n 1)
    if [ -z "$JAR_FILE" ]; then
        echo "Error: JAR file not found in build/libs/"
        exit 1
    fi
    echo "Starting application with JAR: $JAR_FILE"
    java $JAVA_OPTS -jar "$JAR_FILE"
else
    echo "Gradle wrapper not found, using system gradle..."
    gradle build --no-daemon -x test
    JAR_FILE=$(find build/libs -name "*.jar" ! -name "*-plain.jar" | head -n 1)
    if [ -z "$JAR_FILE" ]; then
        echo "Error: JAR file not found in build/libs/"
        exit 1
    fi
    echo "Starting application with JAR: $JAR_FILE"
    java $JAVA_OPTS -jar "$JAR_FILE"
fi
