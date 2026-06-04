// FlowOps Desktop —— Electron 主进程
//
// 职责：
//   1. 启动时把 flowise 后端作为子进程拉起，并将数据库/存储/密钥/日志重定向到 userData
//   2. 轮询本地端口直到服务就绪，再开窗加载 http://127.0.0.1:PORT 的本地 FlowOps UI
//   3. 单实例锁、启动闪屏、系统托盘、外链转系统浏览器、退出时优雅关闭后端
//
// 设计前提：不修改 Flowise 核心。后端的端口/数据库/存储路径全部通过 env 注入，
// 因此本文件及 desktop/ 目录均为 only-add。
const { app, BrowserWindow, Tray, Menu, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const net = require('net')
const { spawn } = require('child_process')

const isDev = !app.isPackaged
const HOST = '127.0.0.1'

let mainWindow = null
let loadingWindow = null
let tray = null
let serverProc = null
let serverPort = 0
let isQuitting = false

// --------------------------------------------------------------------------
// 路径解析
// --------------------------------------------------------------------------
function resolveServerDir() {
    if (process.env.FLOWOPS_SERVER_DIR) return process.env.FLOWOPS_SERVER_DIR
    if (isDev) return path.join(__dirname, '..', 'packages', 'server')
    // 打包模式：electron-builder 通过 extraResources 把 server 复制到 resources/server（Phase C）
    return path.join(process.resourcesPath, 'server')
}

function ensureDataDir() {
    const base = process.env.FLOWOPS_DATA_DIR || path.join(app.getPath('userData'), 'data')
    fs.mkdirSync(base, { recursive: true })
    fs.mkdirSync(path.join(base, 'storage'), { recursive: true })
    fs.mkdirSync(path.join(base, 'logs'), { recursive: true })
    return base
}

// 开发模式下 packages/server/.env 会被 dotenv 以 override:true 加载，
// 其 PORT 会盖掉我们注入的端口；这里读出它，让窗口指向同一端口。
// 打包模式不捆绑该 .env，注入的动态端口生效，本函数返回 null。
function resolveDevPortFromEnvFile(serverDir) {
    try {
        const envPath = path.join(serverDir, '.env')
        if (fs.existsSync(envPath)) {
            const m = fs.readFileSync(envPath, 'utf8').match(/^\s*PORT\s*=\s*(\d+)/m)
            if (m) return parseInt(m[1], 10)
        }
    } catch (e) {
        /* ignore */
    }
    return null
}

// --------------------------------------------------------------------------
// 找一个空闲端口
// --------------------------------------------------------------------------
function getFreePort() {
    return new Promise((resolve, reject) => {
        const srv = net.createServer()
        srv.unref()
        srv.on('error', reject)
        srv.listen(0, HOST, () => {
            const port = srv.address().port
            srv.close(() => resolve(port))
        })
    })
}

// --------------------------------------------------------------------------
// 拉起后端子进程
// --------------------------------------------------------------------------
function startServer(port) {
    const serverDir = resolveServerDir()
    const dataDir = ensureDataDir()

    const env = {
        ...process.env,
        NODE_ENV: 'production',
        HOST,
        PORT: String(port),
        // —— 数据全部落到 userData，单机自包含 ——
        DATABASE_TYPE: 'sqlite',
        DATABASE_PATH: dataDir,
        STORAGE_TYPE: 'local',
        BLOB_STORAGE_PATH: path.join(dataDir, 'storage'),
        SECRETKEY_PATH: dataDir,
        APIKEY_PATH: dataDir,
        LOG_PATH: path.join(dataDir, 'logs'),
        DISABLE_FLOWISE_TELEMETRY: 'true',
        FLOWOPS_SERVER_DIR: serverDir
    }

    const bootstrap = path.join(__dirname, 'server-bootstrap.js')
    let cmd
    const args = [bootstrap]
    if (isDev) {
        // 开发：用系统 Node（需 node 20，原生模块按 node ABI 构建）
        cmd = process.env.FLOWOPS_NODE_BIN || 'node'
    } else {
        // 打包：用 electron-as-node（原生模块需按 Electron ABI 重编，见 Phase C）
        cmd = process.execPath
        env.ELECTRON_RUN_AS_NODE = '1'
    }

    serverProc = spawn(cmd, args, { cwd: serverDir, env, stdio: ['ignore', 'pipe', 'pipe'] })
    serverProc.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`))
    serverProc.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`))
    serverProc.on('exit', (code, signal) => {
        serverProc = null
        if (!isQuitting) {
            dialog.showErrorBox(
                'FlowOps 服务已停止',
                `后端进程意外退出 (code=${code}, signal=${signal})。\n日志目录：${path.join(ensureDataDir(), 'logs')}`
            )
            isQuitting = true
            app.quit()
        }
    })
}

// --------------------------------------------------------------------------
// 轮询直到服务就绪
// --------------------------------------------------------------------------
function waitForServer(port, timeoutMs = 90000) {
    const startedAt = Date.now()
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const req = http.get({ host: HOST, port, path: '/', timeout: 3000 }, (res) => {
                res.resume()
                resolve()
            })
            req.on('error', retry)
            req.on('timeout', () => {
                req.destroy()
                retry()
            })
        }
        const retry = () => {
            if (Date.now() - startedAt > timeoutMs) {
                return reject(new Error(`本地服务在 ${timeoutMs / 1000}s 内未就绪`))
            }
            setTimeout(attempt, 500)
        }
        attempt()
    })
}

// --------------------------------------------------------------------------
// 窗口
// --------------------------------------------------------------------------
function createLoadingWindow() {
    loadingWindow = new BrowserWindow({
        width: 480,
        height: 320,
        frame: false,
        resizable: false,
        movable: true,
        backgroundColor: '#0b1f3a',
        show: true,
        webPreferences: { contextIsolation: true }
    })
    loadingWindow.loadFile(path.join(__dirname, 'loading.html'))
}

function closeLoadingWindow() {
    if (loadingWindow && !loadingWindow.isDestroyed()) loadingWindow.close()
    loadingWindow = null
}

function createMainWindow(port) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 960,
        minHeight: 600,
        backgroundColor: '#ffffff',
        title: 'FlowOps',
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadURL(`http://${HOST}:${port}/`)

    mainWindow.once('ready-to-show', () => {
        closeLoadingWindow()
        mainWindow.show()
    })

    // 外部链接交给系统浏览器，避免在应用内打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://' + HOST) || url.startsWith('https://' + HOST)) {
            return { action: 'allow' }
        }
        shell.openExternal(url)
        return { action: 'deny' }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// --------------------------------------------------------------------------
// 托盘（图标缺失时静默跳过，Phase A 可无图标运行）
// --------------------------------------------------------------------------
function createTray() {
    try {
        const iconPath = path.join(__dirname, 'assets', 'trayTemplate.png')
        if (!fs.existsSync(iconPath)) return
        tray = new Tray(iconPath)
        const menu = Menu.buildFromTemplate([
            { label: '显示 FlowOps', click: () => mainWindow && mainWindow.show() },
            { label: '打开数据目录', click: () => shell.openPath(ensureDataDir()) },
            { type: 'separator' },
            {
                label: '退出',
                click: () => {
                    isQuitting = true
                    app.quit()
                }
            }
        ])
        tray.setToolTip('FlowOps')
        tray.setContextMenu(menu)
        tray.on('click', () => mainWindow && mainWindow.show())
    } catch (e) {
        // Phase A 容忍托盘失败
        process.stderr.write(`[desktop] 托盘初始化跳过: ${e}\n`)
    }
}

// --------------------------------------------------------------------------
// 生命周期
// --------------------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show()
            mainWindow.focus()
        }
    })

    app.whenReady().then(async () => {
        createLoadingWindow()
        try {
            serverPort = (isDev && resolveDevPortFromEnvFile(resolveServerDir())) || (await getFreePort())
            startServer(serverPort)
            await waitForServer(serverPort)
            createMainWindow(serverPort)
            createTray()
        } catch (err) {
            closeLoadingWindow()
            dialog.showErrorBox('FlowOps 启动失败', String((err && err.message) || err))
            isQuitting = true
            app.quit()
        }
    })

    app.on('activate', () => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show()
    })

    app.on('window-all-closed', () => {
        isQuitting = true
        app.quit()
    })

    app.on('before-quit', () => {
        isQuitting = true
    })

    app.on('quit', () => {
        if (serverProc) {
            try {
                serverProc.kill('SIGTERM')
            } catch (e) {
                /* ignore */
            }
        }
    })
}

// 进程级清理（开发模式 Ctrl-C）
function cleanupAndExit() {
    isQuitting = true
    if (serverProc) {
        try {
            serverProc.kill('SIGTERM')
        } catch (e) {
            /* ignore */
        }
    }
    process.exit(0)
}
process.on('SIGINT', cleanupAndExit)
process.on('SIGTERM', cleanupAndExit)
