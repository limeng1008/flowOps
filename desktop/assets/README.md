# 桌面端图标资源

Phase A 可在**无图标**下直接运行（Electron 使用默认图标，托盘自动跳过）。
正式打包（Phase C）前请放入以下文件：

| 文件               | 用途             | 规格                                       |
| ------------------ | ---------------- | ------------------------------------------ |
| `icon.icns`        | macOS 应用图标   | 1024×1024                                  |
| `icon.ico`         | Windows 应用图标 | 含 256×256                                 |
| `icon.png`         | Linux 应用图标   | 512×512                                    |
| `trayTemplate.png` | 系统托盘图标     | 16×16 / 32×32（macOS 用模板图，纯黑+透明） |

可由 FlowOps 品牌字标（`packages/ui/src/...Logo`）导出后用 `electron-icon-builder` 一键生成多尺寸。
