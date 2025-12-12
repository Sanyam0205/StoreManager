# services/<service>/Dockerfile
# Multi-stage build for Node.js service

########## Builder ##########
FROM node:18-alpine AS builder
WORKDIR /app

# Add CA certs for https calls if needed
RUN apk add --no-cache python3 make g++ ca-certificates

# Copy package files first for caching
COPY package*.json ./

# Install dev deps for build (if any)
RUN npm ci --production=false

# Copy rest of source
COPY . .

# (If you have a build step for TypeScript, run it here)
# RUN npm run build

########## Runtime ##########
FROM node:18-alpine AS runtime
WORKDIR /app

# create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production deps for smaller image
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Copy app code
COPY --from=builder /app ./

# Switch to non-root
USER appuser

# Document the port (services read PORT from env or fallback)
EXPOSE 3004

# Default command — services are expected to run node src/server.js
CMD ["node", "src/server.js"]
