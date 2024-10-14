FROM node:18-alpine

WORKDIR /app

# Copy package.json and yarn.lock first to leverage caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the 'data' directory separately to leverage Docker caching
COPY data/ ./data/

# Copy the rest of the server code
COPY . .

# Set permissions for the 'data' directory
RUN chmod -R 755 /app/data

EXPOSE 5050

# Use an environment variable for the port, defaulting to 5050 if not set
CMD ["yarn", "start"]

