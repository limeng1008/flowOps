// FlowOps Desktop —— 后端引导脚本
//
// 运行环境：
//   - 开发模式：用系统 Node 20 运行（原生模块 sqlite3 / faiss-node 按 node ABI 构建）
//   - 打包模式：用 electron-as-node 运行（ELECTRON_RUN_AS_NODE=1，原生模块需按 Electron ABI 重编）
//
// 不经过 oclif CLI，直接调用 flowise 服务包导出的 DataSource.init() + Server.start()，
// 与 packages/server/src/commands/start.ts 的启动顺序保持一致。
const path = require('path')

async function main() {
    const serverDir = process.env.FLOWOPS_SERVER_DIR
    if (!serverDir) {
        throw new Error('FLOWOPS_SERVER_DIR 未设置：主进程未正确传入服务目录')
    }

    const distIndex = path.join(serverDir, 'dist', 'index')
    const distDataSource = path.join(serverDir, 'dist', 'DataSource')

    const Server = require(distIndex)
    const DataSource = require(distDataSource)

    await DataSource.init()
    await Server.start() // 内部 server.listen(PORT, HOST)，进程随之保持存活

    // eslint-disable-next-line no-console
    console.log(`[FlowOps] 服务已启动，监听 ${process.env.HOST}:${process.env.PORT}`)
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[FlowOps] 后端启动失败:', err && err.stack ? err.stack : err)
    process.exit(1)
})
