# Build stage
FROM rust:1.75-slim as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/investment-tracker-server .

ENV RUST_LOG=info
ENV DATA_DIR=/data
EXPOSE 8080

VOLUME ["/data"]

CMD ["./investment-tracker-server"]
