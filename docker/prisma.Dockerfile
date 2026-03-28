# 多阶段：deps 阶段不进入最终镜像；Prisma 版本从仓库根目录 package.json 的 dependencies.prisma（或 devDependencies）读取
# 基底用 alpine 可明显小于 bookworm-slim（若 migrate 在 alpine 上异常，可改回 node:22-bookworm-slim 两阶段）
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY docker/npm/.npmrc /root/.npmrc
COPY package.json /tmp/repo-package.json
RUN PRISMA_VER=$(node -e "const p=require('/tmp/repo-package.json');const v=p.dependencies?.prisma||p.devDependencies?.prisma;if(!v)throw new Error('package.json 中未找到 prisma 依赖');process.stdout.write(String(v).trim())") && \
    npm init -y >/dev/null 2>&1 && \
    npm install "prisma@${PRISMA_VER}" --omit=dev --no-package-lock && \
    npm cache clean --force && \
    rm -f /tmp/repo-package.json package.json package-lock.json

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
USER node
CMD ["npx", "prisma", "migrate", "deploy"]
