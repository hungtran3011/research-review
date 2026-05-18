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

# Extract layered JAR
RUN java -Djarmode=layertools -jar target/research-review-0.0.1-SNAPSHOT.jar extract --destination target/extracted

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the layers (ordered from least likely to change to most likely)
COPY --from=build /app/target/extracted/dependencies/ ./
COPY --from=build /app/target/extracted/spring-boot-loader/ ./
COPY --from=build /app/target/extracted/snapshot-dependencies/ ./
COPY --from=build /app/target/extracted/application/ ./

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Entrypoint will start the JVM with jwt properties and Spring Boot's JarLauncher
ENTRYPOINT ["/app/entrypoint.sh"]
