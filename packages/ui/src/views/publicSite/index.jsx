import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Button, Chip, Link, Stack, Typography } from '@mui/material'
import gsap from 'gsap'
import {
    IconArrowRight,
    IconBooks,
    IconBrandGithub,
    IconChartDots3,
    IconChecklist,
    IconClockBolt,
    IconDatabase,
    IconFileText,
    IconHelpCircle,
    IconKey,
    IconLifebuoy,
    IconPlugConnected,
    IconRoute,
    IconShieldCheck,
    IconSitemap,
    IconSparkles,
    IconTerminal2,
    IconWorld
} from '@tabler/icons-react'

import { SUPPORTED_LANGUAGES } from '@/i18n'
import BrandLogo from '@/ui-component/extended/BrandLogo'
import AgentImage from '@/assets/images/agentgraph.png'
import DocumentImage from '@/assets/images/doc_store_empty.svg'
import RobotImage from '@/assets/images/robot.png'

const C = {
    bg: '#07111f',
    bg2: '#0b1628',
    surface: '#101b2d',
    surface2: '#142033',
    border: 'rgba(226, 232, 240, 0.14)',
    teal: '#5eead4',
    tealDeep: '#14b8a6',
    blue: '#60a5fa',
    amber: '#fbbf24',
    rose: '#fb7185',
    text: '#f8fafc',
    muted: '#cbd5e1',
    quiet: '#94a3b8',
    ink: '#0f172a'
}

const copy = {
    zh: {
        nav: {
            product: '产品',
            docs: '文档',
            help: '帮助中心',
            console: '进入控制台'
        },
        home: {
            badge: 'AI Agent 工作流管理平台',
            title: '把 Agent、知识库与工具编排成可运营的工作流',
            subtitle:
                'FlowOps 面向团队二开与企业落地，提供可视化画布、模型节点、知识库、工具集成、执行记录和 Stripe 订阅治理，让 AI Agent 从 Demo 走向可管理的生产流程。',
            primary: '进入控制台',
            secondary: '阅读文档',
            metrics: [
                ['可视化', '拖拽编排 Agent 流程'],
                ['可追踪', '保留执行记录和调试上下文'],
                ['可运营', '接入套餐、用量和权限治理']
            ],
            capabilityTitle: '当前平台能力',
            capabilitySubtitle: '先把平台能力讲清楚，客户和内部团队才能知道 FlowOps 能做什么、做到什么程度。',
            capabilities: [
                ['Agent 工作流', '组合 LLM、条件分支、工具调用、记忆和人工节点，沉淀可复用流程。'],
                ['知识库与 RAG', '接入文档、FAQ 和业务资料，让回答基于可追溯上下文。'],
                ['工具与系统集成', '把 API、数据库和内部系统包装成 Agent 可调用能力。'],
                ['运营与治理', '通过执行记录、权限、变量、凭证和计费额度管理生产过程。']
            ],
            pathTitle: '从换皮到商业化的落地路径',
            path: [
                ['官网与说明', '先让用户知道产品定位、核心场景和上手路径。'],
                ['模板和节点', '沉淀报告、PPT、Excel、营销文案等业务智能体。'],
                ['Stripe 订阅', '用 Free、Starter、Pro 和 Enterprise 套餐管理 Predictions、Storage 与席位。'],
                ['服务闭环', '继续补客服工单、帮助文档和品牌 VI。']
            ],
            ctaTitle: '先把产品门面搭起来，再持续补齐商业闭环。',
            ctaSubtitle: '官网、文档和帮助中心会成为客户理解 FlowOps、团队培训和后续销售转化的入口。',
            ctaDocs: '查看文档',
            ctaHelp: '帮助中心'
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
                ['运营手册', 'Stripe 套餐、Prediction 用量、Storage 用量、席位增购和超额处理。'],
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
            subtitle: '面向管理员、开发者和业务用户，集中回答登录、模型、知识库、工作流运行和 Stripe 套餐额度相关问题。',
            searchHint: '常见问题先按主题整理，后续可接站内搜索和工单系统。',
            topics: [
                ['账号与权限', '无法登录、403、工作区权限、成员邀请和 SSO 配置。'],
                ['模型与凭证', '模型不可用、API Key 失效、国产模型节点和嵌入模型选择。'],
                ['工作流运行', '节点报错、变量解析、工具调用、执行记录和调试方法。'],
                ['知识库与文件', '文档上传、切片、向量化、检索不准和数据更新。'],
                ['计费与额度', 'Stripe 账单门户、Prediction、Storage、席位增购、套餐切换和超额提示。'],
                ['二开与部署', '本地启动、构建失败、环境变量、分支计划和上线检查。']
            ],
            faqTitle: '常见问题',
            faq: [
                ['账单入口打不开怎么办？', '确认已配置 Stripe 密钥、Customer Portal 和组织订阅信息，并使用组织管理员账号操作。'],
                [
                    '为什么 Prediction 用量没有增加？',
                    'Prediction 计量依赖运行成功后的订阅额度缓存；请检查组织 subscriptionId 和 Stripe 产品 quota 元数据。'
                ],
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
            ctaSubtitle: '当前帮助中心先承担 FAQ 和排障入口，后续可继续接入在线客服、工单流转和知识库搜索。'
        },
        footer: 'FlowOps · AI Agent 工作流管理平台'
    },
    en: {
        nav: {
            product: 'Product',
            docs: 'Docs',
            help: 'Help Center',
            console: 'Console'
        },
        home: {
            badge: 'AI Agent Workflow Management Platform',
            title: 'Orchestrate agents, knowledge and tools into operational workflows',
            subtitle:
                'FlowOps helps teams customize and ship enterprise AI workflows with a visual canvas, model nodes, knowledge bases, tool integrations, execution history and billing governance.',
            primary: 'Open Console',
            secondary: 'Read Docs',
            metrics: [
                ['Visual', 'Build agent workflows on canvas'],
                ['Traceable', 'Keep executions and debug context'],
                ['Operational', 'Manage plans, usage and access']
            ],
            capabilityTitle: 'Platform capabilities',
            capabilitySubtitle: 'Make the platform clear first so customers and internal teams know what FlowOps can do.',
            capabilities: [
                ['Agent Workflows', 'Combine LLMs, branches, tools, memory and human steps into reusable processes.'],
                ['Knowledge and RAG', 'Connect documents, FAQs and business material to traceable retrieval context.'],
                ['Tools and Integrations', 'Expose APIs, databases and internal systems as callable agent capabilities.'],
                [
                    'Operations and Governance',
                    'Manage production through executions, permissions, variables, credentials and Stripe subscription quotas.'
                ]
            ],
            pathTitle: 'From rebrand to commercialization',
            path: [
                ['Website and docs', 'Clarify positioning, scenarios and onboarding.'],
                ['Templates and nodes', 'Ship report, PPT, Excel and marketing copy agents.'],
                ['Stripe subscriptions', 'Manage Free, Starter, Pro and Enterprise plans with predictions, storage and seats.'],
                ['Service loop', 'Add support tickets, help docs and brand assets.']
            ],
            ctaTitle: 'Build the product front door, then complete the commercial loop.',
            ctaSubtitle:
                'The website, docs and help center become the entry point for customer education, team training and sales conversion.',
            ctaDocs: 'Docs',
            ctaHelp: 'Help Center'
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
                ['Operations', 'Stripe plans, prediction usage, storage usage, seat add-ons and overage handling.'],
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
                'Answers for administrators, developers and business users across login, models, knowledge bases, workflow runs and Stripe plan quotas.',
            searchHint: 'FAQ is grouped by topic first; search and ticketing can come later.',
            topics: [
                ['Accounts and permissions', 'Login issues, 403, workspace access, invites and SSO.'],
                ['Models and credentials', 'Unavailable models, expired API keys, model nodes and embeddings.'],
                ['Workflow runs', 'Node errors, variables, tool calls, executions and debugging.'],
                ['Knowledge and files', 'Uploads, chunks, vectorization, retrieval quality and updates.'],
                ['Billing and quotas', 'Stripe portal, predictions, storage, seat add-ons, plan changes and overage prompts.'],
                ['Customization and deployment', 'Local startup, builds, env vars, branch plans and release checks.']
            ],
            faqTitle: 'FAQ',
            faq: [
                [
                    'Why can’t I open billing?',
                    'Confirm Stripe keys, Customer Portal settings and organization subscription data, then use an organization admin account.'
                ],
                [
                    'Why did prediction usage not increase after a run?',
                    'Prediction metering depends on successful runs and cached Stripe quota data. Check the organization subscriptionId and Stripe product quota metadata.'
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
        footer: 'FlowOps · AI Agent Workflow Management Platform'
    }
}

const iconSet = [IconSitemap, IconDatabase, IconPlugConnected, IconShieldCheck, IconRoute, IconTerminal2]

const PublicSite = ({ page = 'home' }) => {
    const pageRef = useRef(null)
    const { i18n } = useTranslation()
    const [currentLang, setCurrentLang] = useState(i18n.resolvedLanguage || i18n.language)
    const isZh = currentLang === 'zh' || currentLang?.startsWith('zh-')
    const t = useMemo(() => (isZh ? copy.zh : copy.en), [isZh])

    const handleChangeLanguage = (lng) => {
        i18n.changeLanguage(lng)
        localStorage.setItem('language', lng)
        setCurrentLang(lng)
    }

    useEffect(() => {
        const onLanguageChanged = (lng) => setCurrentLang(lng)
        i18n.on('languageChanged', onLanguageChanged)
        return () => i18n.off('languageChanged', onLanguageChanged)
    }, [i18n])

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
            gsap.fromTo(
                '.public-reveal',
                { y: 18, autoAlpha: 0.74 },
                { y: 0, autoAlpha: 1, duration: 0.34, stagger: 0.045, ease: 'power3.out' }
            )
            gsap.to('.public-scene-drift', { y: -10, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        }, pageRef)
        return () => ctx.revert()
    }, [page])

    const navItems = [
        { label: t.nav.product, to: '/' },
        { label: t.nav.docs, to: '/docs' },
        { label: t.nav.help, to: '/help' }
    ]

    return (
        <Box ref={pageRef} sx={{ minHeight: '100dvh', color: C.text, backgroundColor: C.bg, overflowX: 'hidden' }}>
            <PublicNav t={t} navItems={navItems} currentLang={currentLang} handleChangeLanguage={handleChangeLanguage} />
            {page === 'docs' ? <DocsPage t={t.docs} /> : page === 'help' ? <HelpPage t={t.help} /> : <HomePage t={t.home} />}
            <PublicFooter text={t.footer} nav={t.nav} />
        </Box>
    )
}

const PublicNav = ({ t, navItems, currentLang, handleChangeLanguage }) => (
    <Box
        component='nav'
        sx={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: { xs: 1.5, sm: 2, md: 6 },
            py: 1.5,
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: 'rgba(7,17,31,0.9)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)'
        }}
    >
        <Box component={RouterLink} to='/' sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <BrandLogo tone='onDark' width={{ xs: 104, sm: 128, md: 150 }} />
        </Box>
        <Stack direction='row' spacing={{ xs: 0.25, md: 1.5 }} sx={{ minWidth: 0, alignItems: 'center' }}>
            {navItems.map((item) => (
                <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    sx={{
                        display: { xs: item.to === '/' ? 'none' : 'inline-flex', sm: 'inline-flex' },
                        px: { xs: 0.75, md: 1 },
                        minWidth: 'auto',
                        color: C.muted,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        whiteSpace: 'nowrap',
                        textTransform: 'none'
                    }}
                >
                    {item.label}
                </Button>
            ))}
            <Stack direction='row' spacing={0.5} sx={{ p: 0.5, border: `1px solid ${C.border}`, borderRadius: '999px' }}>
                {SUPPORTED_LANGUAGES.map((lng) => {
                    const active = currentLang === lng.code || currentLang?.startsWith(`${lng.code}-`)
                    return (
                        <Button
                            key={lng.code}
                            size='small'
                            onClick={() => handleChangeLanguage(lng.code)}
                            sx={{
                                minWidth: { xs: 36, sm: 56 },
                                px: { xs: 0.75, sm: 1 },
                                py: 0.35,
                                borderRadius: '999px',
                                textTransform: 'none',
                                color: active ? C.ink : C.muted,
                                backgroundColor: active ? C.teal : 'transparent',
                                '&:hover': { backgroundColor: active ? C.teal : 'rgba(255,255,255,0.08)' }
                            }}
                        >
                            <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                {lng.label}
                            </Box>
                            <Box component='span' sx={{ display: { xs: 'inline', sm: 'none' } }}>
                                {lng.code === 'zh' ? '中' : 'En'}
                            </Box>
                        </Button>
                    )
                })}
            </Stack>
            <Button
                component={RouterLink}
                to='/signin'
                variant='contained'
                sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    borderRadius: '8px',
                    textTransform: 'none',
                    color: C.ink,
                    backgroundColor: C.teal,
                    fontWeight: 800
                }}
            >
                {t.nav.console}
            </Button>
        </Stack>
    </Box>
)

const HomePage = ({ t }) => (
    <>
        <HeroSection t={t} />
        <Band sx={{ backgroundColor: C.bg }}>
            <SectionIntro title={t.capabilityTitle} subtitle={t.capabilitySubtitle} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mt: 4 }}>
                {t.capabilities.map(([title, desc], index) => {
                    const Icon = iconSet[index] || IconSparkles
                    return (
                        <InfoCard key={title} className='public-reveal'>
                            <IconBox color={index === 1 ? C.blue : index === 2 ? C.amber : C.teal}>
                                <Icon size={22} />
                            </IconBox>
                            <Typography component='h3' sx={{ fontWeight: 900, mt: 2, fontSize: '1.08rem' }}>
                                {title}
                            </Typography>
                            <Typography sx={{ color: C.muted, lineHeight: 1.7, mt: 1 }}>{desc}</Typography>
                        </InfoCard>
                    )
                })}
            </Box>
        </Band>
        <Band sx={{ backgroundColor: '#f8fafc', color: C.ink }}>
            <Typography
                className='public-reveal'
                component='h2'
                sx={{ fontWeight: 950, fontSize: { xs: '2rem', md: '2.75rem' }, maxWidth: 760 }}
            >
                {t.pathTitle}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mt: 4 }}>
                {t.path.map(([title, desc], index) => (
                    <Box
                        className='public-reveal'
                        key={title}
                        sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}
                    >
                        <Typography sx={{ color: C.tealDeep, fontWeight: 950, fontSize: '1.4rem' }}>
                            {String(index + 1).padStart(2, '0')}
                        </Typography>
                        <Typography component='h3' sx={{ fontWeight: 900, mt: 2 }}>
                            {title}
                        </Typography>
                        <Typography sx={{ color: '#475569', lineHeight: 1.7, mt: 1 }}>{desc}</Typography>
                    </Box>
                ))}
            </Box>
        </Band>
        <CtaBand title={t.ctaTitle} subtitle={t.ctaSubtitle} docsLabel={t.ctaDocs} helpLabel={t.ctaHelp} />
    </>
)

const HeroSection = ({ t }) => (
    <Box
        component='section'
        sx={{
            position: 'relative',
            minHeight: { xs: 'auto', md: '82dvh' },
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            px: { xs: 2, md: 6 },
            py: { xs: 8, md: 11 },
            backgroundColor: C.bg2
        }}
    >
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
                backgroundSize: '56px 56px',
                opacity: 0.32
            }}
        />
        <Box
            component='img'
            src={AgentImage}
            alt=''
            aria-hidden='true'
            className='public-scene-drift'
            sx={{
                position: 'absolute',
                right: { xs: '-120px', md: '4%' },
                top: { xs: 88, md: 80 },
                width: { xs: 360, md: 560 },
                opacity: { xs: 0.18, md: 0.34 },
                filter: 'drop-shadow(0 30px 80px rgba(20,184,166,0.22))'
            }}
        />
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(7,17,31,0.98) 0%, rgba(7,17,31,0.88) 42%, rgba(7,17,31,0.54) 100%)'
            }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1180, width: '100%', mx: 'auto' }}>
            <Box sx={{ maxWidth: 790 }}>
                <Chip
                    className='public-reveal'
                    icon={<IconWorld size={16} />}
                    label={t.badge}
                    variant='outlined'
                    sx={{ color: C.teal, borderColor: 'rgba(94,234,212,0.45)', backgroundColor: 'rgba(7,17,31,0.55)' }}
                />
                <Typography
                    className='public-reveal'
                    component='h1'
                    sx={{ mt: 3, fontSize: { xs: '2.8rem', md: '4.9rem' }, lineHeight: 1, fontWeight: 950 }}
                >
                    {t.title}
                </Typography>
                <Typography
                    className='public-reveal'
                    sx={{ color: C.muted, fontSize: { xs: '1rem', md: '1.17rem' }, lineHeight: 1.75, mt: 3 }}
                >
                    {t.subtitle}
                </Typography>
                <Stack className='public-reveal' direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                    <Button
                        component={RouterLink}
                        to='/signin'
                        endIcon={<IconArrowRight size={18} />}
                        sx={{ borderRadius: '8px', color: C.ink, backgroundColor: C.teal, textTransform: 'none', fontWeight: 900, px: 2.5 }}
                    >
                        {t.primary}
                    </Button>
                    <Button
                        component={RouterLink}
                        to='/docs'
                        sx={{ borderRadius: '8px', color: C.text, border: `1px solid ${C.border}`, textTransform: 'none', px: 2.5 }}
                    >
                        {t.secondary}
                    </Button>
                </Stack>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mt: 7 }}>
                {t.metrics.map(([value, label]) => (
                    <Box
                        className='public-reveal'
                        key={value}
                        sx={{ p: 2.5, borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: 'rgba(16,27,45,0.74)' }}
                    >
                        <Typography sx={{ color: C.teal, fontWeight: 950, fontSize: '1.35rem' }}>{value}</Typography>
                        <Typography sx={{ color: C.quiet, mt: 0.75 }}>{label}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    </Box>
)

const DocsPage = ({ t }) => (
    <>
        <SubHero badge={t.badge} title={t.title} subtitle={t.subtitle} image={DocumentImage} />
        <Band sx={{ backgroundColor: C.bg }}>
            <Typography className='public-reveal' component='h2' sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 950 }}>
                {t.quickTitle}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, mt: 3 }}>
                {t.quickSteps.map(([title, desc], index) => (
                    <InfoCard key={title} className='public-reveal'>
                        <Typography sx={{ color: C.teal, fontWeight: 950 }}>{index + 1}</Typography>
                        <Typography component='h3' sx={{ fontWeight: 900, mt: 1.5 }}>
                            {title}
                        </Typography>
                        <Typography sx={{ color: C.muted, lineHeight: 1.65, mt: 1 }}>{desc}</Typography>
                    </InfoCard>
                ))}
            </Box>
        </Band>
        <Band sx={{ backgroundColor: '#f8fafc', color: C.ink }}>
            <Typography className='public-reveal' component='h2' sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 950 }}>
                {t.sectionsTitle}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 3 }}>
                {t.sections.map(([title, desc], index) => {
                    const Icon = iconSet[index] || IconFileText
                    return (
                        <Box
                            className='public-reveal'
                            key={title}
                            sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}
                        >
                            <Box sx={{ color: C.tealDeep, display: 'flex' }}>
                                <Icon size={24} />
                            </Box>
                            <Typography component='h3' sx={{ fontWeight: 900, mt: 2 }}>
                                {title}
                            </Typography>
                            <Typography sx={{ color: '#475569', lineHeight: 1.7, mt: 1 }}>{desc}</Typography>
                        </Box>
                    )
                })}
            </Box>
        </Band>
        <Band sx={{ backgroundColor: C.bg2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' }, gap: 3, alignItems: 'start' }}>
                <Box className='public-reveal'>
                    <Typography component='h2' sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 950 }}>
                        {t.apiTitle}
                    </Typography>
                    <Typography sx={{ color: C.muted, lineHeight: 1.75, mt: 2 }}>{t.apiText}</Typography>
                    <Box sx={{ mt: 3, p: 2.5, borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.surface }}>
                        <Typography sx={{ color: C.teal, fontWeight: 900 }}>{t.noteTitle}</Typography>
                        <Typography sx={{ color: C.muted, lineHeight: 1.7, mt: 1 }}>{t.note}</Typography>
                    </Box>
                </Box>
                <Box
                    className='public-reveal'
                    component='pre'
                    sx={{
                        m: 0,
                        p: 2.5,
                        borderRadius: '8px',
                        border: `1px solid ${C.border}`,
                        backgroundColor: '#020617',
                        color: '#bfdbfe',
                        overflowX: 'auto',
                        fontSize: '0.88rem',
                        lineHeight: 1.7
                    }}
                >
                    {`curl -X POST http://localhost:3000/api/v1/prediction/<FLOW_ID> \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <API_KEY>" \\
  -d '{
    "question": "生成一份本周项目进展摘要",
    "overrideConfig": {
      "vars": {
        "department": "产品研发"
      }
    }
  }'`}
                </Box>
            </Box>
        </Band>
    </>
)

const HelpPage = ({ t }) => (
    <>
        <SubHero badge={t.badge} title={t.title} subtitle={t.subtitle} image={RobotImage} />
        <Band sx={{ backgroundColor: C.bg }}>
            <Box
                className='public-reveal'
                sx={{ p: 2.5, border: `1px solid ${C.border}`, borderRadius: '8px', backgroundColor: C.surface, mb: 3 }}
            >
                <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
                    <IconHelpCircle color={C.teal} />
                    <Typography sx={{ color: C.muted }}>{t.searchHint}</Typography>
                </Stack>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {t.topics.map(([title, desc], index) => {
                    const Icon = [IconKey, IconDatabase, IconClockBolt, IconFileText, IconChartDots3, IconTerminal2][index] || IconLifebuoy
                    return (
                        <InfoCard key={title} className='public-reveal'>
                            <IconBox color={index === 4 ? C.amber : C.teal}>
                                <Icon size={22} />
                            </IconBox>
                            <Typography component='h3' sx={{ fontWeight: 900, mt: 2 }}>
                                {title}
                            </Typography>
                            <Typography sx={{ color: C.muted, lineHeight: 1.7, mt: 1 }}>{desc}</Typography>
                        </InfoCard>
                    )
                })}
            </Box>
        </Band>
        <Band sx={{ backgroundColor: '#f8fafc', color: C.ink }}>
            <Typography className='public-reveal' component='h2' sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 950 }}>
                {t.faqTitle}
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5, mt: 3 }}>
                {t.faq.map(([question, answer]) => (
                    <Box
                        className='public-reveal'
                        key={question}
                        sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}
                    >
                        <Typography component='h3' sx={{ fontWeight: 900 }}>
                            {question}
                        </Typography>
                        <Typography sx={{ color: '#475569', lineHeight: 1.7, mt: 1 }}>{answer}</Typography>
                    </Box>
                ))}
            </Box>
        </Band>
        <Band sx={{ backgroundColor: C.bg2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'center' }}>
                <Box className='public-reveal'>
                    <Typography component='h2' sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontWeight: 950 }}>
                        {t.contactTitle}
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.2, mt: 3 }}>
                        {t.contactItems.map((item) => (
                            <Stack key={item} direction='row' spacing={1.2} sx={{ alignItems: 'center', color: C.muted }}>
                                <IconChecklist size={20} color={C.teal} />
                                <Typography>{item}</Typography>
                            </Stack>
                        ))}
                    </Box>
                </Box>
                <Box
                    className='public-reveal'
                    sx={{ p: 3, border: `1px solid ${C.border}`, borderRadius: '8px', backgroundColor: C.surface }}
                >
                    <IconLifebuoy size={32} color={C.teal} />
                    <Typography component='h2' sx={{ fontWeight: 950, fontSize: '1.55rem', mt: 2 }}>
                        {t.ctaTitle}
                    </Typography>
                    <Typography sx={{ color: C.muted, lineHeight: 1.75, mt: 1.5 }}>{t.ctaSubtitle}</Typography>
                </Box>
            </Box>
        </Band>
    </>
)

const SubHero = ({ badge, title, subtitle, image }) => (
    <Box
        component='section'
        sx={{ position: 'relative', overflow: 'hidden', px: { xs: 2, md: 6 }, py: { xs: 8, md: 10 }, backgroundColor: C.bg2 }}
    >
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
                backgroundSize: '52px 52px',
                opacity: 0.24
            }}
        />
        <Box
            component='img'
            src={image}
            alt=''
            aria-hidden='true'
            sx={{ position: 'absolute', right: { xs: -60, md: '8%' }, top: 40, width: { xs: 210, md: 320 }, opacity: 0.18 }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1180, mx: 'auto' }}>
            <Chip className='public-reveal' label={badge} sx={{ color: C.ink, backgroundColor: C.teal, fontWeight: 800 }} />
            <Typography
                className='public-reveal'
                component='h1'
                sx={{ mt: 3, maxWidth: 780, fontSize: { xs: '2.5rem', md: '4rem' }, lineHeight: 1.05, fontWeight: 950 }}
            >
                {title}
            </Typography>
            <Typography
                className='public-reveal'
                sx={{ color: C.muted, maxWidth: 760, lineHeight: 1.75, fontSize: { xs: '1rem', md: '1.12rem' }, mt: 2.5 }}
            >
                {subtitle}
            </Typography>
        </Box>
    </Box>
)

const SectionIntro = ({ title, subtitle }) => (
    <Box sx={{ maxWidth: 760 }}>
        <Typography
            className='public-reveal'
            component='h2'
            sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, lineHeight: 1.1, fontWeight: 950 }}
        >
            {title}
        </Typography>
        <Typography className='public-reveal' sx={{ color: C.muted, lineHeight: 1.75, mt: 2 }}>
            {subtitle}
        </Typography>
    </Box>
)

const Band = ({ children, sx }) => (
    <Box component='section' sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 9 }, ...sx }}>
        <Box sx={{ maxWidth: 1180, mx: 'auto' }}>{children}</Box>
    </Box>
)

const InfoCard = ({ children, className }) => (
    <Box
        className={className}
        sx={{ p: 2.5, borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.surface, minHeight: 188 }}
    >
        {children}
    </Box>
)

const IconBox = ({ color, children }) => (
    <Box
        sx={{
            width: 44,
            height: 44,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            backgroundColor: 'rgba(255,255,255,0.06)'
        }}
    >
        {children}
    </Box>
)

const CtaBand = ({ title, subtitle, docsLabel, helpLabel }) => (
    <Band sx={{ backgroundColor: C.bg2, textAlign: 'center' }}>
        <Box className='public-reveal' sx={{ maxWidth: 820, mx: 'auto' }}>
            <Stack direction='row' spacing={1} sx={{ justifyContent: 'center', color: C.teal, mb: 2 }}>
                <IconBooks size={22} />
                <IconBrandGithub size={22} />
                <IconShieldCheck size={22} />
            </Stack>
            <Typography component='h2' sx={{ fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.1, fontWeight: 950 }}>
                {title}
            </Typography>
            <Typography sx={{ color: C.muted, lineHeight: 1.75, mt: 2 }}>{subtitle}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', mt: 4 }}>
                <Button
                    component={RouterLink}
                    to='/docs'
                    sx={{ borderRadius: '8px', color: C.ink, backgroundColor: C.teal, textTransform: 'none', fontWeight: 900 }}
                >
                    {docsLabel}
                </Button>
                <Button
                    component={RouterLink}
                    to='/help'
                    sx={{ borderRadius: '8px', color: C.text, border: `1px solid ${C.border}`, textTransform: 'none' }}
                >
                    {helpLabel}
                </Button>
            </Stack>
        </Box>
    </Band>
)

const PublicFooter = ({ text, nav }) => (
    <Box component='footer' sx={{ px: { xs: 2, md: 6 }, py: 4, borderTop: `1px solid ${C.border}`, backgroundColor: '#050b14' }}>
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ maxWidth: 1180, mx: 'auto', alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
            <Typography sx={{ color: C.quiet }}>{text}</Typography>
            <Stack direction='row' spacing={2}>
                <Link component={RouterLink} to='/docs' underline='hover' sx={{ color: C.muted }}>
                    {nav.docs}
                </Link>
                <Link component={RouterLink} to='/help' underline='hover' sx={{ color: C.muted }}>
                    {nav.help}
                </Link>
                <Link component={RouterLink} to='/signin' underline='hover' sx={{ color: C.muted }}>
                    {nav.console}
                </Link>
            </Stack>
        </Stack>
    </Box>
)

PublicSite.propTypes = {
    page: PropTypes.oneOf(['home', 'docs', 'help'])
}

PublicNav.propTypes = {
    t: PropTypes.object.isRequired,
    navItems: PropTypes.array.isRequired,
    currentLang: PropTypes.string,
    handleChangeLanguage: PropTypes.func.isRequired
}

HomePage.propTypes = { t: PropTypes.object.isRequired }
HeroSection.propTypes = { t: PropTypes.object.isRequired }
DocsPage.propTypes = { t: PropTypes.object.isRequired }
HelpPage.propTypes = { t: PropTypes.object.isRequired }
SubHero.propTypes = {
    badge: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired
}
SectionIntro.propTypes = { title: PropTypes.string.isRequired, subtitle: PropTypes.string.isRequired }
Band.propTypes = { children: PropTypes.node.isRequired, sx: PropTypes.object }
InfoCard.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string }
IconBox.propTypes = { color: PropTypes.string.isRequired, children: PropTypes.node.isRequired }
CtaBand.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    docsLabel: PropTypes.string.isRequired,
    helpLabel: PropTypes.string.isRequired
}
PublicFooter.propTypes = { text: PropTypes.string.isRequired, nav: PropTypes.object.isRequired }

export default PublicSite
