# FlowOps IAM P3 T0 Seam Ledger

P3 T0 audit date: 2026-06-13

Latest bridge-ledger update: 2026-06-14, T2.2 entities self mapping.

Branch: `codex/iam-p3-ship`

Plan baseline: `.planning/flowops-second-dev/codex-flowops-iam-p3-ship-plan.md` at local commit `650605ac`

Clean-room notes:

-   Code searches used `scripts/iam-clean-search.sh`.
-   `packages/server/src/enterprise/**` and `packages/server/src/IdentityManager.ts` implementations were not opened.
-   Main `flowops_` production data was not modified.
-   T0 scope only; no code seams, UI files, migrations, or business data were changed.
-   This isolated worktree has no `.env`; true-machine startup probes used one-shot process environment variables with the plan's PG defaults and only called read-only `/api/v1/settings`.

## Bridge Ledger

Command:

```bash
scripts/iam-clean-search.sh -n "as unknown as"
```

P3 seam bridges in `packages/server/src/iam/**`: 14 total.

| File                                    | Line | Direction                                                                     | Use                                                                                                    | P4 removal condition                                                                 |
| --------------------------------------- | ---: | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `packages/server/src/iam/boot.ts`       |   19 | enterprise passport -> self-owned `InitializeJwtCookieMiddleware` signature   | Isolates `initializeJwtCookieMiddleware` call-site typing from enterprise implementation types.        | Remove when enterprise App slot and passport seam are deleted.                       |
| `packages/server/src/iam/boot.ts`       |   21 | enterprise passport -> self-owned Express middleware signature                | Isolates `verifyToken` call-site typing from enterprise implementation types.                          | Remove when enterprise passport seam is deleted.                                     |
| `packages/server/src/iam/boot.ts`       |   23 | enterprise passport -> self-owned Express middleware signature                | Isolates `verifyTokenForBullMQDashboard` call-site typing from enterprise implementation types.        | Remove when enterprise BullMQ dashboard auth seam is deleted.                        |
| `packages/server/src/iam/boot.ts`       |   25 | enterprise auth secrets -> self-owned init signature                          | Isolates `initAuthSecrets` call-site typing from enterprise implementation types.                      | Remove when enterprise auth secret seam is deleted.                                  |
| `packages/server/src/iam/entities.ts`   |   69 | `FlowOpsOrganization` -> legacy `Organization` entity constructor view        | Lets self-mode Apache services call `getRepository(Organization)` against `flowops_organization`.      | Remove when P4 flips entity consumers to self-owned entity exports.                  |
| `packages/server/src/iam/entities.ts`   |   81 | `FlowOpsRole` -> legacy `Role` entity constructor view                        | Lets self-mode Apache services call `getRepository(Role)` against `flowops_role`.                      | Remove when P4 flips entity consumers to self-owned entity exports.                  |
| `packages/server/src/iam/entities.ts`   |   88 | `FlowOpsUser` -> legacy `User` entity constructor view                        | Lets self-mode Apache services call `getRepository(User)` against `flowops_user`.                      | Remove when P4 flips entity consumers to self-owned entity exports.                  |
| `packages/server/src/iam/entities.ts`   |   95 | `FlowOpsWorkspace` -> legacy `Workspace` entity constructor view              | Lets self-mode Apache services call `getRepository(Workspace)` against `flowops_workspace`.            | Remove when P4 flips entity consumers to self-owned entity exports.                  |
| `packages/server/src/iam/entities.ts`   |  102 | `FlowOpsWorkspaceMember` -> legacy `WorkspaceUser` entity constructor view    | Lets self-mode Apache services call `getRepository(WorkspaceUser)` against `flowops_workspace_member`. | Remove when P4 flips entity consumers to self-owned entity exports.                  |
| `packages/server/src/iam/identity.ts`   |   41 | runtime `require('../IdentityManager')` -> self-owned constructor module view | Keeps enterprise identity constructor behind an iam-owned type-erasure bridge.                         | Remove when `IdentityManager.ts` is physically removed and P4 flips the legacy slot. |
| `packages/server/src/iam/identity.ts`   |   52 | `IFlowOpsIdentity` -> legacy `IdentityManager` App-slot view                  | Supplies the legacy App identity slot without widening self-owned interfaces.                          | Remove when P4 flips `App.identityManager` to `IFlowOpsIdentity`.                    |
| `packages/server/src/iam/identity.ts`   |   55 | legacy `IdentityManager` App-slot view -> `IFlowOpsIdentity`                  | Converts legacy slot values back into self-owned IAM contexts.                                         | Remove when P4 removes the legacy slot bridge.                                       |
| `packages/server/src/iam/middleware.ts` |   13 | enterprise permission factory -> self-owned permission factory signature      | Isolates `checkPermission` call-site typing from enterprise implementation types.                      | Remove when enterprise RBAC middleware seam is deleted.                              |
| `packages/server/src/iam/middleware.ts` |   15 | enterprise permission factory -> self-owned permission factory signature      | Isolates `checkAnyPermission` call-site typing from enterprise implementation types.                   | Remove when enterprise RBAC middleware seam is deleted.                              |

Known non-IAM server runtime casts: 3 total, upstream/non-P3 seam.

| File                                            | Line | Direction                               | Use                                                     | P4 removal condition |
| ----------------------------------------------- | ---: | --------------------------------------- | ------------------------------------------------------- | -------------------- |
| `packages/server/src/utils/buildAgentGraph.ts`  |  970 | graph state messages -> `BaseMessage[]` | Existing graph runtime cast, unrelated to IAM seam.     | Not a P4 IAM bridge. |
| `packages/server/src/utils/createAttachment.ts` |  199 | PDF legacy build config -> `string`     | Existing attachment config cast, unrelated to IAM seam. | Not a P4 IAM bridge. |
| `packages/server/src/utils/mockRequest.ts`      |   47 | mock object -> Express `Request`        | Existing request helper cast, unrelated to IAM seam.    | Not a P4 IAM bridge. |

Other wrapper hits are test-only or component-side casts and are outside the P3 IAM seam inventory.

## Enterprise Touch Panorama

Command:

```bash
scripts/iam-clean-search.sh -n -e "from '[^']*enterprise" -e "require\\(.*enterprise" \
  | awk '$0 !~ /\\.test\\.ts:/ && $0 !~ /^\\.planning\\// && $0 !~ /^docs\\//'
```

Current count: 81 lines.

Expected target groups per T0.5 ruling:

-   `packages/server/src/iam/**` seam files.
-   `packages/server/src/database/migrations/{mysql,postgres,sqlite,mariadb}/index.ts`.
-   `packages/server/src/database/migrations/{mysql,postgres,sqlite,mariadb}/1765360298674-AddApiKeyPermission.ts` as P0-known touch points.
-   `packages/server/src/IdentityManager.ts` is a known commercial boundary file from the plan, but was not opened or searched by wrapper.

Full wrapper list:

```text
packages/server/src/iam/services.ts:1:export { WorkspaceService } from '../enterprise/services/workspace.service'
packages/server/src/iam/services.ts:2:export { WorkspaceUserErrorMessage, WorkspaceUserService } from '../enterprise/services/workspace-user.service'
packages/server/src/iam/query.ts:5:} from '../enterprise/utils/ControllerServiceUtils'
packages/server/src/iam/query.ts:6:import { getActiveWorkspaceIdForRequest as enterpriseGetActiveWorkspaceIdForRequest } from '../enterprise/utils/tenantRequestGuards'
packages/server/src/iam/sso.ts:1:export { default as Auth0SSO } from '../enterprise/sso/Auth0SSO'
packages/server/src/iam/sso.ts:2:export { default as AzureSSO } from '../enterprise/sso/AzureSSO'
packages/server/src/iam/sso.ts:3:export { default as GithubSSO } from '../enterprise/sso/GithubSSO'
packages/server/src/iam/sso.ts:4:export { default as GoogleSSO } from '../enterprise/sso/GoogleSSO'
packages/server/src/iam/boot.ts:6:} from '../enterprise/middleware/passport'
packages/server/src/iam/boot.ts:7:import { initAuthSecrets as enterpriseInitAuthSecrets } from '../enterprise/utils/authSecrets'
packages/server/src/iam/security.ts:1:export { getHash } from '../enterprise/utils/encryption.util'
packages/server/src/iam/security.ts:2:export { validatePasswordOrThrow } from '../enterprise/utils/validation.util'
packages/server/src/iam/entities.ts:1:export { LoginActivity, WorkspaceShared, WorkspaceUsers } from '../enterprise/database/entities/EnterpriseEntities'
packages/server/src/iam/entities.ts:2:export { LoginMethod } from '../enterprise/database/entities/login-method.entity'
packages/server/src/iam/entities.ts:3:export { LoginSession } from '../enterprise/database/entities/login-session.entity'
packages/server/src/iam/entities.ts:4:export { Organization } from '../enterprise/database/entities/organization.entity'
packages/server/src/iam/entities.ts:5:export { OrganizationUser } from '../enterprise/database/entities/organization-user.entity'
packages/server/src/iam/entities.ts:6:export { Role } from '../enterprise/database/entities/role.entity'
packages/server/src/iam/entities.ts:7:export { User } from '../enterprise/database/entities/user.entity'
packages/server/src/iam/entities.ts:8:export { Workspace } from '../enterprise/database/entities/workspace.entity'
packages/server/src/iam/entities.ts:9:export { WorkspaceUser } from '../enterprise/database/entities/workspace-user.entity'
packages/server/src/iam/entities.ts:10:export type { ErrorMessage, LoggedInUser } from '../enterprise/Interface.Enterprise'
packages/server/src/iam/middleware.ts:5:} from '../enterprise/rbac/PermissionCheck'
packages/server/src/iam/routes.ts:1:import enterpriseAccountRouter from '../enterprise/routes/account.route'
packages/server/src/iam/routes.ts:2:import enterpriseAuditRouter from '../enterprise/routes/audit'
packages/server/src/iam/routes.ts:3:import enterpriseAuthRouter from '../enterprise/routes/auth'
packages/server/src/iam/routes.ts:4:import enterpriseLoginMethodRouter from '../enterprise/routes/login-method.route'
packages/server/src/iam/routes.ts:5:import enterpriseOrganizationUserRoute from '../enterprise/routes/organization-user.route'
packages/server/src/iam/routes.ts:6:import enterpriseOrganizationRouter from '../enterprise/routes/organization.route'
packages/server/src/iam/routes.ts:7:import enterpriseRoleRouter from '../enterprise/routes/role.route'
packages/server/src/iam/routes.ts:8:import enterpriseUserRouter from '../enterprise/routes/user.route'
packages/server/src/iam/routes.ts:9:import enterpriseWorkspaceUserRouter from '../enterprise/routes/workspace-user.route'
packages/server/src/iam/routes.ts:10:import enterpriseWorkspaceRouter from '../enterprise/routes/workspace.route'
packages/server/src/database/migrations/mysql/index.ts:60:import { AddAuthTables1720230151482 } from '../../../enterprise/database/migrations/mysql/1720230151482-AddAuthTables'
packages/server/src/database/migrations/mysql/index.ts:61:import { AddWorkspace1720230151484 } from '../../../enterprise/database/migrations/mysql/1720230151484-AddWorkspace'
packages/server/src/database/migrations/mysql/index.ts:62:import { AddWorkspaceShared1726654922034 } from '../../../enterprise/database/migrations/mysql/1726654922034-AddWorkspaceShared'
packages/server/src/database/migrations/mysql/index.ts:63:import { AddWorkspaceIdToCustomTemplate1726655750383 } from '../../../enterprise/database/migrations/mysql/1726655750383-AddWorkspaceIdToCustomTemplate'
packages/server/src/database/migrations/mysql/index.ts:64:import { AddOrganization1727798417345 } from '../../../enterprise/database/migrations/mysql/1727798417345-AddOrganization'
packages/server/src/database/migrations/mysql/index.ts:65:import { LinkWorkspaceId1729130948686 } from '../../../enterprise/database/migrations/mysql/1729130948686-LinkWorkspaceId'
packages/server/src/database/migrations/mysql/index.ts:66:import { LinkOrganizationId1729133111652 } from '../../../enterprise/database/migrations/mysql/1729133111652-LinkOrganizationId'
packages/server/src/database/migrations/mysql/index.ts:67:import { AddSSOColumns1730519457880 } from '../../../enterprise/database/migrations/mysql/1730519457880-AddSSOColumns'
packages/server/src/database/migrations/mysql/index.ts:68:import { AddPersonalWorkspace1734074497540 } from '../../../enterprise/database/migrations/mysql/1734074497540-AddPersonalWorkspace'
packages/server/src/database/migrations/mysql/index.ts:69:import { RefactorEnterpriseDatabase1737076223692 } from '../../../enterprise/database/migrations/mysql/1737076223692-RefactorEnterpriseDatabase'
packages/server/src/database/migrations/mysql/index.ts:70:import { ExecutionLinkWorkspaceId1746862866554 } from '../../../enterprise/database/migrations/mysql/1746862866554-ExecutionLinkWorkspaceId'
packages/server/src/database/migrations/mysql/1765360298674-AddApiKeyPermission.ts:2:import { Role } from '../../../enterprise/database/entities/role.entity'
packages/server/src/database/migrations/postgres/index.ts:58:import { AddAuthTables1720230151482 } from '../../../enterprise/database/migrations/postgres/1720230151482-AddAuthTables'
packages/server/src/database/migrations/postgres/index.ts:59:import { AddWorkspace1720230151484 } from '../../../enterprise/database/migrations/postgres/1720230151484-AddWorkspace'
packages/server/src/database/migrations/postgres/index.ts:60:import { AddWorkspaceShared1726654922034 } from '../../../enterprise/database/migrations/postgres/1726654922034-AddWorkspaceShared'
packages/server/src/database/migrations/postgres/index.ts:61:import { AddWorkspaceIdToCustomTemplate1726655750383 } from '../../../enterprise/database/migrations/postgres/1726655750383-AddWorkspaceIdToCustomTemplate'
packages/server/src/database/migrations/postgres/index.ts:62:import { AddOrganization1727798417345 } from '../../../enterprise/database/migrations/postgres/1727798417345-AddOrganization'
packages/server/src/database/migrations/postgres/index.ts:63:import { LinkWorkspaceId1729130948686 } from '../../../enterprise/database/migrations/postgres/1729130948686-LinkWorkspaceId'
packages/server/src/database/migrations/postgres/index.ts:64:import { LinkOrganizationId1729133111652 } from '../../../enterprise/database/migrations/postgres/1729133111652-LinkOrganizationId'
packages/server/src/database/migrations/postgres/index.ts:65:import { AddSSOColumns1730519457880 } from '../../../enterprise/database/migrations/postgres/1730519457880-AddSSOColumns'
packages/server/src/database/migrations/postgres/index.ts:66:import { AddPersonalWorkspace1734074497540 } from '../../../enterprise/database/migrations/postgres/1734074497540-AddPersonalWorkspace'
packages/server/src/database/migrations/postgres/index.ts:67:import { RefactorEnterpriseDatabase1737076223692 } from '../../../enterprise/database/migrations/postgres/1737076223692-RefactorEnterpriseDatabase'
packages/server/src/database/migrations/postgres/index.ts:68:import { ExecutionLinkWorkspaceId1746862866554 } from '../../../enterprise/database/migrations/postgres/1746862866554-ExecutionLinkWorkspaceId'
packages/server/src/database/migrations/postgres/1765360298674-AddApiKeyPermission.ts:2:import { Role } from '../../../enterprise/database/entities/role.entity'
packages/server/src/database/migrations/sqlite/index.ts:56:import { AddAuthTables1720230151482 } from '../../../enterprise/database/migrations/sqlite/1720230151482-AddAuthTables'
packages/server/src/database/migrations/sqlite/index.ts:57:import { AddWorkspace1720230151484 } from '../../../enterprise/database/migrations/sqlite/1720230151484-AddWorkspace'
packages/server/src/database/migrations/sqlite/index.ts:58:import { AddWorkspaceShared1726654922034 } from '../../../enterprise/database/migrations/sqlite/1726654922034-AddWorkspaceShared'
packages/server/src/database/migrations/sqlite/index.ts:59:import { AddWorkspaceIdToCustomTemplate1726655750383 } from '../../../enterprise/database/migrations/sqlite/1726655750383-AddWorkspaceIdToCustomTemplate'
packages/server/src/database/migrations/sqlite/index.ts:60:import { AddOrganization1727798417345 } from '../../../enterprise/database/migrations/sqlite/1727798417345-AddOrganization'
packages/server/src/database/migrations/sqlite/index.ts:61:import { LinkWorkspaceId1729130948686 } from '../../../enterprise/database/migrations/sqlite/1729130948686-LinkWorkspaceId'
packages/server/src/database/migrations/sqlite/index.ts:62:import { LinkOrganizationId1729133111652 } from '../../../enterprise/database/migrations/sqlite/1729133111652-LinkOrganizationId'
packages/server/src/database/migrations/sqlite/index.ts:63:import { AddSSOColumns1730519457880 } from '../../../enterprise/database/migrations/sqlite/1730519457880-AddSSOColumns'
packages/server/src/database/migrations/sqlite/index.ts:64:import { AddPersonalWorkspace1734074497540 } from '../../../enterprise/database/migrations/sqlite/1734074497540-AddPersonalWorkspace'
packages/server/src/database/migrations/sqlite/index.ts:65:import { RefactorEnterpriseDatabase1737076223692 } from '../../../enterprise/database/migrations/sqlite/1737076223692-RefactorEnterpriseDatabase'
packages/server/src/database/migrations/sqlite/index.ts:66:import { ExecutionLinkWorkspaceId1746862866554 } from '../../../enterprise/database/migrations/sqlite/1746862866554-ExecutionLinkWorkspaceId'
packages/server/src/database/migrations/sqlite/1765360298674-AddApiKeyPermission.ts:2:import { Role } from '../../../enterprise/database/entities/role.entity'
packages/server/src/database/migrations/mariadb/index.ts:59:import { AddAuthTables1720230151482 } from '../../../enterprise/database/migrations/mariadb/1720230151482-AddAuthTables'
packages/server/src/database/migrations/mariadb/index.ts:60:import { AddWorkspace1725437498242 } from '../../../enterprise/database/migrations/mariadb/1725437498242-AddWorkspace'
packages/server/src/database/migrations/mariadb/index.ts:61:import { AddWorkspaceShared1726654922034 } from '../../../enterprise/database/migrations/mariadb/1726654922034-AddWorkspaceShared'
packages/server/src/database/migrations/mariadb/index.ts:62:import { AddWorkspaceIdToCustomTemplate1726655750383 } from '../../../enterprise/database/migrations/mariadb/1726655750383-AddWorkspaceIdToCustomTemplate'
packages/server/src/database/migrations/mariadb/index.ts:63:import { AddOrganization1727798417345 } from '../../../enterprise/database/migrations/mariadb/1727798417345-AddOrganization'
packages/server/src/database/migrations/mariadb/index.ts:64:import { LinkWorkspaceId1729130948686 } from '../../../enterprise/database/migrations/mariadb/1729130948686-LinkWorkspaceId'
packages/server/src/database/migrations/mariadb/index.ts:65:import { LinkOrganizationId1729133111652 } from '../../../enterprise/database/migrations/mariadb/1729133111652-LinkOrganizationId'
packages/server/src/database/migrations/mariadb/index.ts:66:import { AddSSOColumns1730519457880 } from '../../../enterprise/database/migrations/mariadb/1730519457880-AddSSOColumns'
packages/server/src/database/migrations/mariadb/index.ts:67:import { AddPersonalWorkspace1734074497540 } from '../../../enterprise/database/migrations/mariadb/1734074497540-AddPersonalWorkspace'
packages/server/src/database/migrations/mariadb/index.ts:68:import { RefactorEnterpriseDatabase1737076223692 } from '../../../enterprise/database/migrations/mariadb/1737076223692-RefactorEnterpriseDatabase'
packages/server/src/database/migrations/mariadb/index.ts:69:import { ExecutionLinkWorkspaceId1746862866554 } from '../../../enterprise/database/migrations/mariadb/1746862866554-ExecutionLinkWorkspaceId'
packages/server/src/database/migrations/mariadb/1765360298674-AddApiKeyPermission.ts:2:import { Role } from '../../../enterprise/database/entities/role.entity'
```

The four `AddApiKeyPermission` entries are P0-known touch points per T0.5 ruling, not clean-room events.

## Dist Residue Baseline

Commands:

```bash
find packages/server/dist -path "*enterprise*" -print
find packages/server/dist -name "IdentityManager.js*" -print
```

Current dist target counts after the worktree build:

-   `packages/server/dist/enterprise/**`: 364 paths.
-   `packages/server/dist/IdentityManager.js*`: 2 paths.

Top-level `dist/enterprise` inventory:

```text
packages/server/dist/enterprise
packages/server/dist/enterprise/controllers
packages/server/dist/enterprise/database
packages/server/dist/enterprise/emails
packages/server/dist/enterprise/middleware
packages/server/dist/enterprise/rbac
packages/server/dist/enterprise/routes
packages/server/dist/enterprise/services
packages/server/dist/enterprise/sso
packages/server/dist/enterprise/utils
```

IdentityManager dist targets:

```text
packages/server/dist/IdentityManager.js
packages/server/dist/IdentityManager.js.map
```

## Rule Recheck

Final T0 recheck:

| Gate                                       | Command summary                                                                                                      | Result                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| P0 enterprise 收口 grep                    | wrapper search for `from ...enterprise` / `from ...IdentityManager`, excluding iam, migrations, tests, docs/planning | 0                                                                |
| iam barrel import gate                     | wrapper search for `from '[^']*/iam'`, excluding tests/docs/planning                                                 | 0                                                                |
| self implementation enterprise import gate | wrapper search for `from '.*enterprise` filtered to `packages/server/src/iam/self/**`                                | 0                                                                |
| `& any` ban                                | wrapper search for `& any`, excluding docs/planning                                                                  | 0                                                                |
| server tsc                                 | `cd packages/server && npx tsc --noEmit --pretty false`                                                              | exit 0                                                           |
| enterprise diagnostic leak gate            | `awk '/src\\/enterprise\\// { c++ }' /tmp/flowops-p3-t0-tsc-final.log`                                               | 0                                                                |
| server jest                                | `cd packages/server && npx jest`                                                                                     | 65 suites passed, 1054 tests passed                              |
| worktree build before gates                | `pnpm build` from repo root, per 650605ac worktree rule                                                              | completed by arbitration before final gates; server dist present |
| server build before true-machine           | existing server dist from completed worktree build                                                                   | present; true-machine probes used the built server output        |

## True-Machine Startup Recheck

Scope: startup and read-only health only. No registration, migration script, or business-object write chain was executed.

Environment note: this worktree has no `.env`, so inline process env was used instead of editing `.env`.

| Track      | Startup command shape                                                    | Health probe                                 | Result                                                                                      |
| ---------- | ------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| self       | `DATABASE_TYPE=postgres ... FLOWOPS_IAM=self PORT=3000 pnpm start`       | `curl http://localhost:3000/api/v1/settings` | HTTP 200, `{"PLATFORM_TYPE":"enterprise","FLOWOPS_EDITION":"private","EDITION":"private"}`  |
| enterprise | `DATABASE_TYPE=postgres ... FLOWOPS_IAM=enterprise PORT=3000 pnpm start` | `curl http://localhost:3000/api/v1/settings` | HTTP 200, `{"PLATFORM_TYPE":"open source","FLOWOPS_EDITION":"private","EDITION":"private"}` |

Operational note: foreground startup was used for the probes and shut down cleanly after each track. Attempts to leave a detached self soak process from the Codex exec environment exited after logging `Flowise Server is listening at :3000`, so no long-running process is left by this T0 audit.
