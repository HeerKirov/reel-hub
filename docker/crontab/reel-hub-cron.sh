#!/bin/sh
# 供宿主机 crontab 调用：请求应用 GET /api/cron/tick（需与容器/进程内 CRON_SECRET 一致）
#
# 用法示例（crontab -e）：
#   0 3 * * * /path/to/reel-hub/reel-hub-cron.sh >>/var/log/reel-hub-cron.log 2>&1
# 或显式指定地址（映射端口、反代域名等）：
#   REEL_HUB_BASE_URL=https://example.com CRON_SECRET=xxx /path/to/reel-hub/reel-hub-cron.sh
#
# 依赖：curl（macOS / 常见 Linux 自带或易装）

set -eu

ROOT=$(cd "$(dirname "$0")" && pwd)

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

BASE_URL=${REEL_HUB_BASE_URL:-http://127.0.0.1:3000}
SECRET=${CRON_SECRET:-}

if [ -z "$SECRET" ]; then
  echo "reel-hub-cron.sh: 未设置 CRON_SECRET（请在环境变量或 $ROOT/.env 中配置）" >&2
  exit 1
fi

# 去掉 BASE_URL 末尾 /，再拼路径
BASE_URL_TRIMMED=${BASE_URL%/}

exec curl -fsS -H "Authorization: Bearer ${SECRET}" "${BASE_URL_TRIMMED}/api/cron/tick"
