# FlowOps 部署 Runbook

日期：2026-06-05
适用分支：`release/flowops-commercialization-v1`
目标：先做到“可部署、可启动、可验证、可停止、可备份”，不要求正式公网商业化上线。

## 1. 部署边界

本 runbook 只解决部署闭环：

-   从当前仓库源码构建 FlowOps 镜像。
-   使用 Docker Compose 启动 FlowOps + PostgreSQL。
-   确认应用健康检查、首次注册、数据库 migration、文件卷和日志路径可用。
-   提供停止、重启、备份、恢复和排障命令。

不包含：

-   域名、HTTPS、ICP 备案。
-   支付宝/微信真实收款。
-   正式隐私政策、用户协议、退款政策。
-   生产级监控告警。

## 2. 机器要求

| 项目    | 最低要求                         | 建议                   |
| ------- | -------------------------------- | ---------------------- |
| CPU     | 2 核                             | 4 核以上               |
| 内存    | 4 GB                             | 8 GB 以上              |
| 磁盘    | 20 GB 可用空间                   | 50 GB 以上，SSD        |
| 系统    | Linux / macOS 测试环境           | Linux 服务器           |
| Docker  | Docker Engine 24+                | 最新稳定版             |
| Compose | `docker compose` v2              | 最新稳定版             |
| 网络    | 首次构建需要访问 npm/pnpm 镜像源 | 离线环境走镜像导入流程 |

## 3. 快速部署

```bash
git clone <your-flowops-repo-url> Flowise
cd Flowise
git checkout release/flowops-commercialization-v1

cd deploy
cp .env.example .env
```

生成密钥并替换 `.env`：

```bash
for k in FLOWISE_SECRETKEY_OVERWRITE JWT_AUTH_TOKEN_SECRET JWT_REFRESH_TOKEN_SECRET EXPRESS_SESSION_SECRET TOKEN_HASH_SECRET; do
  echo "$k=$(openssl rand -hex 32)"
done
```

至少修改：

-   `DATABASE_PASSWORD`
-   `FLOWISE_SECRETKEY_OVERWRITE`
-   `JWT_AUTH_TOKEN_SECRET`
-   `JWT_REFRESH_TOKEN_SECRET`
-   `EXPRESS_SESSION_SECRET`
-   `TOKEN_HASH_SECRET`
-   `APP_URL`：本机测试可保持 `http://localhost:3000`，服务器部署改成实际访问地址。

启动：

```bash
docker compose up -d --build
```

首次源码构建通常需要 15-25 分钟，ARM 或低内存机器更久。

## 4. 部署验收

### 4.0 配置预检

如果还没有正式 `.env`，可以先用 `.env.example` 临时检查 Compose 是否能解析：

```bash
cd deploy
cp .env.example .env
docker compose config >/tmp/flowops-compose-config.out
rm -f .env
```

通过标准：

-   `docker compose config` 退出码为 0。
-   输出中包含 `flowops`、`flowops-db`、`/api/v1/ping` healthcheck、`flowops-data`、`flowops-db-data`。

如果 `docker info` 报 Docker socket 不存在或 Docker daemon 不可达，只能说明当前机器暂时不能真实启动容器；配置预检通过不等于已经完成部署。

### 4.1 容器状态

```bash
docker compose ps
```

通过标准：

-   `flowops-db` 为 `healthy`。
-   `flowops` 为 `healthy`。
-   `flowops` 端口映射为 `${PORT:-3000}:3000`。

### 4.2 健康检查

```bash
curl -fsS http://localhost:${PORT:-3000}/api/v1/ping
```

通过标准：

-   返回 HTTP 200。
-   `docker compose logs flowops` 中没有持续 migration 或数据库连接错误。

### 4.3 首次注册

浏览器访问：

```text
http://服务器IP:3000/signin
```

通过标准：

-   页面可打开。
-   首次注册账号成功。
-   第一个注册账号具备管理员能力。

### 4.4 数据库 migration

```bash
docker compose logs flowops | grep -Ei 'migration|query failed|error'
```

通过标准：

-   没有重复失败的 migration。
-   没有 `relation does not exist`、`duplicate column`、`permission denied` 等错误。

### 4.5 文件卷

```bash
docker compose exec flowops sh -lc 'ls -la /root/.flowise && test -d /root/.flowise/storage && test -d /root/.flowise/logs'
```

通过标准：

-   `/root/.flowise` 可写。
-   `/root/.flowise/storage` 存放上传/导出文件。
-   `/root/.flowise/logs` 存放应用日志。

## 5. 常用运维命令

查看日志：

```bash
docker compose logs -f flowops
docker compose logs -f flowops-db
```

停止但保留数据：

```bash
docker compose down
```

重启：

```bash
docker compose up -d
```

代码更新后重建：

```bash
git pull
docker compose up -d --build
```

完全删除容器但保留镜像：

```bash
docker compose down
```

删除容器和数据卷：

```bash
docker compose down -v
```

执行 `down -v` 会删除数据库和上传/导出文件，只能在测试环境使用。

## 6. 备份与恢复

备份数据库卷：

```bash
docker run --rm -v deploy_flowops-db-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/flowops-db-$(date +%F).tar.gz -C /data .
```

备份文件卷：

```bash
docker run --rm -v deploy_flowops-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/flowops-files-$(date +%F).tar.gz -C /data .
```

恢复前先停止服务：

```bash
docker compose down
```

恢复后再启动：

```bash
docker compose up -d
docker compose ps
curl -fsS http://localhost:${PORT:-3000}/api/v1/ping
```

## 7. 离线部署

有网机器构建镜像：

```bash
cd deploy
docker compose build
docker save flowops:local postgres:16-alpine -o flowops-images.tar
```

内网机器导入：

```bash
docker load -i flowops-images.tar
cd deploy
cp .env.example .env
# 修改 .env
docker compose up -d
```

离线机器不要加 `--build`，否则会尝试联网拉依赖。

## 8. 外部数据库

如使用已有 PostgreSQL 或 Kingbase：

1. 删除或注释 `deploy/docker-compose.yml` 中的 `flowops-db` 服务。
2. 删除 `flowops.depends_on.flowops-db`。
3. `.env` 保持 `DATABASE_TYPE=postgres`。
4. 修改：

```env
DATABASE_HOST=<db-host>
DATABASE_PORT=5432
DATABASE_NAME=flowops
DATABASE_USER=<db-user>
DATABASE_PASSWORD=<db-password>
```

外部数据库账号需要具备建表、建索引和 migration 权限。

## 9. 常见问题

### 构建慢或 OOM

-   确认内存不少于 4 GB。
-   低内存机器可以先增加 swap。
-   重试：

```bash
docker compose build --no-cache flowops
```

### `pnpm install --frozen-lockfile` 失败

-   确认 `pnpm-lock.yaml` 与仓库提交一致。
-   不要在部署机临时执行 `pnpm add`。
-   如确认为 lockfile 与源码不一致，应回到开发机修复并重新提交。

### 数据库健康检查失败

```bash
docker compose logs flowops-db
```

重点检查：

-   `DATABASE_PASSWORD` 是否包含特殊字符但未正确转义。
-   `POSTGRES_USER/POSTGRES_DB` 是否与 `.env` 的 `DATABASE_USER/DATABASE_NAME` 一致。
-   数据卷是否已有旧库初始化数据；旧卷不会因为改 `.env` 自动重建用户。

### 应用健康检查失败

```bash
docker compose logs --tail=200 flowops
```

重点检查：

-   数据库连接错误。
-   migration 错误。
-   `FLOWISE_SECRETKEY_OVERWRITE` 为空或和旧环境不一致。
-   端口被占用。

### 页面能打开但登录异常

-   检查 `APP_URL` 是否与访问地址一致。
-   反向代理或 HTTPS 场景下再配置 `TRUST_PROXY`、`CORS_ORIGINS`、`IFRAME_ORIGINS`。

## 10. 当前部署完成标准

先不要求正式上线，只要求以下全部满足：

-   `docker compose config` 可通过。
-   `docker compose up -d --build` 可完成。
-   `docker compose ps` 中 `flowops` 和 `flowops-db` 均 healthy。
-   `/api/v1/ping` 返回 200。
-   `/signin` 可访问并可完成首次账号注册。
-   创建一个最小 Agent 工作流并保存成功。
-   `docker compose down && docker compose up -d` 后数据仍在。
