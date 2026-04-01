# REEL HUB

## Development

需要node版本`22.11.0`或以上；使用yarn进行依赖管理。

使用yarn安装全部依赖。
```shell
yarn
```

在运行之前，需要准备开发环境的env。复制一份`.env.example`到`.env`，随后按照文件指引，编辑环境变量配置。
```shell
cp .env.example .env
```

项目使用Prisma进行migrate管理。将migration同步到数据库:
```shell
yarn migrate:deploy 
```

使用yarn启动开发服务器。随后访问`http://localhost:3000`。
```shell
yarn dev
```

## Build & Deploy

要执行编译，使用yarn build命令。
```shell
yarn build
```

要使用Docker编译以及构建镜像，使用docker目录中提供的Dockerfile。
```shell
docker build -f docker/Dockerfile -t reel-hub:dev .
```

需要跨平台构建镜像时，可以使用docker目录中提供的构建脚本。
```shell
docker/build-linux-amd64.sh reel-hub:dev
docker save reel-hub:dev | gzip > reel-hub-amd64.tar.gz
gunzip -c reel-hub-amd64.tar.gz | docker load
```


使用docker运行镜像，以及使用镜像进行migrate。
```shell
docker run -d --name reel-hub -p 3000:3000 -e DATABASE_URL="..." reel-hub:dev
docker run --rm --name reel-hub-migrate -p 3000:3000 -e DATABASE_URL="..." reel-hub:dev reel-hub-migrate migrate deploy
```

使用docker compose部署时，可以参考docker/docker-compose.yml文件提供的部署模板。将其分拆到deploy compose和migrate compose使用。
```shell
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.migrate.yml run reel-hub-migrate
```

## Legacy Migration

已提供旧项目数据迁移API。

调用示例:
- URL：`POST /api/admin/migrate-legacy`
- Header：`Authorization: Bearer <SYSCALL_SECRET>`
- Body
```json
{
  "oldDatabaseUrl": "postgres://user:password@host:5432/legacy_db",
  "userMapping": {
    "1": "user_abc123",
    "2": "user_def456"
  },
  "dryRun": true
}
```

通过cURL调用:
```shell
curl -fsS -X POST -H 'Authorization: Bearer <SYSCALL_SECRET>' -d '{"userMapping": {"1": "user_abc123", "2": "user_def456"}, "dryRun": true}' http://localhost:3000/api/admin/migrate-legacy
```