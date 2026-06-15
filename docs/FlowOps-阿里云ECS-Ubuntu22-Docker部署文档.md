# FlowOps 阿里云 ECS Ubuntu 22.04 部署文档

适用环境：阿里云 ECS，Ubuntu Server 22.04 LTS，2 核 4G，单机私有化部署。

适用项目：当前仓库的 FlowOps/Flowise 二开版本。生产部署推荐使用 `deploy/` 目录，从本仓库源码构建镜像。不要直接使用官方 `flowiseai/flowise` 镜像，否则会缺少本仓库的国产模型、导出、企微飞书、中文化等二开内容。

## 1. 部署架构

单机部署组件如下：

| 组件 | 说明 |
| --- | --- |
| ECS | Ubuntu 22.04，2 核 4G |
| Docker Engine | 容器运行时 |
| Docker Compose | 编排 FlowOps 与 PostgreSQL |
| FlowOps | 应用服务，容器内监听 `3000` |
| PostgreSQL 16 | 默认随 compose 启动，数据存在 Docker volume |
| Nginx | 可选，生产建议用于域名、HTTPS、反向代理 |

默认数据卷：

| 卷名 | 内容 |
| --- | --- |
| `deploy_flowops-db-data` | PostgreSQL 数据 |
| `deploy_flowops-data` | FlowOps 上传文件、导出文件、本地存储 |

如果在其他目录或使用 `docker compose -p` 启动，卷名前缀会不同，以 `docker volume ls` 为准。

## 2. ECS 准备

### 2.1 推荐规格

| 项 | 建议 |
| --- | --- |
| 实例规格 | 2 vCPU / 4 GiB 起步 |
| 系统盘 | 至少 40 GiB，建议 80 GiB |
| 镜像 | Ubuntu Server 22.04 LTS |
| 网络 | 专有网络 VPC |
| 公网 IP | 需要公网访问时分配 |

2 核 4G 可以运行服务，但首次源码构建会比较吃内存，建议配置 4G swap。构建仍频繁 OOM 时，可以在更高配置机器构建镜像后导出再导入 ECS。

### 2.2 安全组规则

生产建议最小开放：

| 端口 | 协议 | 来源 | 用途 |
| --- | --- | --- | --- |
| `22` | TCP | 管理员固定公网 IP | SSH 登录 |
| `80` | TCP | `0.0.0.0/0` | HTTP，签发证书或跳转 HTTPS |
| `443` | TCP | `0.0.0.0/0` | HTTPS |
| `3000` | TCP | 管理员固定公网 IP，或临时开放 | 仅用于初次验收；正式接入 Nginx 后关闭 |

不要对公网开放 PostgreSQL `5432`。如使用内网 RDS/Kingbase，只在 VPC 内按安全组授权。

如果域名解析到中国大陆 ECS 并对公网提供网站服务，通常还需要完成 ICP 备案后再长期开放访问。

## 3. 系统初始化

SSH 登录服务器：

```bash
ssh root@<ECS公网IP>
```

更新系统并安装基础工具：

```bash
apt update
apt -y upgrade
apt install -y ca-certificates curl gnupg git openssl lsb-release vim htop unzip
timedatectl set-timezone Asia/Shanghai
```

创建部署用户：

```bash
adduser deploy
usermod -aG sudo deploy
```

后续可以使用：

```bash
su - deploy
```

## 4. 配置 swap

2 核 4G 机器首次构建镜像建议开启 4G swap：

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

如果 `fallocate` 不可用，改用：

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
```

## 5. 安装 Docker 与 Compose

卸载系统旧包：

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y "$pkg"
done
```

添加 Docker 官方 apt 仓库：

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
```

安装 Docker Engine 与 Compose 插件：

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

允许当前用户执行 Docker 命令：

```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

验证：

```bash
docker --version
docker compose version
docker run --rm hello-world
```

## 6. 上传或拉取代码

建议部署目录：

```bash
sudo mkdir -p /opt/flowops
sudo chown -R deploy:deploy /opt/flowops
```

方式 A：服务器直接拉取仓库：

```bash
git clone <你的仓库地址> /opt/flowops
cd /opt/flowops
```

方式 B：从本地同步代码到服务器，在本地终端执行：

```bash
rsync -av --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .turbo \
  --exclude '**/dist' \
  --exclude '**/build' \
  /Volumes/project/Flowise/ deploy@<ECS公网IP>:/opt/flowops/
```

进入部署目录：

```bash
cd /opt/flowops/deploy
```

## 7. 配置环境变量

复制配置文件：

```bash
cp .env.example .env
chmod 600 .env
```

生成数据库密码：

```bash
openssl rand -base64 24
```

生成 5 个应用密钥：

```bash
for k in FLOWISE_SECRETKEY_OVERWRITE JWT_AUTH_TOKEN_SECRET JWT_REFRESH_TOKEN_SECRET EXPRESS_SESSION_SECRET TOKEN_HASH_SECRET; do
  printf '%s=%s\n' "$k" "$(openssl rand -hex 32)"
done
```

编辑 `.env`：

```bash
vim .env
```

必须修改：

```dotenv
PORT=3000

DATABASE_TYPE=postgres
DATABASE_HOST=flowops-db
DATABASE_PORT=5432
DATABASE_NAME=flowops
DATABASE_USER=flowops
DATABASE_PASSWORD=<替换为强密码>

DISABLE_FLOWISE_TELEMETRY=true
STORAGE_TYPE=local
SECRETKEY_STORAGE_TYPE=local

FLOWISE_SECRETKEY_OVERWRITE=<openssl rand -hex 32>
JWT_AUTH_TOKEN_SECRET=<openssl rand -hex 32>
JWT_REFRESH_TOKEN_SECRET=<openssl rand -hex 32>
EXPRESS_SESSION_SECRET=<openssl rand -hex 32>
TOKEN_HASH_SECRET=<openssl rand -hex 32>
```

上线后不要再更改 `FLOWISE_SECRETKEY_OVERWRITE`。它用于凭证加密，修改后可能导致已保存的模型 API Key、数据库连接等凭证无法解密。

如需要支付回调、OAuth、企业微信、飞书等公网回调地址，建议先配置域名和 HTTPS，再把对应回调地址写成 HTTPS 域名。

## 8. 首次启动

在 `/opt/flowops/deploy` 执行：

```bash
docker compose up -d --build
```

首次构建需要拉依赖和编译，2 核 4G 可能需要 15 到 30 分钟。查看状态：

```bash
docker compose ps
docker compose logs -f flowops
```

本机验证：

```bash
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:3000/api/v1/ping
```

公网临时验收：

```text
http://<ECS公网IP>:3000
```

首次访问 `/signin` 注册的第一个账号即为管理员。

## 9. Nginx 与 HTTPS

生产环境建议使用域名访问：

```text
https://flowops.example.com
```

### 9.1 域名解析

在 DNS 控制台添加 A 记录：

```text
flowops.example.com -> <ECS公网IP>
```

### 9.2 安装 Nginx 与 Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

### 9.3 配置反向代理

创建配置：

```bash
sudo vim /etc/nginx/sites-available/flowops.conf
```

写入：

```nginx
server {
    listen 80;
    server_name flowops.example.com;

    client_max_body_size 200m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/flowops.conf /etc/nginx/sites-enabled/flowops.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 9.4 签发 HTTPS 证书

```bash
sudo certbot --nginx -d flowops.example.com
```

验证自动续期：

```bash
sudo certbot renew --dry-run
```

### 9.5 关闭公网 3000

正式使用 Nginx 后，建议把 `deploy/docker-compose.yml` 里的端口绑定改为仅监听本机：

```yaml
ports:
  - '127.0.0.1:${PORT:-3000}:3000'
```

然后重启：

```bash
cd /opt/flowops/deploy
docker compose up -d
```

同时在阿里云安全组删除或收紧 `3000` 入方向规则，仅保留 `80/443` 对公网开放。

## 10. 常用运维命令

进入部署目录：

```bash
cd /opt/flowops/deploy
```

查看容器：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f flowops
docker compose logs -f flowops-db
```

重启：

```bash
docker compose restart flowops
```

停止，数据保留：

```bash
docker compose down
```

启动：

```bash
docker compose up -d
```

修改代码后重建：

```bash
docker compose up -d --build
```

查看资源：

```bash
docker stats
df -h
free -h
```

清理悬空镜像：

```bash
docker image prune -f
```

## 11. 备份

建议先创建备份目录：

```bash
cd /opt/flowops/deploy
mkdir -p backups
```

加载 `.env` 中的数据库变量：

```bash
set -a
. ./.env
set +a
```

备份 PostgreSQL：

```bash
docker compose exec -T flowops-db pg_dump -U "$DATABASE_USER" "$DATABASE_NAME" > "backups/flowops-db-$(date +%F).sql"
```

备份本地文件卷：

```bash
docker run --rm \
  -v deploy_flowops-data:/data \
  -v "$PWD/backups":/backup \
  alpine tar czf "/backup/flowops-files-$(date +%F).tar.gz" -C /data .
```

备份 `.env`：

```bash
cp .env "backups/env-$(date +%F).bak"
chmod 600 backups/env-*.bak
```

建议把 `backups/` 定期同步到 OSS、NAS 或另一台服务器。`.env` 和数据库备份包含敏感信息，传输与存储都要加密。

## 12. 升级流程

升级前先备份数据库、文件卷和 `.env`。

拉取新代码：

```bash
cd /opt/flowops
git pull
```

重新构建并启动：

```bash
cd /opt/flowops/deploy
docker compose up -d --build
```

观察日志：

```bash
docker compose logs -f flowops
```

确认正常后清理旧镜像：

```bash
docker image prune -f
```

## 13. 故障排查

### 13.1 公网打不开

检查顺序：

```bash
docker compose ps
curl -I http://127.0.0.1:3000
ss -tlnp | grep ':3000'
```

如果服务器本机可访问、公网不可访问，重点检查阿里云安全组、Nginx、域名解析。

### 13.2 首次构建 OOM 或卡住

检查内存和 swap：

```bash
free -h
docker compose logs -f flowops
```

处理方式：

```bash
docker compose build --no-cache --progress=plain flowops
docker compose up -d
```

仍失败时，建议使用更高配置机器构建镜像：

```bash
docker compose build
docker save flowops:local postgres:16-alpine -o flowops-images.tar
```

再把 `flowops-images.tar` 拷贝到 ECS：

```bash
docker load -i flowops-images.tar
docker compose up -d
```

注意导入镜像后不要加 `--build`。

### 13.3 改了数据库密码后无法连接

PostgreSQL 初始化后，Docker volume 中已有用户密码不会因为 `.env` 修改而自动变化。建议：

1. 生产环境不要随意改 `DATABASE_PASSWORD`。
2. 必须修改时，先用 `psql` 执行 `ALTER USER`。
3. 如果是全新测试环境，可以 `docker compose down -v` 删除卷后重建，但这会删除数据库数据。

### 13.4 凭证无法解密

通常是 `FLOWISE_SECRETKEY_OVERWRITE` 变了。恢复上线时使用的旧值，然后重启：

```bash
docker compose restart flowops
```

### 13.5 端口冲突

```bash
ss -tlnp | grep ':3000'
```

如果端口被占用，修改 `.env`：

```dotenv
PORT=3001
```

然后：

```bash
docker compose up -d
```

### 13.6 磁盘不足

```bash
df -h
docker system df
```

可先清理未使用镜像：

```bash
docker image prune -f
```

不要直接删除 Docker volume，除非已经确认备份完整。

## 14. 验收清单

部署完成后逐项确认：

| 项 | 结果 |
| --- | --- |
| `docker compose ps` 中 `flowops` 与 `flowops-db` 均为运行状态 |  |
| `curl http://127.0.0.1:3000/api/v1/ping` 有响应 |  |
| 浏览器可访问 `http://<IP>:3000` 或 HTTPS 域名 |  |
| `/signin` 可注册第一个管理员账号 |  |
| 阿里云安全组未开放 `5432` |  |
| 正式环境 `22` 仅允许管理员 IP |  |
| 正式环境 `3000` 已关闭公网或限制来源 |  |
| `.env` 已备份且权限为 `600` |  |
| 已完成至少一次数据库和文件卷备份 |  |

## 15. 参考资料

- Docker Engine Ubuntu 安装文档：https://docs.docker.com/engine/install/ubuntu/
- Docker Compose Linux 插件安装文档：https://docs.docker.com/compose/install/linux/
- Flowise 环境变量文档：https://docs.flowiseai.com/configuration/environment-variables
- 阿里云 ECS 安全组文档：https://help.aliyun.com/zh/ecs/user-guide/start-using-security-groups
