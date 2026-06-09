import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Button, Chip, Link, Stack, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
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
    IconTerminal2
} from '@tabler/icons-react'

import { SUPPORTED_LANGUAGES } from '@/i18n'
import themes from '@/themes'
import BrandLogo from '@/ui-component/extended/BrandLogo'
import DocumentImage from '@/assets/images/doc_store_empty.svg'
import RobotImage from '@/assets/images/robot.png'
import { siteCopy } from './siteCopy'
import HomeNavBar from './sections/NavBar'
import Hero from './sections/Hero'
import ModelWall from './sections/ModelWall'
import CapabilityGrid from './sections/CapabilityGrid'
import FeatureDeepDive from './sections/FeatureDeepDive'
import Solutions from './sections/Solutions'
import Metrics from './sections/Metrics'
import Enterprise from './sections/Enterprise'
import FinalCTA from './sections/FinalCTA'
import HomeFooter from './sections/Footer'

gsap.registerPlugin(ScrollTrigger)

const C = {
    bg: '#07111f',
    bg2: '#0b1628',
    surface: '#101b2d',
    border: 'rgba(226, 232, 240, 0.14)',
    teal: '#5eead4',
    tealDeep: '#14b8a6',
    blue: '#60a5fa',
    amber: '#fbbf24',
    text: '#f8fafc',
    muted: '#cbd5e1',
    quiet: '#94a3b8',
    ink: '#0f172a'
}

const iconSet = [IconSitemap, IconDatabase, IconPlugConnected, IconShieldCheck, IconRoute, IconTerminal2]

const PublicSite = ({ page = 'home' }) => {
    const pageRef = useRef(null)
    const { i18n } = useTranslation()
    const [currentLang, setCurrentLang] = useState(i18n.resolvedLanguage || i18n.language)
    const isZh = currentLang === 'zh' || currentLang?.startsWith('zh-')
    const t = useMemo(() => (isZh ? siteCopy.zh : siteCopy.en), [isZh])
    const isHome = page === 'home'
    const customization = useSelector((state) => state.customization)
    const lightTheme = useMemo(() => themes({ ...customization, isDarkMode: false }), [customization])

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
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

            if (reduceMotion) {
                gsap.set('.public-reveal, .public-nav, .public-drift, .public-marquee-track', { clearProps: 'all' })
                return
            }

            gsap.fromTo('.public-nav', { y: -14, autoAlpha: 0.92 }, { y: 0, autoAlpha: 1, duration: 0.42, ease: 'power3.out' })

            ScrollTrigger.batch('.public-reveal', {
                start: 'top 84%',
                once: true,
                onEnter: (batch) => {
                    gsap.fromTo(
                        batch,
                        { y: 28, autoAlpha: 0, scale: 0.985 },
                        {
                            y: 0,
                            autoAlpha: 1,
                            scale: 1,
                            duration: 0.72,
                            stagger: 0.075,
                            ease: 'power3.out',
                            clearProps: 'transform,opacity,visibility'
                        }
                    )
                }
            })

            gsap.to('.public-drift', {
                y: -10,
                duration: 3.4,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.12
            })

            gsap.to('.public-marquee-track', {
                xPercent: -50,
                duration: 28,
                repeat: -1,
                ease: 'none'
            })

            ScrollTrigger.refresh()
        }, pageRef)

        return () => ctx.revert()
    }, [page])

    const navItems = [
        { label: t.nav.product, to: '/' },
        { label: t.nav.docs, to: '/docs' },
        { label: t.nav.help, to: '/help' }
    ]

    return (
        <Box
            ref={pageRef}
            sx={{
                minHeight: '100dvh',
                color: isHome ? C.ink : C.text,
                backgroundColor: isHome ? '#f7fbff' : C.bg,
                overflowX: 'hidden'
            }}
        >
            {isHome ? (
                <ThemeProvider theme={lightTheme}>
                    <HomePage t={t.home} nav={t.nav} currentLang={currentLang} handleChangeLanguage={handleChangeLanguage} />
                </ThemeProvider>
            ) : (
                <>
                    <PublicNav t={t} navItems={navItems} currentLang={currentLang} handleChangeLanguage={handleChangeLanguage} />
                    {page === 'docs' ? <DocsPage t={t.docs} /> : <HelpPage t={t.help} />}
                    <PublicFooter text={t.footerLegacy} nav={t.nav} />
                </>
            )}
        </Box>
    )
}

const HomePage = ({ t, nav, currentLang, handleChangeLanguage }) => (
    <>
        <HomeNavBar copy={nav} languages={SUPPORTED_LANGUAGES} currentLang={currentLang} handleChangeLanguage={handleChangeLanguage} />
        <Hero copy={t.hero} />
        <ModelWall copy={t.models} />
        <CapabilityGrid copy={t.capabilities} />
        <FeatureDeepDive copy={t.deepDive} heroMock={t.hero.mock} />
        <Solutions copy={t.solutions} />
        <Metrics copy={t.metrics} />
        <Enterprise copy={t.enterprise} />
        <FinalCTA copy={t.finalCta} />
        <HomeFooter copy={t.footer} languages={SUPPORTED_LANGUAGES} currentLang={currentLang} handleChangeLanguage={handleChangeLanguage} />
    </>
)

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
                {t.nav.login}
            </Button>
        </Stack>
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
        className='public-section'
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

const Band = ({ children, sx }) => (
    <Box component='section' className='public-section' sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 9 }, ...sx }}>
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
                    {nav.login}
                </Link>
            </Stack>
        </Stack>
    </Box>
)

PublicSite.propTypes = {
    page: PropTypes.oneOf(['home', 'docs', 'help'])
}

HomePage.propTypes = {
    t: PropTypes.object.isRequired,
    nav: PropTypes.object.isRequired,
    currentLang: PropTypes.string,
    handleChangeLanguage: PropTypes.func.isRequired
}

PublicNav.propTypes = {
    t: PropTypes.object.isRequired,
    navItems: PropTypes.array.isRequired,
    currentLang: PropTypes.string,
    handleChangeLanguage: PropTypes.func.isRequired
}

DocsPage.propTypes = { t: PropTypes.object.isRequired }
HelpPage.propTypes = { t: PropTypes.object.isRequired }
SubHero.propTypes = {
    badge: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired
}
Band.propTypes = { children: PropTypes.node.isRequired, sx: PropTypes.object }
InfoCard.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string }
IconBox.propTypes = { color: PropTypes.string.isRequired, children: PropTypes.node.isRequired }
PublicFooter.propTypes = { text: PropTypes.string.isRequired, nav: PropTypes.object.isRequired }

export default PublicSite
