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

# Stage 2: Build Rust backend
# Step 2a: Build dependencies only (cached layer)
FROM rust:1.80-slim AS backend-deps
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src

# Step 2b: Build actual project (deps already cached)
FROM backend-deps AS backend-build
COPY src/ src/
COPY --from=frontend-build /app/dist ./dist
RUN touch src/main.rs && cargo build --release

# Stage 3: Final runtime image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates wget && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home app
WORKDIR /app
COPY --from=backend-build /app/target/release/investment-tracker-server /app/server
RUN mkdir -p /app/data && chown -R app:app /app
USER app

ENV PORT=8080
ENV DATA_DIR=/app/data
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

CMD ["/app/server"]
