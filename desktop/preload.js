// FlowOps Desktop —— preload（contextIsolation 开启，仅暴露最小只读信息）
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('flowops', {
    desktop: true,
    platform: process.platform,
    version: process.env.FLOWOPS_APP_VERSION || '0.1.0'
})
