import { ChatFlow } from './ChatFlow'
import { ChatMessage } from './ChatMessage'
import { ChatMessageFeedback } from './ChatMessageFeedback'
import { Credential } from './Credential'
import { Tool } from './Tool'
import { Assistant } from './Assistant'
import { Variable } from './Variable'
import { DocumentStore } from './DocumentStore'
import { DocumentStoreFileChunk } from './DocumentStoreFileChunk'
import { Lead } from './Lead'
import { UpsertHistory } from './UpsertHistory'
import { Dataset } from './Dataset'
import { DatasetRow } from './DatasetRow'
import { EvaluationRun } from './EvaluationRun'
import { Evaluation } from './Evaluation'
import { Evaluator } from './Evaluator'
import { ApiKey } from './ApiKey'
import { CustomTemplate } from './CustomTemplate'
import { Execution } from './Execution'
import { CustomMcpServer } from './CustomMcpServer'
import { BillingPlan } from './BillingPlan'
import { BillingSubscription } from './BillingSubscription'
import { BillingUsage } from './BillingUsage'
import { PaymentOrder } from './PaymentOrder'
import { PaymentNotificationLog } from './PaymentNotificationLog'
import { SupportTicket } from './SupportTicket'
import { Entitlement } from './Entitlement'
import { EntitlementUsage } from './EntitlementUsage'
import {
    FlowOpsLoginActivity,
    FlowOpsOrganization,
    FlowOpsRole,
    FlowOpsUser,
    FlowOpsWorkspace,
    FlowOpsWorkspaceMember
} from '../../iam/self/entities'
import { isSelfIamMode } from '../../iam/provider'
import { ScheduleRecord } from './ScheduleRecord'
import { ScheduleTriggerLog } from './ScheduleTriggerLog'

const legacyIamEntities = isSelfIamMode()
    ? {}
    : (() => {
          // P3 惰化:self 轨不加载 enterprise。
          const { LoginActivity, WorkspaceShared, WorkspaceUsers } = require('../../enterprise/database/entities/EnterpriseEntities')
          const { LoginMethod } = require('../../enterprise/database/entities/login-method.entity')
          const { LoginSession } = require('../../enterprise/database/entities/login-session.entity')
          const { Organization } = require('../../enterprise/database/entities/organization.entity')
          const { OrganizationUser } = require('../../enterprise/database/entities/organization-user.entity')
          const { Role } = require('../../enterprise/database/entities/role.entity')
          const { User } = require('../../enterprise/database/entities/user.entity')
          const { Workspace } = require('../../enterprise/database/entities/workspace.entity')
          const { WorkspaceUser } = require('../../enterprise/database/entities/workspace-user.entity')
          return {
              LoginActivity,
              LoginMethod,
              LoginSession,
              Organization,
              OrganizationUser,
              Role,
              User,
              Workspace,
              WorkspaceShared,
              WorkspaceUser,
              WorkspaceUsers
          }
      })()

export const entities = {
    ChatFlow,
    ChatMessage,
    ChatMessageFeedback,
    Credential,
    Tool,
    Assistant,
    Variable,
    UpsertHistory,
    DocumentStore,
    DocumentStoreFileChunk,
    Lead,
    Dataset,
    DatasetRow,
    Evaluation,
    EvaluationRun,
    Evaluator,
    ApiKey,
    CustomTemplate,
    Execution,
    CustomMcpServer,
    BillingPlan,
    BillingSubscription,
    BillingUsage,
    PaymentOrder,
    PaymentNotificationLog,
    SupportTicket,
    Entitlement,
    EntitlementUsage,
    FlowOpsUser,
    FlowOpsOrganization,
    FlowOpsWorkspace,
    FlowOpsWorkspaceMember,
    FlowOpsRole,
    FlowOpsLoginActivity,
    ...legacyIamEntities,
    ScheduleRecord,
    ScheduleTriggerLog
}
