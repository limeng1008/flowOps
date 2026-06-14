# FlowOps 阿里云 ECS 生产部署手册(2 核 2G · 自建 IAM)

> 适用:阿里云 ECS **2 vCPU / 2 GB**,Alibaba Cloud Linux 3 或 Ubuntu 22.04;FlowOps `main` 主干(自建 IAM,`FLOWOPS_IAM=self`),PostgreSQL,单机裸机部署。
> 产物形态:生产单端口 **3000**(后端 server 同时托管前端 `ui/build` 与 `/api`),无需单独跑 Vite(8080 仅开发用)。

---

## 0. 先认清这台机器的现实(最重要)

| 阶段                                  | 内存占用           | 2G 够不够                         |
| ------------------------------------- | ------------------ | --------------------------------- |
| 运行时(node server + PG + 系统)       | ≈ 1.2–1.6 GB       | ✅ 够,但要给 PG 调小              |
| **构建 `pnpm build`(UI vite 是大头)** | **峰值 1.5–2 GB+** | ❌ **裸 2G 必 OOM,必须先加 swap** |

**两条铁律,后面反复用到:**

1. **开机第一件事加 4 GB swap**(§1.2),否则 `pnpm build` 会被系统 OOM-kill。
2. **build 时限制 Node 堆**:`NODE_OPTIONS=--max-old-space-size=1536`,配合 swap 扛过峰值。

> 嫌服务器 build 慢/痛苦?两个进阶替代(本手册主线仍是服务器 build):
>
> -   **本地 build,产物上传**:在你本机(已能 build)产出后,用 `rsync` 传 `packages/{server/dist,ui/build,components/dist}`——但 `node_modules` 含原生模块(sqlite3 等)**不能跨平台拷**,服务器仍需 `pnpm install --prod`。
> -   **Docker**:本机/CI 构建镜像推到阿里云 ACR,服务器只 `docker run`。最省服务器内存,但需自建 Dockerfile,本手册不展开。

---

## 1. 系统准备

### 1.1 连上服务器、建部署用户

```bash
# 本地 SSH 登录(用阿里云控制台给的公网 IP)
ssh root@<你的ECS公网IP>

# 建一个非 root 部署用户(安全)
useradd -m -s /bin/bash flowops && passwd flowops
usermod -aG wheel flowops 2>/dev/null || usermod -aG sudo flowops   # 二选一(CentOS系/Ubuntu)
su - flowops
```

### 1.2 ⚠️ 加 4 GB swap(2G 机器的命根,不加 build 必崩)

```bash
sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab     # 开机自动挂载
# 降低 swap 倾向(优先用物理内存,swap 只兜底峰值)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
free -h   # 确认 Swap 行有 4.0Gi
```

### 1.3 基础工具

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y git curl build-essential
# Alibaba Cloud Linux / CentOS
sudo dnf install -y git curl gcc-c++ make
```

---

## 2. 安装 Node 20 + pnpm

FlowOps 要求 **Node ^20**(原生模块在 Node 22 上编译会失败)。

```bash
# 用 nvm 锁定 20(推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20.20.2 && nvm alias default 20.20.2
node -v   # 应为 v20.20.2

# pnpm(项目锁定 10.x)
corepack enable && corepack prepare pnpm@10.26.0 --activate
pnpm -v
```

---

## 3. 安装 PostgreSQL + 建库 + 小内存调优

```bash
# Ubuntu
sudo apt install -y postgresql postgresql-contrib
# Alibaba Cloud Linux / CentOS
sudo dnf install -y postgresql-server postgresql-contrib && sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql

# 建库与用户(密码请改成强密码)
sudo -u postgres psql <<'SQL'
CREATE ROLE flowops WITH LOGIN PASSWORD '换成你的强密码';
CREATE DATABASE flowops OWNER flowops;
SQL
```

### 3.1 ⚠️ 2G 机器的 PG 调优(不调会和 Node 抢内存)

编辑 `postgresql.conf`(路径:Ubuntu `/etc/postgresql/*/main/`,CentOS `/var/lib/pgsql/data/`):

```ini
shared_buffers = 256MB          # 默认128MB,2G机器给256MB封顶
effective_cache_size = 512MB
work_mem = 8MB
maintenance_work_mem = 64MB
max_connections = 50            # 默认100太多,够用即可
```

```bash
sudo systemctl restart postgresql
```

> PG 只监听本机(默认 `listen_addresses='localhost'`),**不要对公网开放 5432**。

---

## 4. 获取代码 + 构建

```bash
cd ~ && git clone https://github.com/limeng1008/flowOps.git flowops && cd flowops
git checkout main          # 自建 IAM 主干

# 安装依赖(会编译原生模块,2G 够,慢一点)
pnpm install --frozen-lockfile

# ⚠️ 关键:限堆 + 已有 swap 兜底,构建全部包
NODE_OPTIONS=--max-old-space-size=1536 pnpm build
```

**如果 build 仍被 kill(`dmesg | grep -i oom` 能看到):**

```bash
# 临时停掉 PG 腾内存,单独构建最吃内存的 UI,再恢复
sudo systemctl stop postgresql
NODE_OPTIONS=--max-old-space-size=1700 pnpm --filter flowise-ui build
NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter flowise-components build
NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter flowise build   # server
sudo systemctl start postgresql
```

---

## 5. 配置 .env(生产 · 自建 IAM)

```bash
cd ~/flowops/packages/server
cp .env.example .env   # 若无则新建
# 生成三把密钥(各跑一次,填进下面)
openssl rand -hex 32   # 用于 JWT_AUTH_TOKEN_SECRET
openssl rand -hex 32   # 用于 JWT_REFRESH_TOKEN_SECRET
openssl rand -hex 32   # 用于 EXPRESS_SESSION_SECRET / TOKEN_HASH_SECRET
nano .env
```

`.env` 必填项(**生产务必显式设密钥,否则重启后登录态/凭证全失效**):

```ini
PORT=3000
APP_URL=https://你的域名            # 没域名先填 http://公网IP:3000

# —— 数据库(PostgreSQL)——
DATABASE_TYPE=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=flowops
DATABASE_USER=flowops
DATABASE_PASSWORD=换成你第3步设的强密码

# —— 自建 IAM:认准这一行 ——
FLOWOPS_IAM=self

# —— 认证密钥(填上面 openssl 生成的值,固定下来)——
JWT_AUTH_TOKEN_SECRET=<openssl值1>
JWT_REFRESH_TOKEN_SECRET=<openssl值2>
EXPRESS_SESSION_SECRET=<openssl值3>
TOKEN_HASH_SECRET=<再生成一个 openssl 值>

# —— 凭证加密密钥(加密你存的 API Key 等,务必固定+备份)——
FLOWISE_SECRETKEY_OVERWRITE=<再生成一个 openssl rand -hex 32>

# —— 生产建议 ——
CORS_ORIGINS=https://你的域名
DISABLE_FLOWISE_TELEMETRY=true
```

> **`FLOWISE_SECRETKEY_OVERWRITE` 一旦定下别再改**——它是凭证(API Key 等)的加密密钥,改了已存的凭证就解不开了。它和 `.env` 一起属于最高机密,纳入备份(§10)。

---

## 6. 首次启动 + 注册 owner

```bash
cd ~/flowops
NODE_OPTIONS=--max-old-space-size=1024 pnpm start
# 看到 "Flowise Server is listening at :3000" 即成功
```

浏览器访问 `http://<公网IP>:3000`(需先在安全组临时放行 3000,§9 配好 nginx 后关掉):

-   **第一个注册的账号自动成为 owner**(自建 IAM 规则)。注册它,这就是你的最高权限账号。
-   之后新增成员走 **邀请注册**(owner 在「用户管理」生成邀请)。

确认能登录、能进后台后,`Ctrl-C` 停掉,进入 §7 用进程守护正式拉起。

---

## 7. 进程守护(PM2 + 开机自启)

```bash
npm install -g pm2

cd ~/flowops
# 用限堆参数常驻;run-script-os 会调到 server
NODE_OPTIONS=--max-old-space-size=1024 pm2 start pnpm --name flowops -- start
pm2 save
pm2 startup    # 按它输出的那行 sudo 命令执行一次,实现开机自启

pm2 logs flowops      # 看日志
pm2 restart flowops   # 重启
```

---

## 8. Nginx 反向代理 + HTTPS

```bash
sudo apt install -y nginx   # 或 dnf install -y nginx
sudo nano /etc/nginx/conf.d/flowops.conf
```

```nginx
server {
    listen 80;
    server_name 你的域名;

    client_max_body_size 50m;     # 允许上传较大文件(知识库文档等)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;          # SSE/WebSocket(流式对话)
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;                          # 长回答/长任务不被掐断
        proxy_cache off;
    }
}
```

```bash
sudo nginx -t && sudo systemctl enable --now nginx

# 免费 HTTPS 证书(Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名      # 自动改 nginx 配置 + 配置自动续期
```

> 配好 nginx 后,把 `.env` 的 `APP_URL`/`CORS_ORIGINS` 改成 `https://你的域名`,`pm2 restart flowops`。

---

## 9. 阿里云安全组(在控制台「ECS → 安全组」配)

| 方向 | 端口     | 来源                   | 说明                          |
| ---- | -------- | ---------------------- | ----------------------------- |
| 入   | 22       | **仅你的办公/家庭 IP** | SSH,别对 0.0.0.0/0 全开       |
| 入   | 80       | 0.0.0.0/0              | HTTP(certbot 验证+跳转 HTTPS) |
| 入   | 443      | 0.0.0.0/0              | HTTPS                         |
| —    | **3000** | **不开放**             | 内部端口,只走 nginx 反代      |
| —    | **5432** | **不开放**             | PG 只监听本机                 |

---

## 10. 备份与恢复(每天一次,雷打不动)

**要备的三样**:① PG 数据 ② `.env`(含密钥)③ `~/.flowise`(本地密钥/上传文件,若用到)。

```bash
mkdir -p ~/backups
cat > ~/backup-flowops.sh <<'EOF'
#!/usr/bin/env bash
set -e
TS=$(date +%Y%m%d-%H%M)
BK=~/backups/$TS && mkdir -p "$BK"
PGPASSWORD='你的PG密码' pg_dump -U flowops -h 127.0.0.1 -Fc flowops > "$BK/flowops-pg.dump"
cp ~/flowops/packages/server/.env "$BK/env.bak"
tar -czf "$BK/dot-flowise.tgz" -C ~ .flowise 2>/dev/null || true
find ~/backups -maxdepth 1 -type d -mtime +14 -exec rm -rf {} \;   # 留14天
echo "backup done: $BK"
EOF
chmod +x ~/backup-flowops.sh
# 每天凌晨 3 点
(crontab -l 2>/dev/null; echo "0 3 * * * ~/backup-flowops.sh >> ~/backups/cron.log 2>&1") | crontab -
```

**恢复**:

```bash
PGPASSWORD='密码' psql -U flowops -h 127.0.0.1 -c "DROP DATABASE IF EXISTS flowops;" -c "CREATE DATABASE flowops OWNER flowops;"
PGPASSWORD='密码' pg_restore -U flowops -h 127.0.0.1 -d flowops ~/backups/<时间戳>/flowops-pg.dump
cp ~/backups/<时间戳>/env.bak ~/flowops/packages/server/.env
pm2 restart flowops
```

> ⚠️ 把 `~/backups` 定期下载到本地或传阿里云 OSS——同机备份扛不住整盘故障。

---

## 11. 升级流程

```bash
cd ~/flowops
~/backup-flowops.sh                      # 升级前先备份
git pull origin main
pnpm install --frozen-lockfile
NODE_OPTIONS=--max-old-space-size=1536 pnpm build    # 同 §4,仍要防 OOM
pm2 restart flowops
pm2 logs flowops --lines 50              # 确认起来了
```

> 数据库 migration 在 server 启动时自动跑(self 轨用 ship 集),无需手动操作。

---

## 12. 故障排查

| 症状                                  | 排查                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm build` 卡死/进程被杀            | `dmesg \| grep -i oom`,十有八九 OOM → 确认 swap 已挂(`free -h`)+ 用 §4 的「停 PG 单独 build」法 |
| 启动报 `Auth secrets not initialized` | `.env` 里 JWT\_\*/SESSION/TOKEN_HASH 密钥没填全(§5)                                             |
| 启动报 `ECONNREFUSED 127.0.0.1:5432`  | PG 没起:`sudo systemctl status postgresql`                                                      |
| 登录报错 / 平台异常                   | 确认 `.env` 有 `FLOWOPS_IAM=self`;`pm2 logs flowops` 看栈                                       |
| 重启后所有人要重新登录/凭证失效       | JWT/加密密钥没固定在 `.env`(用了临时生成值)→ 按 §5 固定                                         |
| 网页能开但流式对话卡住                | nginx 缺 `proxy_read_timeout` / `Upgrade` 头(§8)                                                |
| 内存告警、偶发卡顿                    | `pm2 monit` 看占用;PG 调优(§3.1)是否生效;必要时升配到 2 核 4G                                   |

---

## 附:这套部署的合规说明

本部署用 **`FLOWOPS_IAM=self`(自建 IAM)**,认证/角色/工作区全部走 FlowOps 自有实现,**不依赖也不加载 FlowiseAI 商业授权代码**——可合法用于对外交付。若要彻底剔除仓库内的 enterprise 源码(出货纯净版),用 `scripts/build-ship.sh` 产出剪除版 dist(见 `docs/iam-selfbuild.md`),其 `scripts/verify-ship-dist.sh` 可作为发布前的零残留门禁。

> 2 核 2G 适合:**单客户私有化 / 中小团队 / PoC**。并发量上来(多人同时跑复杂 Agent/RAG)建议升 **2 核 4G 或 4 核 8G**——瓶颈通常先出在内存,其次 CPU。
