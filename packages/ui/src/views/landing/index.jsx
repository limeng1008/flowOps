import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material'
import gsap from 'gsap'
import {
    IconArrowRight,
    IconBooks,
    IconDatabase,
    IconMessageChatbot,
    IconPlugConnected,
    IconShieldCheck,
    IconSitemap,
    IconWorld
} from '@tabler/icons-react'

import { SUPPORTED_LANGUAGES } from '@/i18n'
import FlowOpsLogo from '@/assets/images/flowops_white.svg'
import AgentGraphImage from '@/assets/images/agentgraph.png'
import ChatHistoryImage from '@/assets/images/chathistory.png'
import SharingImage from '@/assets/images/sharing.png'
import RobotImage from '@/assets/images/robot.png'

const C = {
    bg: '#eef7ff',
    bg2: '#f1fff9',
    surface: 'rgba(255, 255, 255, 0.58)',
    surface2: 'rgba(255, 255, 255, 0.38)',
    surfaceStrong: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(255, 255, 255, 0.58)',
    teal: '#14b8a6',
    tealDeep: '#14b8a6',
    blue: '#097cff',
    amber: '#f4cf4a',
    text: '#102033',
    muted: 'rgba(16, 32, 51, 0.68)',
    quiet: 'rgba(16, 32, 51, 0.52)',
    ink: '#0f172a',
    glassBlur: 'blur(22px) saturate(1.45)',
    shadow: '0 22px 60px rgba(15, 23, 42, 0.14)'
}

const parseStatValue = (value) => {
    const match = String(value).match(/^(\d+)(.*)$/)
    return {
        number: Number(match?.[1] || 0),
        suffix: match?.[2] || '',
        fallback: value
    }
}

const copy = {
    zh: {
        navCases: '应用案例',
        navPlaybook: '交付路径',
        navLogin: '进入控制台',
        badge: 'FlowOps for AI Agent Workflows',
        title: 'FlowOps',
        subtitle: 'AI Agent 工作流管理平台：可视化编排大模型、知识库、工具和业务系统，让团队更快交付稳定、可追踪、可复用的 AI 自动化。',
        primaryCta: '进入控制台',
        secondaryCta: '查看案例',
        heroStats: [
            ['10x', '从想法到 Agent 原型更快'],
            ['100+', '模型、工具、知识库节点可组合'],
            ['1 张', '画布管理完整工作流']
        ],
        casesTitle: 'AI Agent 工作流应用案例',
        casesLabel: 'Agent 案例',
        casesSubtitle: '从知识库问答、业务系统调用到多 Agent 协作，用案例说明 FlowOps 如何把能力编排成稳定、可追踪的工作流。',
        cases: [
            {
                image: AgentGraphImage,
                tag: 'Agent 编排',
                title: '从单轮问答升级到可执行的 Agent 流程',
                quote: '在同一张画布里组合 LLM、工具、条件分支和记忆，把复杂任务拆成可维护的执行步骤。',
                metric: '10x',
                metricLabel: '原型验证速度提升'
            },
            {
                image: ChatHistoryImage,
                tag: '知识库与 RAG',
                title: '让回答基于企业知识，而不是只靠模型记忆',
                quote: '把文档、规则和 FAQ 接入检索链路，为 Agent 提供可追溯的上下文与来源依据。',
                metric: '1 处',
                metricLabel: '集中管理知识入口'
            },
            {
                image: SharingImage,
                tag: '系统集成',
                title: '把内部 API 和数据库变成 Agent 可调用的工具',
                quote: '把已有业务系统封装成 Tool 节点，Agent 可以读取、判断和执行，而工作流仍然可观测可治理。',
                metric: '0 改造',
                metricLabel: '尽量保留原有系统'
            }
        ],
        playbookTitle: '第一层换皮后，继续强化 Agent 工作流能力',
        playbook: [
            ['换品牌', 'Logo、登录页、主题色、产品名先统一。'],
            ['搭案例', '欢迎页用案例故事表达平台价值。'],
            ['接工具', 'API、数据库、文件系统逐步沉淀为 Tool 节点。'],
            ['做治理', '执行记录、权限、日志和评估持续完善。']
        ],
        capabilities: [
            ['Agent 工作流', '可视化设计多步骤、多工具、多条件分支的智能体流程。'],
            ['知识库 RAG', '把企业文档、规则、FAQ 接入检索增强生成。'],
            ['工具与集成', '把 API、数据库和内部系统包装成 Agent 可调用能力。']
        ],
        ctaTitle: '先完成换皮，再持续打磨 AI Agent 工作流管理体验。',
        ctaSubtitle: 'FlowOps 第一版保持通用平台定位：让团队用可视化方式创建 Agent、连接知识与工具、管理执行与迭代。'
    },
    en: {
        navCases: 'Use Cases',
        navPlaybook: 'Playbook',
        navLogin: 'Console',
        badge: 'FlowOps for AI Agent Workflows',
        title: 'FlowOps',
        subtitle:
            'An AI Agent workflow management platform for visually orchestrating models, knowledge, tools and business systems into stable, traceable automation.',
        primaryCta: 'Open Console',
        secondaryCta: 'View Cases',
        heroStats: [
            ['10x', 'Faster from idea to agent prototype'],
            ['100+', 'Composable model, tool and RAG nodes'],
            ['1 canvas', 'Manage the full workflow']
        ],
        casesTitle: 'AI Agent workflow use cases',
        casesLabel: 'Use Cases',
        casesSubtitle:
            'From RAG to tool calling and multi-agent collaboration, these stories show how FlowOps turns capabilities into stable, traceable workflows.',
        cases: [
            {
                image: AgentGraphImage,
                tag: 'Agent orchestration',
                title: 'Move from chat prompts to executable agent workflows',
                quote: 'Combine LLMs, tools, branches and memory on one canvas so complex tasks become maintainable execution steps.',
                metric: '10x',
                metricLabel: 'Faster prototype validation'
            },
            {
                image: ChatHistoryImage,
                tag: 'Knowledge and RAG',
                title: 'Ground answers in enterprise knowledge',
                quote: 'Connect documents, policies and FAQs to retrieval so agents can respond with traceable context instead of memory alone.',
                metric: '1 hub',
                metricLabel: 'Centralized knowledge entry'
            },
            {
                image: SharingImage,
                tag: 'System integration',
                title: 'Expose internal APIs and databases as agent tools',
                quote: 'Wrap existing systems as tool nodes so agents can read, reason and act while the workflow remains observable.',
                metric: '0 rewrite',
                metricLabel: 'Keep existing systems'
            }
        ],
        playbookTitle: 'After the skin, strengthen the workflow platform',
        playbook: [
            ['Brand', 'Unify logo, login, color system and product name.'],
            ['Story', 'Use the welcome page to communicate platform value.'],
            ['Tools', 'Turn APIs, databases and file systems into reusable tool nodes.'],
            ['Govern', 'Improve executions, permissions, logs and evaluations.']
        ],
        capabilities: [
            ['Agent Workflows', 'Design multi-step, multi-tool and conditional agent processes visually.'],
            ['Knowledge RAG', 'Connect enterprise docs, rules and FAQs to retrieval-augmented generation.'],
            ['Tools and Integrations', 'Expose APIs, databases and internal systems as callable agent capabilities.']
        ],
        ctaTitle: 'Finish the skin, then refine the AI Agent workflow experience.',
        ctaSubtitle:
            'The first version of FlowOps stays platform-first: help teams create agents, connect knowledge and tools, then manage execution and iteration.'
    }
}

const LandingPage = () => {
    const pageRef = useRef(null)
    const navigate = useNavigate()
    const { i18n } = useTranslation()
    const [currentLang, setCurrentLang] = useState(i18n.resolvedLanguage || i18n.language)
    const isZh = currentLang === 'zh' || currentLang?.startsWith('zh-')
    const t = useMemo(() => (isZh ? copy.zh : copy.en), [isZh])

    const goLogin = () => navigate('/signin')
    const scrollToCases = () => document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' })

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
        let cleanupHover = []
        let cleanupObservers = []
        const ctx = gsap.context(() => {
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

            if (reduceMotion) {
                gsap.set('.landing-nav, .landing-hero-item, .landing-stat-card, .landing-reveal', { clearProps: 'all' })
                return
            }

            const countStats = () => {
                gsap.utils.toArray('.landing-stat-value').forEach((item, index) => {
                    const target = Number(item.dataset.target || 0)
                    const suffix = item.dataset.suffix || ''
                    const counter = { value: 0 }

                    if (!target || target <= 1) {
                        item.textContent = item.dataset.fallback || item.textContent
                        return
                    }

                    gsap.to(counter, {
                        value: target,
                        duration: 0.52,
                        delay: index * 0.04,
                        ease: 'power2.out',
                        onUpdate: () => {
                            item.textContent = `${Math.round(counter.value)}${suffix}`
                        },
                        onComplete: () => {
                            item.textContent = `${target}${suffix}`
                        }
                    })
                })
            }

            gsap.timeline({ defaults: { ease: 'power3.out' } })
                .fromTo('.landing-nav', { y: -12, autoAlpha: 0.92 }, { y: 0, autoAlpha: 1, duration: 0.28 })
                .fromTo('.landing-hero-item', { y: 14, autoAlpha: 0.72 }, { y: 0, autoAlpha: 1, duration: 0.34, stagger: 0.04 }, 0.04)
                .fromTo(
                    '.landing-stat-card',
                    { y: 10, scale: 0.99, autoAlpha: 0.72 },
                    { y: 0, scale: 1, autoAlpha: 1, duration: 0.3, stagger: 0.05, ease: 'back.out(1.2)' },
                    '-=0.08'
                )
                .add(countStats, '-=0.06')

            gsap.to('.landing-grid-layer', {
                backgroundPosition: '56px 56px',
                duration: 22,
                ease: 'none',
                repeat: -1
            })

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return

                        gsap.to(entry.target, {
                            y: 0,
                            scale: 1,
                            autoAlpha: 1,
                            duration: 0.58,
                            ease: 'power3.out'
                        })
                        observer.unobserve(entry.target)
                    })
                },
                { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }
            )

            gsap.utils.toArray('.landing-reveal').forEach((item) => {
                gsap.set(item, { y: 24, scale: 0.985, autoAlpha: 0 })
                observer.observe(item)
            })
            cleanupObservers = [() => observer.disconnect()]

            cleanupHover = gsap.utils.toArray('.landing-hover-lift').map((item) => {
                const onEnter = () =>
                    gsap.to(item, {
                        y: -4,
                        scale: 1.01,
                        boxShadow: '0 22px 70px rgba(15, 23, 42, 0.28)',
                        duration: 0.22,
                        ease: 'power2.out'
                    })
                const onLeave = () =>
                    gsap.to(item, {
                        y: 0,
                        scale: 1,
                        boxShadow: '0 0 0 rgba(15, 23, 42, 0)',
                        duration: 0.26,
                        ease: 'power2.out'
                    })
                item.addEventListener('mouseenter', onEnter)
                item.addEventListener('mouseleave', onLeave)
                item.addEventListener('focusin', onEnter)
                item.addEventListener('focusout', onLeave)
                return () => {
                    item.removeEventListener('mouseenter', onEnter)
                    item.removeEventListener('mouseleave', onLeave)
                    item.removeEventListener('focusin', onEnter)
                    item.removeEventListener('focusout', onLeave)
                }
            })
        }, pageRef)

        return () => {
            cleanupHover.forEach((cleanup) => cleanup())
            cleanupObservers.forEach((cleanup) => cleanup())
            ctx.revert()
        }
    }, [])

    return (
        <Box
            ref={pageRef}
            sx={{
                minHeight: '100vh',
                color: C.text,
                backgroundColor: C.bg,
                backgroundImage:
                    'radial-gradient(900px 520px at 12% 8%, rgba(9,124,255,0.20), transparent 58%), radial-gradient(820px 500px at 88% 16%, rgba(20,184,166,0.18), transparent 56%), linear-gradient(135deg, #eef7ff, #f8fbff 46%, #f1fff9)'
            }}
        >
            <Box
                className='landing-nav'
                component='nav'
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    px: { xs: 2.5, md: 8 },
                    py: 2,
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: C.surfaceStrong,
                    boxShadow: C.shadow,
                    backdropFilter: C.glassBlur,
                    WebkitBackdropFilter: C.glassBlur
                }}
            >
                <Box component='img' src={FlowOpsLogo} alt='FlowOps' sx={{ width: { xs: 136, md: 158 }, height: 'auto' }} />
                <Stack direction='row' spacing={{ xs: 1, md: 2 }} sx={{ alignItems: 'center' }}>
                    <Button
                        onClick={scrollToCases}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: C.muted, textTransform: 'none' }}
                    >
                        {t.navCases}
                    </Button>
                    <Button
                        onClick={() => document.getElementById('playbook')?.scrollIntoView({ behavior: 'smooth' })}
                        sx={{ display: { xs: 'none', md: 'inline-flex' }, color: C.muted, textTransform: 'none' }}
                    >
                        {t.navPlaybook}
                    </Button>
                    <Stack
                        direction='row'
                        spacing={0.5}
                        sx={{
                            p: 0.5,
                            border: `1px solid ${C.border}`,
                            borderRadius: '999px',
                            backgroundColor: C.surface,
                            backdropFilter: C.glassBlur,
                            WebkitBackdropFilter: C.glassBlur
                        }}
                    >
                        {SUPPORTED_LANGUAGES.map((lng) => {
                            const active = currentLang === lng.code || currentLang?.startsWith(`${lng.code}-`)
                            return (
                                <Button
                                    key={lng.code}
                                    size='small'
                                    onClick={() => handleChangeLanguage(lng.code)}
                                    sx={{
                                        minWidth: 'auto',
                                        px: 1.2,
                                        py: 0.35,
                                        borderRadius: '999px',
                                        textTransform: 'none',
                                        color: active ? '#ecfeff' : C.muted,
                                        backgroundColor: active ? C.tealDeep : 'transparent',
                                        '&:hover': { backgroundColor: active ? C.tealDeep : C.surfaceStrong }
                                    }}
                                >
                                    {lng.label}
                                </Button>
                            )
                        })}
                    </Stack>
                    <Button
                        onClick={goLogin}
                        variant='contained'
                        sx={{ borderRadius: '999px', textTransform: 'none', backgroundColor: C.tealDeep, color: '#ecfeff' }}
                    >
                        {t.navLogin}
                    </Button>
                </Stack>
            </Box>

            <Box
                component='section'
                sx={{
                    position: 'relative',
                    minHeight: { xs: 'auto', md: '72vh' },
                    display: 'flex',
                    alignItems: 'center',
                    px: { xs: 2.5, md: 8 },
                    py: { xs: 9, md: 12 },
                    overflow: 'hidden',
                    backgroundImage:
                        'linear-gradient(135deg, rgba(255,255,255,0.42), rgba(255,255,255,0.10)), radial-gradient(720px 380px at 18% 10%, rgba(9,124,255,0.20), transparent 64%), radial-gradient(720px 380px at 82% 14%, rgba(20,184,166,0.16), transparent 64%)'
                }}
            >
                <Box
                    className='landing-grid-layer'
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.22,
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.42) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.36) 1px, transparent 1px)',
                        backgroundSize: '56px 56px'
                    }}
                />
                <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
                    <Chip
                        className='landing-hero-item'
                        icon={<IconWorld size={16} />}
                        label={t.badge}
                        sx={{ mb: 3, color: C.tealDeep, borderColor: C.border, backgroundColor: C.surface }}
                        variant='outlined'
                    />
                    <Typography
                        className='landing-hero-item'
                        component='h1'
                        sx={{ fontSize: { xs: '3.2rem', md: '5rem' }, lineHeight: 1, fontWeight: 950, letterSpacing: 0 }}
                    >
                        {t.title}
                    </Typography>
                    <Typography
                        className='landing-hero-item'
                        sx={{ color: C.muted, fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.75, mt: 3, maxWidth: 760, mx: 'auto' }}
                    >
                        {t.subtitle}
                    </Typography>
                    <Stack
                        className='landing-hero-item'
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        sx={{ alignItems: 'center', justifyContent: 'center', mt: 4 }}
                    >
                        <Button
                            className='landing-hover-lift'
                            onClick={goLogin}
                            endIcon={<IconArrowRight size={18} />}
                            sx={{
                                minWidth: 160,
                                borderRadius: '999px',
                                textTransform: 'none',
                                fontWeight: 800,
                                color: '#ecfeff',
                                backgroundColor: C.teal,
                                '&:hover': { backgroundColor: C.tealDeep, color: '#ecfeff' }
                            }}
                        >
                            {t.primaryCta}
                        </Button>
                        <Button
                            className='landing-hover-lift'
                            onClick={scrollToCases}
                            sx={{
                                minWidth: 160,
                                borderRadius: '999px',
                                textTransform: 'none',
                                color: C.text,
                                border: `1px solid ${C.border}`,
                                backgroundColor: C.surface,
                                backdropFilter: C.glassBlur,
                                WebkitBackdropFilter: C.glassBlur
                            }}
                        >
                            {t.secondaryCta}
                        </Button>
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mt: 7 }}>
                        {t.heroStats.map(([value, label]) => (
                            <Box
                                className='landing-stat-card landing-hover-lift'
                                key={label}
                                sx={{
                                    p: 2.5,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: '8px',
                                    backgroundColor: C.surface,
                                    boxShadow: C.shadow,
                                    backdropFilter: C.glassBlur,
                                    WebkitBackdropFilter: C.glassBlur
                                }}
                            >
                                <Typography
                                    className='landing-stat-value'
                                    data-target={parseStatValue(value).number}
                                    data-suffix={parseStatValue(value).suffix}
                                    data-fallback={parseStatValue(value).fallback}
                                    sx={{ color: C.teal, fontSize: '1.65rem', fontWeight: 900 }}
                                >
                                    {value}
                                </Typography>
                                <Typography sx={{ color: C.quiet, mt: 0.5 }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            <Box
                id='case-studies'
                component='section'
                sx={{ px: { xs: 2.5, md: 8 }, py: { xs: 8, md: 11 }, backgroundColor: 'transparent' }}
            >
                <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={3}
                        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' }, mb: 4 }}
                    >
                        <Box sx={{ maxWidth: 700 }}>
                            <Typography
                                className='landing-reveal'
                                component='h2'
                                sx={{ fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.08, fontWeight: 900 }}
                            >
                                {t.casesTitle}
                            </Typography>
                            <Typography className='landing-reveal' sx={{ color: C.muted, mt: 2, lineHeight: 1.75 }}>
                                {t.casesSubtitle}
                            </Typography>
                        </Box>
                        <Chip
                            className='landing-reveal'
                            label={t.casesLabel}
                            sx={{ alignSelf: { xs: 'flex-start', md: 'auto' }, color: C.ink, backgroundColor: C.amber, fontWeight: 800 }}
                        />
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                        {t.cases.map((item) => (
                            <Box
                                className='landing-reveal landing-hover-lift'
                                key={item.title}
                                sx={{
                                    border: `1px solid ${C.border}`,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    backgroundColor: C.surface,
                                    boxShadow: C.shadow,
                                    backdropFilter: C.glassBlur,
                                    WebkitBackdropFilter: C.glassBlur
                                }}
                            >
                                <Box
                                    sx={{
                                        height: 210,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: C.surface2,
                                        backdropFilter: C.glassBlur,
                                        WebkitBackdropFilter: C.glassBlur
                                    }}
                                >
                                    <Box
                                        component='img'
                                        src={item.image}
                                        alt={item.title}
                                        sx={{ width: 132, height: 132, objectFit: 'contain' }}
                                    />
                                </Box>
                                <Box sx={{ p: 2.5 }}>
                                    <Typography sx={{ color: C.teal, fontWeight: 800, fontSize: '0.8rem' }}>{item.tag}</Typography>
                                    <Typography
                                        component='h3'
                                        sx={{ color: C.text, fontSize: '1.25rem', lineHeight: 1.25, fontWeight: 900, mt: 1 }}
                                    >
                                        {item.title}
                                    </Typography>
                                    <Typography sx={{ color: C.muted, lineHeight: 1.7, mt: 2 }}>{item.quote}</Typography>
                                    <Divider sx={{ borderColor: C.border, my: 2.5 }} />
                                    <Stack direction='row' spacing={1.5} sx={{ alignItems: 'baseline' }}>
                                        <Typography sx={{ color: C.teal, fontSize: '1.7rem', fontWeight: 950 }}>{item.metric}</Typography>
                                        <Typography sx={{ color: C.quiet, fontSize: '0.86rem' }}>{item.metricLabel}</Typography>
                                    </Stack>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            <Box
                id='playbook'
                component='section'
                sx={{ px: { xs: 2.5, md: 8 }, py: { xs: 8, md: 11 }, backgroundColor: 'rgba(255,255,255,0.28)', color: C.ink }}
            >
                <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
                    <Typography
                        className='landing-reveal'
                        component='h2'
                        sx={{ maxWidth: 760, fontSize: { xs: '2rem', md: '2.8rem' }, lineHeight: 1.1, fontWeight: 950 }}
                    >
                        {t.playbookTitle}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mt: 4 }}>
                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                            {t.playbook.map(([title, desc], index) => (
                                <Box
                                    className='landing-reveal landing-hover-lift'
                                    key={title}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '44px 1fr',
                                        gap: 1.5,
                                        p: 2,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: '8px',
                                        backgroundColor: C.surface,
                                        boxShadow: C.shadow,
                                        backdropFilter: C.glassBlur,
                                        WebkitBackdropFilter: C.glassBlur
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: C.ink,
                                            backgroundColor:
                                                index === 0 ? '#ccfbf1' : index === 1 ? '#dbeafe' : index === 2 ? '#fef3c7' : '#e2e8f0',
                                            fontWeight: 950
                                        }}
                                    >
                                        {index + 1}
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                                        <Typography sx={{ color: '#475569', mt: 0.5 }}>{desc}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                        <Box
                            className='landing-reveal landing-hover-lift'
                            sx={{
                                borderRadius: '8px',
                                border: `1px solid ${C.border}`,
                                backgroundColor: C.surface,
                                boxShadow: C.shadow,
                                backdropFilter: C.glassBlur,
                                WebkitBackdropFilter: C.glassBlur,
                                p: 3
                            }}
                        >
                            <Box
                                component='img'
                                src={RobotImage}
                                alt='FlowOps agent'
                                sx={{ width: 96, height: 96, objectFit: 'contain', mb: 2 }}
                            />
                            <Box sx={{ display: 'grid', gap: 1.5 }}>
                                {[
                                    [<IconSitemap key='workflow' size={20} />, ...t.capabilities[0]],
                                    [<IconDatabase key='database' size={20} />, ...t.capabilities[1]],
                                    [<IconMessageChatbot key='chat' size={20} />, ...t.capabilities[2]]
                                ].map(([icon, title, desc]) => (
                                    <Box
                                        key={title}
                                        sx={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 1.25, alignItems: 'start' }}
                                    >
                                        <Box sx={{ color: C.tealDeep, display: 'flex', pt: 0.25 }}>{icon}</Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                                            <Typography sx={{ color: '#475569', mt: 0.35 }}>{desc}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box component='section' sx={{ px: { xs: 2.5, md: 8 }, py: { xs: 8, md: 11 }, backgroundColor: C.bg2 }}>
                <Box sx={{ maxWidth: 980, mx: 'auto', textAlign: 'center' }}>
                    <Stack className='landing-reveal' direction='row' spacing={1} sx={{ justifyContent: 'center', color: C.teal, mb: 2 }}>
                        <IconBooks size={22} />
                        <IconPlugConnected size={22} />
                        <IconShieldCheck size={22} />
                    </Stack>
                    <Typography
                        className='landing-reveal'
                        component='h2'
                        sx={{ fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.1, fontWeight: 950 }}
                    >
                        {t.ctaTitle}
                    </Typography>
                    <Typography className='landing-reveal' sx={{ color: C.muted, lineHeight: 1.75, mt: 2.5, maxWidth: 760, mx: 'auto' }}>
                        {t.ctaSubtitle}
                    </Typography>
                    <Button
                        className='landing-reveal landing-hover-lift'
                        onClick={goLogin}
                        endIcon={<IconArrowRight size={18} />}
                        sx={{
                            mt: 4,
                            borderRadius: '999px',
                            textTransform: 'none',
                            color: C.ink,
                            fontWeight: 900,
                            backgroundColor: C.teal,
                            '&:hover': { backgroundColor: C.tealDeep, color: '#ecfeff' }
                        }}
                    >
                        {t.primaryCta}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default LandingPage
