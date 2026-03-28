#!/usr/bin/env bash
# 在 Apple Silicon 上构建 linux/amd64 镜像，供 x86 生产机只 pull/load + run（不在小内存机器上 build）
# 用法：在仓库根目录执行  ./docker/build-linux-amd64.sh [镜像名:tag]
# 建议 Docker Desktop 内存 ≥ 8GB；首次构建可能 30～60 分钟量级属正常
# buildx 使用 buildkitd.toml 拉 docker.io；若曾用旧脚本建过 builder，请: docker buildx rm -f reel-hub-linux-amd64 后再跑
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-reel-hub:amd64}"
cd "$ROOT"
export DOCKER_BUILDKIT=1

BUILDER_NAME="reel-hub-linux-amd64"
BUILDKIT_CFG="$ROOT/docker/files/buildkitd.toml"
if [[ ! -f "$BUILDKIT_CFG" ]]; then
  echo "缺少 $BUILDKIT_CFG" >&2
  exit 1
fi

# buildx 的 docker-container 驱动使用独立 BuildKit，需在创建时传入 --config 才会走镜像；与 Docker Desktop「镜像加速」不是同一条配置链
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  docker buildx create --name "$BUILDER_NAME" --driver docker-container --config "$BUILDKIT_CFG" --bootstrap
fi
docker buildx use "$BUILDER_NAME"

docker buildx build \
  --platform linux/amd64 \
  --load \
  -f docker/Dockerfile \
  -t "$TAG" \
  .

echo ""
echo "已载入本机: $TAG"
echo "导出到文件: docker save $TAG | gzip > reel-hub-amd64.tar.gz"
echo "服务器加载: gunzip -c reel-hub-amd64.tar.gz | docker load"
