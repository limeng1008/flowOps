# FlowOps 私有化镜像 —— 从本仓库源码构建（含国产模型/embedding、导出节点、企微飞书连接器、全中文化）
# 注意：官方 flowiseai/flowise 镜像是上游 Flowise，不含 FlowOps 的二开内容，所以这里必须从源码构建。
FROM node:20-alpine

# 原生模块编译依赖(sqlite3/faiss-node 等) + 运行时依赖(chromium 供 puppeteer / 文档抓取)
RUN apk add --no-cache chromium git python3 py3-pip make g++ build-base cairo-dev pango-dev curl

# 跳过 puppeteer 下载 chrome，改用系统 chromium（离线/信创友好）
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# UI(vite) 构建较吃内存，给足堆空间避免 OOM
ENV NODE_OPTIONS=--max-old-space-size=4096

# 仓库要求 pnpm ^10.26.0
RUN npm install -g pnpm@10.26.0

WORKDIR /app
COPY . .

# 安装 + 构建（build:docker 为上游约定的镜像构建目标，排除企业版 agentflow/observe）
RUN pnpm install --frozen-lockfile && pnpm build:docker

ENV PORT=3000
EXPOSE 3000

# run-script-os -> start:default -> cd packages/server/bin && ./run start
CMD ["pnpm", "start"]
