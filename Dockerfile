FROM alpine:latest

# Install Docker Compose
RUN apk add --no-cache docker-compose

# Copy your Docker Compose file
COPY docker-compose.yml ./

# Build your application using Docker Compose
RUN docker-compose build

# Expose the port for your application
EXPOSE 5050 3001 27017

# Run your application using Docker Compose
CMD ["docker-compose", "up", "-d"]
