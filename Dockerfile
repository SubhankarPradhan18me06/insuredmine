# Use official Node LTS slim/alpine image
FROM node:20-alpine

# install build tools (some modules may need them) and curl for healthcheck
RUN apk add --no-cache python3 make g++ curl bash

# Create app directory
WORKDIR /usr/src/insuredmine

# Copy package files first to take advantage of docker layer caching
COPY package.json package-lock.json* ./

# Install only production deps (use npm ci if lockfile exists)
RUN npm ci --only=production

# Install PM2 globally to supervise and restart the process
RUN npm install -g pm2@5

# Copy app source
COPY . .

# Ensure upload & failed_upload & logs directories exist and are writable
RUN mkdir -p uploads failed_uploads logs \
 && chown -R node:node /usr/src/insuredmine

# Use non-root user for better security
USER node

# Expose port (match your server PORT or the default in .env)
EXPOSE 8600

# Use PM2 runtime to run server.js and allow automatic restarts
# ecosystem.config.js is expected in the project root
CMD ["pm2-runtime", "ecosystem.config.js"]
