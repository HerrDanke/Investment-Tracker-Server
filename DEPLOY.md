# PVE LXC 部署指南

> 适用：Proxmox VE 上的 Ubuntu LXC 容器

## 架构

```
┌─────────────────────────────────────────┐
│ PVE Host                                │
│  ┌───────────────────────────────────┐  │
│  │ LXC Container (Ubuntu 22.04)      │  │
│  │   ┌─────────────────────────────┐ │  │
│  │   │ Docker Compose              │ │  │
│  │   │   ┌───────────────────────┐ │ │  │
│  │   │   │ Investment Tracker    │ │ │  │
│  │   │   │ Port 8080             │ │ │  │
│  │   │   │ Volume: investment-data│ │ │  │
│  │   │   └───────────────────────┘ │ │  │
│  │   └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 步骤

### 1. 创建 LXC 容器

在 PVE 网页界面或 CLI 创建：

```bash
# PVE CLI
pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --hostname investment-tracker \
  --memory 512 \
  --swap 512 \
  --cores 1 \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 1 \
  --features nesting=1
pct start 100
```

> `nesting=1` 允许容器内运行 Docker。

### 2. 进入容器

```bash
pct enter 100
# 或 SSH
ssh root@<容器IP>
```

### 3. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登录使组生效
```

### 4. 部署应用

```bash
# 克隆仓库
git clone https://github.com/HerrDanke/Investment-Tracker-Server.git
cd Investment-Tracker-Server

# 创建环境配置
cat > .env << 'EOF'
JWT_SECRET=此处替换为随机密钥
PORT=8080
EOF

# 生成随机密钥（可选）
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# 构建并启动
docker compose up -d --build
```

### 5. 验证

```bash
# 容器状态
docker compose ps

# 日志
docker compose logs -f

# 健康检查
curl http://localhost:8080/api/health
```

浏览器访问 `http://<容器IP>:8080`

---

## 运维命令

### 日常操作

```bash
# 进入项目目录
cd ~/Investment-Tracker-Server

# 查看日志
docker compose logs -f --tail=50

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新到最新版本
git pull
docker compose up -d --build
```

### 数据备份

```bash
# 创建备份
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
docker run --rm \
  -v investment-tracker-investment-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# 查看备份
ls -lh $BACKUP_DIR

# 恢复备份
docker run --rm \
  -v investment-tracker-investment-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/备份文件.tar.gz -C /data"
```

### 自动备份（crontab）

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * docker run --rm -v investment-tracker-investment-data:/data -v /root/backups:/backup alpine tar czf /backup/backup-$(date +\%Y\%m\%d-\%H\%M\%S).tar.gz -C /data .

# 只保留 7 天备份
0 3 * * * find /root/backups -name "backup-*.tar.gz" -mtime +7 -delete
```

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 容器无法启动 | `docker compose logs` 查看日志 |
| 端口不通 | 检查 LXC 防火墙：`pvesh create /nodes/<node>/firewall/rules -action ACCEPT -dport 8080 -proto tcp` |
| 数据丢失 | 使用备份恢复 |
| Docker 权限错误 | 重新登录或运行 `newgrp docker` |
| 构建失败 | 检查磁盘空间：`df -h` |

---

## 资源要求

| 资源 | 最低 | 推荐 |
|------|------|------|
| CPU | 1 核 | 1 核 |
| 内存 | 512 MB | 1 GB |
| 磁盘 | 8 GB | 10 GB |
| 网络 | 桥接 DHCP | 静态 IP |
