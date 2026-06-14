# FlowOps 阿里云 ECS 生产部署手册(2 核 4G · 自建 IAM · 精简版)

> 适用:阿里云 ECS **2 vCPU / 4 GB**,Alibaba Cloud Linux 3 或 Ubuntu 22.04;FlowOps `main` 主干(自建 IAM,`FLOWOPS_IAM=self`),PostgreSQL,单机部署。
> 产物形态:生产单端口 **3000**(后端 server 同时托管前端 `ui/build` 与 `/api`,开发才用 8080)。
> 与 2 核 2G 版的区别:**4G 内存足够直接 `pnpm build`,无需大 swap、无需限堆兜底**,流程更顺。需要极致抠内存的招式见 `aliyun-ecs-2c2g.md`。

---

## 0. 配置评估

| 阶段                                | 内存占用        | 4G 表现                 |
| ----------------------------------- | --------------- | ----------------------- |
| 构建 `pnpm build`(UI vite 峰值最高) | 峰值 ≈ 1.5–2 GB | ✅ 直接构建,留 2G+ 余量 |
| 运行时(node + PG + 系统)            | ≈ 1.2–1.6 GB    | ✅ 舒服,有并发余量      |

**适用场景**:单客户私有化、中小团队日常使用、对外 PoC/演示。并发明显上来(很多人同时跑复杂 Agent/RAG)再考虑 4 核 8G。

---

## 1. 系统准备

```bash
# SSH 登录(阿里云控制台拿公网 IP)
ssh root@<你的ECS公网IP>

# 建非 root 部署用户
useradd -m -s /bin/bash flowops && passwd flowops
usermod -aG wheel flowops 2>/dev/null || usermod -aG sudo flowops
su - flowops

# 基础工具
sudo apt update && sudo apt install -y git curl build-essential   # Ubuntu
# 或:sudo dnf install -y git curl gcc-c++ make                    # Alibaba Cloud Linux/CentOS
```

> **swap 可选**:4G 直接 build 通常没问题。想给个保险垫(防偶发峰值)可加 2G:
>
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
> ```

---

## 2. 安装 Node 20 + pnpm

FlowOps 要求 **Node ^20**(Node 22 会让原生模块编译失败)。

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20.20.2 && nvm alias default 20.20.2
node -v                                   # v20.20.2

corepack enable && corepack prepare pnpm@10.26.0 --activate
pnpm -v
```

---

## 3. 安装 PostgreSQL + 建库 + 调优

```bash
sudo apt install -y postgresql postgresql-contrib                 # Ubuntu
# 或:sudo dnf install -y postgresql-server postgresql-contrib && sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql

sudo -u postgres psql <<'SQL'
CREATE ROLE flowops WITH LOGIN PASSWORD '换成你的强密码';
CREATE DATABASE flowops OWNER flowops;
SQL
```

`postgresql.conf` 调优(4G 比 2G 宽松,路径:Ubuntu `/etc/postgresql/*/main/`,CentOS `/var/lib/pgsql/data/`):

```ini
shared_buffers = 512MB          # 4G 机器可给到 512MB
effective_cache_size = 1GB
work_mem = 12MB
maintenance_work_mem = 128MB
max_connections = 80
```

```bash
sudo systemctl restart postgresql
```

> PG 只监听本机(默认 `localhost`),**不要对公网开放 5432**。

---

## 4. 获取代码 + 构建

```bash
cd ~ && git clone https://github.com/limeng1008/flowOps.git flowops && cd flowops
git checkout main

pnpm install --frozen-lockfile
pnpm build                       # 4G 直接构建,无需限堆;若加了 swap 更稳
```

> 万一遇到构建被杀(极少,通常是同时跑了别的吃内存进程):`sudo systemctl stop postgresql` 腾内存后重跑 `pnpm build`,完再 `start postgresql`。

---

## 5. 配置 .env(生产 · 自建 IAM)

```bash
cd ~/flowops/packages/server
cp .env.example .env
openssl rand -hex 32             # 多跑几次,给下面每个 SECRET 各一个值
nano .env
```

必填项(**密钥务必显式固定,否则重启后登录态/凭证全失效**):

```ini
PORT=3000
APP_URL=https://你的域名                  # 暂无域名先填 http://公网IP:3000

DATABASE_TYPE=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=flowops
DATABASE_USER=flowops
DATABASE_PASSWORD=第3步设的强密码

FLOWOPS_IAM=self                          # 自建 IAM,认准这行

JWT_AUTH_TOKEN_SECRET=<openssl值>
JWT_REFRESH_TOKEN_SECRET=<openssl值>
EXPRESS_SESSION_SECRET=<openssl值>
TOKEN_HASH_SECRET=<openssl值>
FLOWISE_SECRETKEY_OVERWRITE=<openssl值>    # 凭证加密密钥,定死别改,改了已存 API Key 解不开

CORS_ORIGINS=https://你的域名
DISABLE_FLOWISE_TELEMETRY=true
```

---

## 6. 首次启动 + 注册 owner

```bash
cd ~/flowops && pnpm start        # 见 "listening at :3000" 即成功
```

浏览器开 `http://<公网IP>:3000`(临时在安全组放行 3000,配好 nginx 后关闭):

-   **第一个注册的账号自动成 owner**(最高权限);此后成员走 owner 在「用户管理」生成的**邀请注册**。

确认能登录后 `Ctrl-C`,转 §7 守护方式拉起。

---

## 7. 进程守护(PM2 + 开机自启)

```bash
npm install -g pm2
cd ~/flowops
pm2 start pnpm --name flowops -- start
pm2 save
pm2 startup                       # 执行它输出的那行 sudo 命令,实现开机自启
pm2 logs flowops                  # 看日志 / pm2 restart flowops 重启
```

---

## 8. Nginx 反向代理 + HTTPS

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/conf.d/flowops.conf
```

```nginx
server {
    listen 80;
    server_name 你的域名;
    client_max_body_size 50m;                 # 允许上传知识库文档

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;        # 流式对话 SSE
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;                       # 长回答不被掐断
        proxy_cache off;
    }
}
```

```bash
sudo nginx -t && sudo systemctl enable --now nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名               # 免费 HTTPS + 自动续期
```

> 配好后把 `.env` 的 `APP_URL`/`CORS_ORIGINS` 改成 `https://你的域名`,`pm2 restart flowops`。

---

## 9. 阿里云安全组

| 端口        | 来源          | 说明                            |
| ----------- | ------------- | ------------------------------- |
| 22          | **仅你的 IP** | SSH,别全网开放                  |
| 80 / 443    | 0.0.0.0/0     | HTTP/HTTPS                      |
| 3000 / 5432 | **不开放**    | 内部端口,只走 nginx / PG 只本机 |

---

## 10. 备份(每天一次)

要备三样:① PG 数据 ② `.env`(含密钥)③ `~/.flowise`(若用到本地存储)。

```bash
mkdir -p ~/backups
cat > ~/backup-flowops.sh <<'EOF'
#!/usr/bin/env bash
set -e
TS=$(date +%Y%m%d-%H%M); BK=~/backups/$TS; mkdir -p "$BK"
PGPASSWORD='你的PG密码' pg_dump -U flowops -h 127.0.0.1 -Fc flowops > "$BK/flowops-pg.dump"
cp ~/flowops/packages/server/.env "$BK/env.bak"
tar -czf "$BK/dot-flowise.tgz" -C ~ .flowise 2>/dev/null || true
find ~/backups -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \;
EOF
chmod +x ~/backup-flowops.sh
(crontab -l 2>/dev/null; echo "0 3 * * * ~/backup-flowops.sh >> ~/backups/cron.log 2>&1") | crontab -
```

恢复:

```bash
PGPASSWORD='密码' psql -U flowops -h 127.0.0.1 -c "DROP DATABASE IF EXISTS flowops;" -c "CREATE DATABASE flowops OWNER flowops;"
PGPASSWORD='密码' pg_restore -U flowops -h 127.0.0.1 -d flowops ~/backups/<时间戳>/flowops-pg.dump
cp ~/backups/<时间戳>/env.bak ~/flowops/packages/server/.env && pm2 restart flowops
```

> 把 `~/backups` 定期下载到本地或传阿里云 OSS,防整盘故障。

---

## 11. 升级

```bash
cd ~/flowops
~/backup-flowops.sh               # 先备份
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 restart flowops && pm2 logs flowops --lines 50
```

> 数据库 migration 在启动时自动跑(self 轨用 ship 集),无需手动。

---

## 12. 故障排查

| 症状                                  | 处理                                                      |
| ------------------------------------- | --------------------------------------------------------- |
| 启动报 `Auth secrets not initialized` | `.env` 的 JWT\_\*/SESSION/TOKEN_HASH 没填全(§5)           |
| `ECONNREFUSED 127.0.0.1:5432`         | PG 没起:`sudo systemctl status postgresql`                |
| 重启后人人要重登/凭证失效             | 密钥用了临时值没固定 → 按 §5 定死                         |
| 平台/登录异常                         | 确认 `.env` 有 `FLOWOPS_IAM=self`;`pm2 logs flowops` 看栈 |
| 流式对话卡住                          | nginx 缺 `Upgrade` 头 / `proxy_read_timeout`(§8)          |
| build 偶发被杀                        | 停 PG 腾内存重跑(§4 注),或加 2G swap(§1)                  |

---

## 附:合规说明

本部署用 `FLOWOPS_IAM=self`(自建 IAM),认证/角色/工作区全走 FlowOps 自有实现,**不依赖也不加载 FlowiseAI 商业授权代码**,可合法对外交付。要产出彻底剔除 enterprise 源码的纯净 dist,见 `docs/iam-selfbuild.md` 的 `scripts/build-ship.sh` + `verify-ship-dist.sh` 零残留门禁。
