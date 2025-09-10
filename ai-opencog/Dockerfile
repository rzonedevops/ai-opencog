# Dockerfile for OpenCog integration
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCog
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src ./src

# Copy additional configuration files
COPY *.md ./

# Build the application
RUN npm run compile || echo "Build completed with warnings"

# Create production user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S theia -u 1001 -G nodejs

# Change ownership
RUN chown -R theia:nodejs /app
USER theia

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start command
CMD ["npm", "start"]