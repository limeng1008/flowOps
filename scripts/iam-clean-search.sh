#!/usr/bin/env bash
# 清洁室安全搜索(IAM 自建期间,所有仓库代码搜索必须走本脚本)
# 用法: scripts/iam-clean-search.sh <rg 参数和模式...>
# 设计: 固定目录白名单,物理上不含 src/enterprise/ 与 IdentityManager.ts;
#       禁止把 packages/server/src 整目录作为搜索根(enterprise 在其下)。
set -euo pipefail

ALLOW=(
    packages/ui/src
    packages/components
    packages/server/src/iam
    packages/server/src/routes
    packages/server/src/controllers
    packages/server/src/services
    packages/server/src/utils
    packages/server/src/database
    packages/server/src/queue
    packages/server/src/schedule
    packages/server/src/commands
    packages/server/src/index.ts
    packages/server/src/DataSource.ts
    packages/server/src/Interface.ts
    packages/server/scripts
    docs
    .planning
)

# 事件 #5 加固:拒收一切路径型参数——本脚本只接受 rg 选项与搜索模式,
# 搜索根永远只能是下方白名单。传入任何"存在的文件/目录"立即拒绝。
for arg in "$@"; do
    if [ -e "$arg" ]; then
        echo "❌ 清洁搜索拒绝:参数 '$arg' 是真实路径。本脚本不接受自定义搜索根(白名单焊死)。" >&2
        exit 2
    fi
done

exec rg "$@" "${ALLOW[@]}"
