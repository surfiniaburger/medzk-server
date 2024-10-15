#!/bin/bash

# Update and install necessary packages
sudo apt-get update -y
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add the default user to the docker group (replace 'YOUR_USERNAME' with actual username if needed)
# sudo usermod -aG docker YOUR_USERNAME

# Install Docker Compose
DOCKER_COMPOSE_VERSION=2.20.0
sudo curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Pull Docker Compose files from GCS
gsutil cp gs://fancy-store-your-project-id/docker-compose-backend.yml /home/debian/docker-compose-backend.yml
gsutil cp gs://fancy-store-your-project-id/docker-compose-frontend.yml /home/debian/docker-compose-frontend.yml

# Navigate to backend directory and start backend services
mkdir -p /home/debian/backend
mv /home/debian/docker-compose-backend.yml /home/debian/backend/docker-compose.yml
cd /home/debian/backend
docker-compose up -d

# Navigate to frontend directory and start frontend services
mkdir -p /home/debian/frontend
mv /home/debian/docker-compose-frontend.yml /home/debian/frontend/docker-compose.yml
cd /home/debian/frontend
docker-compose up -d
