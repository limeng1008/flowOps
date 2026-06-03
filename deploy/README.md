# FlowOps 私有化部署

一键在自己的服务器/内网把 FlowOps 跑起来。镜像**从本仓库源码构建**，包含 FlowOps 的二开内容（国产模型/embedding、文档/表格/PPT 导出、企微飞书转人工与客服查询、全中文界面）。官方 `flowiseai/flowise` 镜像**不含**这些，切勿直接用。

## 一、快速开始（3 步）

```bash
cd deploy
cp .env.example .env
# 改 .env：① 数据库密码 ② 5 个密钥（用 openssl rand -hex 32 各生成一个）
docker compose up -d --build      # 首次构建较久（拉依赖+编译，约 15-25 分钟）
```

启动后访问 `http://服务器IP:3000` → **首次进入 /signin 注册的第一个账号即为管理员**（FlowOps 3.x 是账号体系，不再用 basic auth）。

常用命令：

```bash
docker compose logs -f flowops     # 看日志
docker compose ps                  # 看状态
docker compose down                # 停止（数据保留在卷里）
docker compose up -d --build       # 改代码后重建
```

## 二、生成密钥（务必改）

```bash
for k in FLOWISE_SECRETKEY_OVERWRITE JWT_AUTH_TOKEN_SECRET JWT_REFRESH_TOKEN_SECRET EXPRESS_SESSION_SECRET TOKEN_HASH_SECRET; do
  echo "$k=$(openssl rand -hex 32)"
done
```

把输出替换进 `.env` 对应项。**密钥一旦上线不要再改**（改 `FLOWISE_SECRETKEY_OVERWRITE` 会导致已存的凭证无法解密）。

## 三、合规 / 数据不出域

`.env` 已默认开启：

-   `DISABLE_FLOWISE_TELEMETRY=true` —— 关闭遥测/匿名统计，无任何使用数据外发
-   `STORAGE_TYPE=local` —— 上传/导出文件存本地卷
-   `SECRETKEY_STORAGE_TYPE=local` —— 凭证加密密钥本地存储
-   数据库、向量、文件全部在你自己的环境内

只要不主动配置外部模型，调用对象就只有你在节点里填的国产模型/内网服务地址。

## 四、信创环境

-   **操作系统**：麒麟(Kylin V10)、统信(UOS) 等都是 Linux，装好 Docker 与 Docker Compose 后直接按上面跑即可。
-   **数据库**：
    -   **人大金仓 Kingbase**（PG 兼容）：去掉 compose 里的 `flowops-db` 服务，`.env` 保持 `DATABASE_TYPE=postgres`，把 `DATABASE_HOST/PORT/NAME/USER/PASSWORD` 指向你的 Kingbase 实例。
    -   **达梦 DM**：TypeORM 无官方稳定驱动，暂不建议直连；可先用内置 PostgreSQL 或 Kingbase。
-   **CPU 架构**：ARM(鲲鹏/飞腾) 与 x86 均可（node:20-alpine 多架构）；ARM 上首次构建原生模块更慢些。

## 五、离线 / 内网（airgap）

无外网的环境分两步：在有网机器构建并导出镜像，拷到内网导入。

```bash
# 有网机器：
docker compose build                      # 构建 flowops:local
docker save flowops:local postgres:16-alpine -o flowops-images.tar

# 内网机器：
docker load -i flowops-images.tar
docker compose up -d                      # 注意：不要加 --build（直接用导入的镜像）
```

## 六、备份

数据都在两个命名卷里：`flowops-db-data`（数据库）、`flowops-data`（文件）。备份示例：

```bash
docker run --rm -v deploy_flowops-db-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/flowops-db-$(date +%F).tar.gz -C /data .
```

## 七、常见问题

-   **首次构建失败/卡住**：多为原生模块编译，确认机器内存 ≥ 4G；可重试 `docker compose build --no-cache`。
-   **lockfile 报错**：把 Dockerfile 里 `--frozen-lockfile` 去掉再构建。
-   **改了 .env 不生效**：`docker compose up -d`（compose 会重建容器加载新 env）。
-   **端口冲突**：改 `.env` 的 `PORT`。
