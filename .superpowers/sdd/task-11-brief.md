# 任务 11：Docker 配置

**目标：** 创建 Dockerfile 和 docker-compose.yml，支持容器化部署

**文件：**
- 创建：`Dockerfile`
- 创建：`docker-compose.yml`
- 创建：`.dockerignore`

**Dockerfile 内容：**

```dockerfile
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
```

**docker-compose.yml 内容：**

```yaml
version: "3.8"

services:
  investment-tracker:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      - RUST_LOG=info
      - DATA_DIR=/data
    restart: unless-stopped
```

**.dockerignore 内容：**

```
target/
data/
.git/
Dockerfile
docker-compose.yml
```

**验证：**
确保文件内容正确即可（Docker 构建不在本地验证范围内）。

**提交：**
```bash
git add -A
git commit -m "feat: 添加 Docker 配置"
```
