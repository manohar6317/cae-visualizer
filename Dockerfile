# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Package the application (skip tests to speed up the build on Render)
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app
# Copy the built jar file from the build stage
COPY --from=build /app/target/visualizer-0.0.1-SNAPSHOT.jar app.jar

# Render will provide the PORT environment variable
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
