FROM node:22.12.0-slim AS base

# 使用国内 Debian 镜像加速 apt（npmmirror 不提供 apt，见 docker/apt/sources.list）
RUN rm -f /etc/apt/sources.list.d/debian.sources /etc/apt/sources.list.d/debian.list 2>/dev/null || true
COPY docker/apt/sources.list /etc/apt/sources.list
# Prisma 在 slim 镜像里需能探测到 OpenSSL，否则回退到 openssl-1.1.x 并告警
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# 安装依赖阶段
FROM base AS deps
WORKDIR /app
COPY docker/npm/.npmrc /root/.npmrc

# 复制 package.json 相关文件
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY docker/npm/.npmrc /root/.npmrc
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

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

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]