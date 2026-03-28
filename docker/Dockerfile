FROM node:22.12.0-slim AS base

# 使用国内 Debian 镜像加速 apt（npmmirror 不提供 apt，见 docker/apt/sources.list）
RUN rm -f /etc/apt/sources.list.d/debian.sources /etc/apt/sources.list.d/debian.list 2>/dev/null || true
COPY docker/files/sources.list /etc/apt/sources.list
# Prisma 在 slim 镜像里需能探测到 OpenSSL，否则回退到 openssl-1.1.x 并告警
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制 package.json 相关文件
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  yarn config set registry https://registry.npmmirror.com && \
  yarn --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN \
  mv .env.example .env && \
  yarn build

# 仅安装 Prisma CLI + schema/migrations，供最终镜像内 /usr/local/bin/reel-hub-migrate 调用（与主应用同 bookworm-slim，避免 Alpine/glibc 混用）
FROM base AS prisma-migrate
WORKDIR /migrate
COPY package.json /tmp/repo-package.json
RUN PRISMA_VER=$(node -e "const p=require('/tmp/repo-package.json');const v=p.dependencies?.prisma||p.devDependencies?.prisma;if(!v)throw new Error('package.json 中未找到 prisma 依赖');process.stdout.write(String(v).trim())") && \
    npm config set registry https://registry.npmmirror.com && \
    npm init -y >/dev/null 2>&1 && \
    npm install "prisma@${PRISMA_VER}" --omit=dev --no-package-lock && \
    npm cache clean --force && \
    rm -f /tmp/repo-package.json package.json package-lock.json
COPY prisma ./prisma

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# 设置正确的权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 自动获取 standalone 输出和静态文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 合并 migrate：独立目录 + 入口脚本（默认仍启动 Next；需迁移时: reel-hub-migrate migrate deploy）
COPY --from=prisma-migrate /migrate /opt/prisma-migrate
COPY docker/files/reel-hub-migrate.sh /usr/local/bin/reel-hub-migrate
RUN chmod +x /usr/local/bin/reel-hub-migrate && chown -R nextjs:nodejs /opt/prisma-migrate

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]