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

exec rg "$@" "${ALLOW[@]}"
