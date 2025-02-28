# Stage 1: Build the frontend
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Serve the frontend using NGINX
FROM nginx:alpine AS production

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy built frontend from builder
COPY --from=builder /app/dist .

# Ensure NGINX has write access (if needed)
RUN mkdir -p /var/cache/nginx/client_temp && \
    chmod -R 777 /var/cache/nginx/client_temp

# Expose port 80
EXPOSE 80

# Set health check with extended start-period
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost || exit 1

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
