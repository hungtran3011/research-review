# Build stage
FROM maven:3-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Maven files first for better layer caching
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Copy source code and resources
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:21-jdk-slim
WORKDIR /app

# Copy the built JAR file
COPY --from=build /app/target/research-review-0.0.1-SNAPSHOT.jar app.jar

# Copy resources directory if needed at runtime (though they should be in the JAR)
COPY --from=build /app/src/main/resources /app/resources

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Entrypoint will read mounted /run/secrets/* or env vars and start the JVM with jwt properties
ENTRYPOINT ["/app/entrypoint.sh"]
