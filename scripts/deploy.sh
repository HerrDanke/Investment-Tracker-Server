#!/bin/bash
# Deployment script for Investment Tracker Server on Linux/PVE
# Run this on the target server (Ubuntu/Debian)

set -e

APP_DIR="/opt/investment-tracker"
SERVICE_NAME="investment-tracker"
PORT="${PORT:-8080}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"

echo "=== Installing dependencies ==="
apt-get update
apt-get install -y build-essential pkg-config libssl-dev cargo nodejs npm

echo "=== Creating application directory ==="
mkdir -p "$APP_DIR/data"

echo "=== Building application ==="
cd "$APP_DIR"
cargo build --release --manifest-path Cargo.toml

echo "=== Building frontend ==="
cd "$APP_DIR/web-frontend"
npm ci
npm run build
cp -r dist/* "$APP_DIR/dist/"

echo "=== Creating systemd service ==="
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Investment Tracker Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=PORT=$PORT
Environment=JWT_SECRET=$JWT_SECRET
Environment=DATA_DIR=$APP_DIR/data
ExecStart=$APP_DIR/target/release/investment-tracker-server
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== Enabling and starting service ==="
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

echo "=== Deployment complete ==="
echo "Service status: systemctl status $SERVICE_NAME"
echo "Logs: journalctl -u $SERVICE_NAME -f"
echo "Access: http://$(hostname -I | awk '{print $1}'):$PORT"
