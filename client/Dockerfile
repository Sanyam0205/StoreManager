# client/Dockerfile
# Build React app then serve with nginx

### Build stage
FROM node:18-alpine AS builder
WORKDIR /app
ENV CI=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

### Production stage (nginx)
FROM nginx:1.25-alpine
# remove default html
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build /usr/share/nginx/html

# optional: copy a custom nginx config if you need SPA fallback
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
