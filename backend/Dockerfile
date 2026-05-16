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

# Create a custom JRE with jlink
RUN jlink \
    --add-modules java.base,java.compiler,java.desktop,java.instrument,java.management,java.naming,java.prefs,java.rmi,java.scripting,java.security.jgss,java.sql,jdk.jdwp.agent,jdk.crypto.ec,jdk.unsupported,java.net.http,java.xml \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress zip-9 \
    --output /javaruntime

# Run stage
FROM alpine:3.19
WORKDIR /app

ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Copy the custom JRE
COPY --from=build /javaruntime $JAVA_HOME

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
