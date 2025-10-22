# Build stage
FROM maven:3.9.11-eclipse-temurin-25-alpine AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:24-jdk-slim
WORKDIR /app
COPY --from=build /app/target/research-review-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]