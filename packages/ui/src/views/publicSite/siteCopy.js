export const siteCopy = {
    zh: {
        nav: {
            product: '产品能力',
            solutions: '解决方案',
            enterprise: '私有化',
            docs: '文档',
            help: '帮助',
            login: '登录',
            trial: '免费试用',
            menu: '菜单'
        },
        home: {
            hero: {
                eyebrow: '企业 AI Agent 工作流平台',
                title: '把大模型、知识库与工具编排成可治理的业务流程',
                subtitle:
                    'FlowOps 面向企业团队交付 AI Agent：可视化搭建工作流，统一接入国产模型、中文知识库、MCP 工具和执行追踪，让自动化从试验走向可运营。',
                primary: '免费开始',
                secondary: '查看文档',
                trust: '为私有化、合规和中文业务场景设计',
                mock: {
                    title: '客户服务 Agent 流程',
                    input: '业务问题',
                    model: '国产模型',
                    knowledge: '知识库检索',
                    tool: '系统工具',
                    output: '可追踪回复',
                    status: '运行中'
                },
                highlights: [
                    ['可视化', '拖拽节点组合 Agent 流程'],
                    ['可追踪', '记录每次执行与调试上下文'],
                    ['可治理', '权限、计费和内容安全同步纳入']
                ]
            },
            models: {
                eyebrow: '模型生态',
                title: '适配主流国产大模型，保留企业选择权',
                subtitle: '统一模型接入层支持团队按场景切换推理、嵌入与知识库能力。',
                items: ['通义千问', '豆包', 'Kimi', '智谱 GLM', 'MiniMax']
            },
            capabilities: {
                eyebrow: '核心能力',
                title: '从搭建到运营，覆盖 Agent 工作流全生命周期',
                subtitle: '每个能力都服务于企业团队真实交付：可复用、可观测、可治理。',
                items: [
                    ['可视化编排', '在同一张画布组合 LLM、条件分支、工具、记忆和人工节点。'],
                    ['国产模型接入', '按业务场景选择通义、豆包、Kimi、GLM、MiniMax 等模型能力。'],
                    ['中文知识库 RAG', '接入文档、FAQ 与业务资料，让回答基于可追溯上下文。'],
                    ['工具与 MCP', '把 API、数据库、MCP 服务和内部系统变成可调用工具。'],
                    ['多 Agent 协作', '用 AgentflowV2 编排规划、检索、执行、审核等多角色流程。'],
                    ['执行 Trace', '保留输入、节点结果、耗时和错误上下文，便于排障与复盘。'],
                    ['计费治理', '围绕 Token、Bot 和席位做额度、套餐与商业权益管理。'],
                    ['内容安全', '用合规护栏拦截敏感输入输出，降低上线风险。'],
                    ['私有化部署', '支持 Docker、PostgreSQL 与信创环境，数据留在企业域内。']
                ]
            },
            deepDive: {
                eyebrow: '特性深潜',
                title: '把复杂 AI 项目拆成团队能维护的工程资产',
                subtitle: 'FlowOps 不只生成一个聊天入口，而是把模型、数据、工具和治理放进同一条流程。',
                items: [
                    {
                        title: '可视化搭建，不写代码也能编排 AI 工作流',
                        body: '产品、运营和研发可以在画布上共同定义流程：从用户输入、知识检索、模型推理到工具执行，每一步都能拆开调试和复用。',
                        points: ['拖拽节点与条件分支', '多模型、多工具组合', '流程模板可沉淀复用'],
                        mockTitle: '工作流画布'
                    },
                    {
                        title: '企业级治理：权限、计费、追踪和内容安全',
                        body: '把 Agent 放进生产环境后，团队需要知道谁能用、用了多少、哪里出错、哪些内容需要拦截。FlowOps 将这些治理能力内置到运行链路。',
                        points: ['执行记录 Trace', 'Token/Bot/席位额度', '内容安全审核'],
                        mockTitle: '治理控制台'
                    },
                    {
                        title: '私有化与信创：数据不出域，离线也能部署',
                        body: '面向政企、金融、制造等数据敏感场景，FlowOps 支持在企业自有基础设施内交付，并兼容国产化软硬件环境。',
                        points: ['Docker 部署', 'PostgreSQL 数据库', '麒麟/统信/鲲鹏适配'],
                        mockTitle: '私有化拓扑'
                    }
                ]
            },
            solutions: {
                eyebrow: '解决方案',
                title: '优先服务高频、可复用的企业 AI 场景',
                subtitle: '从一个流程开始，逐步沉淀为可复制的行业模板和团队资产。',
                learnMore: '了解更多',
                items: [
                    ['电商智能客服', '把订单、售后、知识库和转人工串成可追踪的客服 Agent。'],
                    ['企业知识库问答', '围绕制度、产品资料和项目文档构建可溯源的内部问答助手。'],
                    ['办公自动化', '自动整理会议纪要、周报、表格分析和 PPT 初稿。'],
                    ['营销内容生产', '把品牌规范、素材库和审核节点纳入内容生成流程。']
                ]
            },
            metrics: {
                eyebrow: '平台数据',
                title: '用可核验口径展示能力边界',
                subtitle: '以下指标来自当前首页能力清单与平台能力口径，真实经营数据后续由运营后台补齐。',
                items: [
                    ['5', '国产模型家族', '首页列出的可接入模型生态'],
                    ['9', '核心能力模块', '覆盖搭建、知识库、工具、治理与部署'],
                    ['4', '治理维度', '权限、Trace、计费、内容安全'],
                    ['1', '私有化基线', 'Docker + PostgreSQL 作为交付起点']
                ]
            },
            enterprise: {
                eyebrow: '私有化与企业能力',
                title: '部署在企业自己的环境里，治理规则也由企业掌控',
                subtitle: '从本地 Docker 到信创环境，FlowOps 的交付重点是让数据、权限、凭证和审计都留在企业边界内。',
                items: [
                    ['Docker 快速部署', '本地、内网或专有云环境均可启动交付。'],
                    ['PostgreSQL 数据底座', '用企业熟悉的数据库承载账号、流程与执行记录。'],
                    ['信创环境适配', '面向麒麟、统信、鲲鹏等国产化基础设施做交付准备。'],
                    ['离线 airgap', '支持无公网环境下部署、升级与运维规划。'],
                    ['SSO 与权限', '将组织账号、工作区和角色纳入统一治理。'],
                    ['内容安全合规', '为输入输出审核、敏感信息处理保留扩展空间。']
                ],
                mock: {
                    title: '私有化部署链路',
                    nodes: ['企业用户', 'FlowOps 网关', '工作流引擎', '模型与知识库', '审计与计费']
                }
            },
            finalCta: {
                eyebrow: '开始落地',
                title: '先搭一个可运行、可追踪、可治理的 Agent 流程',
                subtitle: '从免费试用进入控制台，或先阅读文档了解模型、知识库、工具和私有化交付方式。',
                primary: '免费开始',
                secondary: '提交问题'
            },
            footer: {
                description: 'FlowOps 是面向企业私有化场景的 AI Agent 工作流平台，帮助团队把模型能力变成可运营的业务流程。',
                copyright: 'FlowOps · AI Agent 工作流管理平台',
                columns: [
                    {
                        title: '产品',
                        links: [
                            ['产品能力', '#capabilities'],
                            ['模型生态', '#models'],
                            ['私有化部署', '#enterprise']
                        ]
                    },
                    {
                        title: '解决方案',
                        links: [
                            ['智能客服', '#solutions'],
                            ['知识库问答', '#solutions'],
                            ['办公自动化', '#solutions']
                        ]
                    },
                    {
                        title: '资源',
                        links: [
                            ['文档', '/docs'],
                            ['帮助中心', '/help'],
                            ['更新日志', '/docs']
                        ]
                    },
                    {
                        title: '公司',
                        links: [
                            ['关于 FlowOps', '/docs'],
                            ['联系我们', '/help'],
                            ['服务支持', '/help']
                        ]
                    },
                    {
                        title: '法律',
                        links: [
                            ['隐私政策', '/help'],
                            ['用户协议', '/help']
                        ]
                    }
                ]
            }
        },
        docs: {
            badge: 'Documentation',
            title: '文档中心',
            subtitle: '这里放 FlowOps 的产品说明、上手指南、二开指南和运营手册，先用 MVP 结构把知识入口搭起来。',
            quickTitle: '快速开始',
            quickSteps: [
                ['登录控制台', '使用管理员分配的账号进入 FlowOps 控制台。'],
                ['配置凭证', '在凭证页添加模型、向量库和第三方服务 API Key。'],
                ['创建工作流', '在对话流或智能体流画布中组合模型、工具、知识库和输出节点。'],
                ['测试与发布', '用内置聊天窗口调试，再通过 API、嵌入组件或分享链接接入业务。'],
                ['观察与迭代', '查看执行记录、Token 用量、错误日志和用户反馈。']
            ],
            sectionsTitle: '文档分类',
            sections: [
                ['产品概览', '平台定位、核心模块、角色权限和适用场景。'],
                ['工作流搭建', '对话流、AgentflowV2、变量、凭证、工具节点和导出节点。'],
                ['知识库指南', '文档库、向量嵌入、检索参数、RAG 调优和数据更新。'],
                ['二开指南', '模板开发、节点开发、国际化、主题换皮、分支管理和验证门禁。'],
                ['运营手册', '套餐配置、额度覆盖、用量查看、超额处理和后台白名单。'],
                ['API 接入', 'Prediction API、SDK、鉴权、错误码和 402 计费拦截说明。']
            ],
            apiTitle: 'API 调用示例',
            apiText: '通过 Prediction API 可以把 FlowOps 工作流接入自己的应用、官网、内部系统或自动化脚本。',
            noteTitle: '当前文档阶段',
            note: '本次先搭结构和首屏内容，后续可以把每一类文档拆成可搜索的 Markdown/MDX 文档库，并接入版本号、更新记录和站内搜索。'
        },
        help: {
            badge: 'Help Center',
            title: '帮助中心',
            subtitle: '面向管理员、开发者和业务用户，集中回答登录、模型、知识库、工作流运行和计费额度相关问题。',
            searchHint: '常见问题先按主题整理，后续可接站内搜索和工单系统。',
            topics: [
                ['账号与权限', '无法登录、403、工作区权限、成员邀请和 SSO 配置。'],
                ['模型与凭证', '模型不可用、API Key 失效、国产模型节点和嵌入模型选择。'],
                ['工作流运行', '节点报错、变量解析、工具调用、执行记录和调试方法。'],
                ['知识库与文件', '文档上传、切片、向量化、检索不准和数据更新。'],
                ['计费与额度', 'Token、Bot、席位额度、套餐切换、超额提示和运营后台。'],
                ['二开与部署', '本地启动、构建失败、环境变量、分支计划和上线检查。']
            ],
            faqTitle: '常见问题',
            faq: [
                ['进入计费后台看到 403 怎么办？', '确认登录邮箱已加入 BILLING_ADMIN_EMAILS，并重启后端服务让环境变量生效。'],
                ['为什么运行工作流后没有 Token 用量？', 'Token 计量依赖模型节点返回 usageMetadata；未返回时平台不会强行估算。'],
                ['应用市场模板缺失怎么办？', '先确认当前分支是否包含对应模板提交，再检查 JSON 是否合法以及服务端是否重启。'],
                ['如何判断适合用对话流还是智能体流？', '固定步骤、可控输出优先对话流；需要多工具规划、条件判断和复杂协作时使用智能体流。']
            ],
            contactTitle: '提交问题前准备这些信息',
            contactItems: [
                '页面路径或工作流 ID',
                '报错截图和浏览器控制台日志',
                '后端日志时间点',
                '模型、凭证、节点和输入样例',
                '复现步骤和期望结果'
            ],
            ctaTitle: '后续会接入客服 / 工单系统',
            ctaSubtitle: '当前帮助中心先承担 FAQ 和排障入口，等计费中台稳定后再接入在线客服、工单流转和知识库搜索。'
        },
        footerLegacy: 'FlowOps · AI Agent 工作流管理平台'
    },
    en: {
        nav: {
            product: 'Capabilities',
            solutions: 'Solutions',
            enterprise: 'Private Cloud',
            docs: 'Docs',
            help: 'Help',
            login: 'Log In',
            trial: 'Free Trial',
            menu: 'Menu'
        },
        home: {
            hero: {
                eyebrow: 'Enterprise AI Agent Workflow Platform',
                title: 'Orchestrate models, knowledge and tools into governed business workflows',
                subtitle:
                    'FlowOps helps enterprise teams ship AI agents with a visual canvas, Chinese knowledge bases, MCP tools and execution tracing, turning automation from experiments into operations.',
                primary: 'Start Free',
                secondary: 'Read Docs',
                trust: 'Designed for private deployment, compliance and Chinese business scenarios',
                mock: {
                    title: 'Customer Service Agent Flow',
                    input: 'Business request',
                    model: 'Local model',
                    knowledge: 'Knowledge retrieval',
                    tool: 'System tool',
                    output: 'Traceable response',
                    status: 'Running'
                },
                highlights: [
                    ['Visual', 'Compose agent flows with nodes'],
                    ['Traceable', 'Keep every run and debug context'],
                    ['Governed', 'Bring access, billing and safety together']
                ]
            },
            models: {
                eyebrow: 'Model Ecosystem',
                title: 'Connect leading China-ready models without locking teams in',
                subtitle: 'A unified model layer lets teams switch reasoning, embedding and knowledge workflows by scenario.',
                items: ['Qwen', 'Doubao', 'Kimi', 'Zhipu GLM', 'MiniMax']
            },
            capabilities: {
                eyebrow: 'Core Capabilities',
                title: 'Cover the full lifecycle from building to operating agent workflows',
                subtitle: 'Every capability is built for enterprise delivery: reusable, observable and governable.',
                items: [
                    ['Visual Orchestration', 'Combine LLMs, branches, tools, memory and human steps on one canvas.'],
                    ['Domestic Model Access', 'Choose Qwen, Doubao, Kimi, GLM, MiniMax and other model capabilities by scenario.'],
                    ['Chinese Knowledge RAG', 'Connect documents, FAQs and business material to traceable retrieval context.'],
                    ['Tools and MCP', 'Turn APIs, databases, MCP services and internal systems into callable tools.'],
                    ['Multi-Agent Workflows', 'Use AgentflowV2 to orchestrate planning, retrieval, execution and review roles.'],
                    ['Execution Trace', 'Keep inputs, node outputs, latency and errors for debugging and review.'],
                    ['Billing Governance', 'Manage plans, quotas and commercial benefits across tokens, bots and seats.'],
                    ['Content Safety', 'Add compliance guardrails for sensitive inputs and outputs before launch.'],
                    ['Private Deployment', 'Support Docker, PostgreSQL and localized infrastructure with data in-domain.']
                ]
            },
            deepDive: {
                eyebrow: 'Feature Deep Dive',
                title: 'Turn complex AI projects into maintainable team assets',
                subtitle: 'FlowOps is more than a chat entry. It puts models, data, tools and governance in one execution path.',
                items: [
                    {
                        title: 'Build visually without writing code for every workflow',
                        body: 'Product, operations and engineering teams can define the process together: from user input and retrieval to model reasoning and tool execution, every step can be debugged and reused.',
                        points: ['Drag nodes and branches', 'Combine multiple models and tools', 'Reuse workflow templates'],
                        mockTitle: 'Workflow Canvas'
                    },
                    {
                        title: 'Enterprise governance for access, billing, tracing and safety',
                        body: 'Once agents move into production, teams need to know who can use them, how much they used, where failures happened and what content needs review.',
                        points: ['Execution traces', 'Token, bot and seat quotas', 'Content safety checks'],
                        mockTitle: 'Governance Console'
                    },
                    {
                        title: 'Private deployment and localized infrastructure readiness',
                        body: 'For government, finance and manufacturing scenarios, FlowOps can be delivered inside enterprise infrastructure and prepared for localized software and hardware environments.',
                        points: ['Docker deployment', 'PostgreSQL database', 'Kylin, UOS and Kunpeng readiness'],
                        mockTitle: 'Private Topology'
                    }
                ]
            },
            solutions: {
                eyebrow: 'Solutions',
                title: 'Start with frequent, reusable enterprise AI scenarios',
                subtitle: 'Begin with one workflow, then turn it into repeatable templates and team assets.',
                learnMore: 'Learn More',
                items: [
                    [
                        'E-commerce Support',
                        'Connect orders, after-sales, knowledge bases and human handoff into a traceable support agent.'
                    ],
                    ['Enterprise Q&A', 'Build source-grounded assistants around policies, product material and project documents.'],
                    ['Office Automation', 'Draft meeting notes, weekly reports, spreadsheet analysis and presentation outlines.'],
                    ['Marketing Content', 'Bring brand rules, asset libraries and review steps into content generation workflows.']
                ]
            },
            metrics: {
                eyebrow: 'Platform Signals',
                title: 'Show capability boundaries with verifiable numbers',
                subtitle:
                    'These metrics come from the current homepage capability list and platform scope. Operating data can be filled from the admin console later.',
                items: [
                    ['5', 'Model Families', 'Model ecosystem listed on this page'],
                    ['9', 'Capability Modules', 'Building, knowledge, tools, governance and deployment'],
                    ['4', 'Governance Dimensions', 'Access, trace, billing and content safety'],
                    ['1', 'Private Baseline', 'Docker + PostgreSQL as the delivery starting point']
                ]
            },
            enterprise: {
                eyebrow: 'Private Deployment',
                title: 'Run in your own environment with governance under your control',
                subtitle:
                    'From local Docker to localized infrastructure, FlowOps keeps data, access, credentials and audit trails inside the enterprise boundary.',
                items: [
                    ['Docker Fast Start', 'Deliver in local, intranet or dedicated cloud environments.'],
                    ['PostgreSQL Data Layer', 'Use a familiar database for accounts, flows and executions.'],
                    ['Localized Infrastructure', 'Prepare delivery for Kylin, UOS, Kunpeng and related environments.'],
                    ['Offline Airgap', 'Plan deployment, upgrades and operations without public internet.'],
                    ['SSO and Access', 'Bring organizations, workspaces and roles into unified governance.'],
                    ['Safety Compliance', 'Leave extension points for review, sensitive data handling and audit.']
                ],
                mock: {
                    title: 'Private Deployment Path',
                    nodes: ['Enterprise users', 'FlowOps gateway', 'Workflow engine', 'Models and knowledge', 'Audit and billing']
                }
            },
            finalCta: {
                eyebrow: 'Start Building',
                title: 'Create a runnable, traceable and governed agent workflow first',
                subtitle:
                    'Enter the console for a free start, or read the docs to understand models, knowledge bases, tools and private deployment.',
                primary: 'Start Free',
                secondary: 'Ask for Help'
            },
            footer: {
                description:
                    'FlowOps is an enterprise AI Agent workflow platform for private deployment scenarios, helping teams turn model capabilities into operational business flows.',
                copyright: 'FlowOps · AI Agent Workflow Management Platform',
                columns: [
                    {
                        title: 'Product',
                        links: [
                            ['Capabilities', '#capabilities'],
                            ['Model Ecosystem', '#models'],
                            ['Private Deployment', '#enterprise']
                        ]
                    },
                    {
                        title: 'Solutions',
                        links: [
                            ['Smart Support', '#solutions'],
                            ['Knowledge Q&A', '#solutions'],
                            ['Office Automation', '#solutions']
                        ]
                    },
                    {
                        title: 'Resources',
                        links: [
                            ['Docs', '/docs'],
                            ['Help Center', '/help'],
                            ['Changelog', '/docs']
                        ]
                    },
                    {
                        title: 'Company',
                        links: [
                            ['About FlowOps', '/docs'],
                            ['Contact', '/help'],
                            ['Support', '/help']
                        ]
                    },
                    {
                        title: 'Legal',
                        links: [
                            ['Privacy', '/help'],
                            ['Terms', '/help']
                        ]
                    }
                ]
            }
        },
        docs: {
            badge: 'Documentation',
            title: 'Documentation',
            subtitle: 'A first knowledge entry for product guides, onboarding, customization and operations.',
            quickTitle: 'Quick Start',
            quickSteps: [
                ['Log in', 'Use an administrator-provided account to enter the FlowOps console.'],
                ['Configure credentials', 'Add model, vector database and third-party API keys.'],
                ['Create a workflow', 'Combine models, tools, knowledge bases and export nodes on the canvas.'],
                ['Test and publish', 'Debug with built-in chat, then expose through API, embed or share link.'],
                ['Observe and iterate', 'Check executions, token usage, errors and user feedback.']
            ],
            sectionsTitle: 'Documentation sections',
            sections: [
                ['Product overview', 'Positioning, modules, roles and scenarios.'],
                ['Workflow building', 'Chatflows, AgentflowV2, variables, credentials, tools and export nodes.'],
                ['Knowledge base', 'Doc stores, embeddings, retrieval parameters, RAG tuning and updates.'],
                ['Customization', 'Templates, nodes, i18n, theming, branch plans and verification gates.'],
                ['Operations', 'Plans, overrides, usage, overage handling and billing admin allowlist.'],
                ['API integration', 'Prediction API, SDK, auth, error codes and 402 billing errors.']
            ],
            apiTitle: 'API example',
            apiText: 'Prediction API connects FlowOps workflows to apps, websites, internal systems and automation scripts.',
            noteTitle: 'Current docs stage',
            note: 'This release creates the information architecture and first content. Later each category can become searchable Markdown/MDX docs with versions and changelogs.'
        },
        help: {
            badge: 'Help Center',
            title: 'Help Center',
            subtitle:
                'Answers for administrators, developers and business users across login, models, knowledge bases, workflow runs and billing quotas.',
            searchHint: 'FAQ is grouped by topic first; search and ticketing can come later.',
            topics: [
                ['Accounts and permissions', 'Login issues, 403, workspace access, invites and SSO.'],
                ['Models and credentials', 'Unavailable models, expired API keys, model nodes and embeddings.'],
                ['Workflow runs', 'Node errors, variables, tool calls, executions and debugging.'],
                ['Knowledge and files', 'Uploads, chunks, vectorization, retrieval quality and updates.'],
                ['Billing and quotas', 'Tokens, bots, seats, plan changes, overage prompts and admin console.'],
                ['Customization and deployment', 'Local startup, builds, env vars, branch plans and release checks.']
            ],
            faqTitle: 'FAQ',
            faq: [
                [
                    'Why do I see 403 on billing admin?',
                    'Add the current email to BILLING_ADMIN_EMAILS and restart the server so env vars apply.'
                ],
                [
                    'Why is token usage empty after a run?',
                    'Token metering depends on model usageMetadata. FlowOps does not estimate usage when metadata is missing.'
                ],
                [
                    'What if a marketplace template is missing?',
                    'Confirm the current branch contains the template commit, JSON is valid and the server restarted.'
                ],
                [
                    'When should I use chatflows vs agentflows?',
                    'Use chatflows for fixed, controlled steps. Use agentflows for multi-tool planning, branching and complex collaboration.'
                ]
            ],
            contactTitle: 'Prepare these details before reporting',
            contactItems: [
                'Page path or workflow ID',
                'Screenshot and browser console logs',
                'Backend log timestamp',
                'Model, credential, node and sample input',
                'Steps to reproduce and expected result'
            ],
            ctaTitle: 'Support and tickets come next',
            ctaSubtitle:
                'The help center now handles FAQ and troubleshooting. Online support, ticket routing and knowledge search can follow after billing stabilizes.'
        },
        footerLegacy: 'FlowOps · AI Agent Workflow Management Platform'
    }
}
