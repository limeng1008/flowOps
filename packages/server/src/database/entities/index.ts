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
import { LoginActivity, WorkspaceShared, WorkspaceUsers } from '../../iam/entities'
import { User } from '../../iam/entities'
import { Organization } from '../../iam/entities'
import { Role } from '../../iam/entities'
import { OrganizationUser } from '../../iam/entities'
import { Workspace } from '../../iam/entities'
import { WorkspaceUser } from '../../iam/entities'
import { LoginMethod } from '../../iam/entities'
import { LoginSession } from '../../iam/entities'
import { ScheduleRecord } from './ScheduleRecord'
import { ScheduleTriggerLog } from './ScheduleTriggerLog'

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
    User,
    WorkspaceUsers,
    LoginActivity,
    WorkspaceShared,
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
    Organization,
    Role,
    OrganizationUser,
    Workspace,
    WorkspaceUser,
    LoginMethod,
    LoginSession,
    ScheduleRecord,
    ScheduleTriggerLog
}
