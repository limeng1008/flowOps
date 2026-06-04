# FlowOps 桌面端（Electron）

把 FlowOps **整套服务 + UI** 封装进一个桌面应用：双击启动，数据全部留在本机（SQLite + 本地文件存储），无需 Docker、无需配置数据库。面向**个人试用**与**单机/气隙涉密**场景，作为 Docker 服务器版之外的第二条分发渠道。

## 设计原则

-   **不改 Flowise 核心**：后端的端口、数据库、存储、密钥、日志路径全部通过环境变量注入；`desktop/` 全部为新增文件（only-add，符合 fork 纪律）。
-   **单机自包含**：所有数据写入操作系统的 per-user 目录（`app.getPath('userData')/data`），卸载不残留、迁移只需拷目录。
-   **本地优先**：服务只监听 `127.0.0.1`，不对外暴露。

## 运行架构

```
Electron 主进程 (main.js)
  ├─ 找空闲端口 → 拉起后端子进程 (server-bootstrap.js)
  │     env: HOST=127.0.0.1, PORT, DATABASE_PATH/BLOB_STORAGE_PATH/...=userData/data
  │     dev  : 系统 node   运行 bootstrap（原生模块按 node ABI）
  │     prod : electron-as-node 运行 bootstrap（原生模块按 Electron ABI，见 Phase C）
  ├─ 轮询 http://127.0.0.1:PORT 直到就绪（期间显示 loading.html 闪屏）
  └─ 开窗 BrowserWindow 加载 http://127.0.0.1:PORT/  → 即 flowise 服务自带托管的 FlowOps UI
```

## 开发模式运行（在你的 Mac 上）

> ⚠️ 必须先用 **Node 20**（系统默认 node 22 会让原生模块 sqlite3/faiss-node 崩溃）。

```bash
# 1) 仓库根目录：确保后端与 UI 已构建（桌面壳直接复用构建产物）
source ~/.nvm/nvm.sh && nvm use 20
pnpm build                       # 生成 packages/server/dist、packages/ui/build、packages/components/dist

# 2) 安装桌面壳依赖（独立于 pnpm workspace，不会影响根 @types/node）
cd desktop
npm install                      # 拉取 electron / electron-builder

# 3) 启动桌面应用
npm start
```

首次启动会在 `~/Library/Application Support/FlowOps/data/`（macOS）下初始化 `database.sqlite` 与 `storage/`。

可选环境变量：

| 变量                 | 作用                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| `FLOWOPS_NODE_BIN`   | 指定 dev 模式拉起后端用的 node 可执行文件（默认 `node`）               |
| `FLOWOPS_DATA_DIR`   | 覆盖数据目录（默认 `userData/data`）                                   |
| `FLOWOPS_SERVER_DIR` | 覆盖后端目录（默认 dev=`../packages/server`，prod=`resources/server`） |

## 状态

-   **Phase A（当前）**：Electron 外壳 —— 拉起后端、就绪开窗、闪屏、单实例、托盘、优雅退出。可在本机 `npm start` 看到 FlowOps 窗口。
-   **Phase B**：单机本地化体验 —— 首启账号旁路、端口/多实例、中文菜单、数据目录管理、后端崩溃自动重启。
-   **Phase C**：打包/签名/自动更新 —— electron-builder 跨平台打包、原生模块方案、Win 签名 + macOS 公证、electron-updater、信创(龙芯/麒麟/UOS ARM)评估。**成本最重的一段。**

> 图标资源见 `assets/README.md`；Phase A 可无图标运行。
