# Multi-stage build for Investment Tracker Server
# Stage 1: Build frontend
FROM node:18-slim AS frontend-build
WORKDIR /app
COPY web-frontend/package.json web-frontend/package-lock.json ./
RUN npm ci
COPY web-frontend/ ./
# Fix permissions: COPY may overwrite node_modules/.bin symlinks
RUN chmod +x node_modules/.bin/* 2>/dev/null || true
RUN npm run build

# Stage 2: Install backend dependencies
FROM node:18-slim AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist ./dist
COPY --from=frontend-build /app/dist ./public

# Stage 3: Final runtime image
FROM node:18-slim
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home app
WORKDIR /app
COPY --from=backend-build /app ./
RUN mkdir -p /app/data && chown -R app:app /app
USER app

ENV PORT=8080
ENV DATA_DIR=/app/data
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

CMD ["node", "dist/index.js"]
