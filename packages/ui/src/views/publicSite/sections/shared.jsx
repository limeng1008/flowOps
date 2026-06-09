import PropTypes from 'prop-types'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { getLiquidGlassControlSx, getLiquidGlassPanelSx } from '@/ui-component/utils/liquidGlassStyles'

export const SITE_COLORS = {
    ink: '#0f172a',
    text: '#172033',
    muted: 'rgba(15, 23, 42, 0.68)',
    quiet: 'rgba(15, 23, 42, 0.52)',
    white: '#ffffff',
    dark: '#08111f',
    line: 'rgba(15, 23, 42, 0.1)',
    cyan: '#00c7be',
    amber: '#f59e0b',
    violet: '#7c3aed'
}

export const getLinkProps = (href) => (href?.startsWith('#') ? { component: 'a', href } : { component: RouterLink, to: href || '/' })

export const sectionBackground = (theme, variant = 'light') => {
    if (variant === 'blue') {
        return {
            backgroundColor: '#eaf5ff',
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.32)), linear-gradient(120deg, ${theme.palette.glass.accentSoft}, rgba(0,199,190,0.12))`
        }
    }

    if (variant === 'dark') {
        return {
            color: '#f8fbff',
            backgroundColor: SITE_COLORS.dark,
            backgroundImage:
                'linear-gradient(135deg, rgba(8,17,31,0.98), rgba(15,23,42,0.94)), linear-gradient(90deg, rgba(10,132,255,0.16), rgba(0,199,190,0.12))'
        }
    }

    return {
        backgroundColor: '#f7fbff',
        backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.86), rgba(247,251,255,0.92)), linear-gradient(90deg, rgba(10,132,255,0.08), rgba(0,199,190,0.08))'
    }
}

export const SectionShell = ({ id, children, variant = 'light', sx = {} }) => {
    const theme = useTheme()

    return (
        <Box
            id={id}
            component='section'
            className='public-section'
            sx={{
                position: 'relative',
                overflow: 'hidden',
                px: { xs: 2, sm: 3, md: 6 },
                py: { xs: 7, md: 10 },
                scrollMarginTop: { xs: 86, md: 96 },
                ...sectionBackground(theme, variant),
                ...sx
            }}
        >
            <Box
                aria-hidden='true'
                sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: variant === 'dark' ? 0.18 : 0.34,
                    backgroundImage:
                        'linear-gradient(rgba(15,23,42,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)',
                    backgroundSize: { xs: '36px 36px', md: '56px 56px' },
                    maskImage: 'linear-gradient(180deg, transparent, #000 14%, #000 84%, transparent)'
                }}
            />
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1200, mx: 'auto' }}>{children}</Box>
        </Box>
    )
}

export const SectionHeading = ({ eyebrow, title, subtitle, align = 'left', color = SITE_COLORS.text, muted = SITE_COLORS.muted }) => (
    <Box className='public-reveal' sx={{ maxWidth: align === 'center' ? 820 : 760, mx: align === 'center' ? 'auto' : 0, textAlign: align }}>
        <Typography
            component='p'
            sx={{
                color: SITE_COLORS.cyan,
                fontSize: '0.82rem',
                fontWeight: 900,
                letterSpacing: 0,
                textTransform: 'uppercase'
            }}
        >
            {eyebrow}
        </Typography>
        <Typography
            component='h2'
            sx={{
                mt: 1.2,
                color,
                fontSize: { xs: '2rem', sm: '2.35rem', md: '3.1rem' },
                lineHeight: 1.08,
                fontWeight: 950,
                letterSpacing: 0
            }}
        >
            {title}
        </Typography>
        {subtitle ? (
            <Typography sx={{ mt: 2, color: muted, fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.78 }}>{subtitle}</Typography>
        ) : null}
    </Box>
)

export const GlassCard = ({ children, className = 'public-reveal', sx = {}, component = Box, ...rest }) => {
    const theme = useTheme()
    const Component = component

    return (
        <Component
            className={className}
            sx={getLiquidGlassPanelSx(theme, {
                p: { xs: 2.4, md: 3 },
                borderRadius: '8px',
                minWidth: 0,
                transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: theme.palette.glass.accentStrong,
                    boxShadow: theme.palette.glass.shadow
                },
                ...sx
            })}
            {...rest}
        >
            {children}
        </Component>
    )
}

export const IconFrame = ({ children, tone = 'blue' }) => {
    const theme = useTheme()
    const color = tone === 'teal' ? theme.palette.glass.accentAlt : tone === 'amber' ? SITE_COLORS.amber : theme.palette.glass.accent

    return (
        <Box
            sx={getLiquidGlassControlSx(theme, {
                width: 44,
                height: 44,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
                flexShrink: 0,
                boxShadow: 'none'
            })}
        >
            {children}
        </Box>
    )
}

export const PrimaryButton = ({ children, sx = {}, ...rest }) => {
    const theme = useTheme()

    return (
        <Button
            sx={getLiquidGlassControlSx(theme, {
                minHeight: 46,
                px: 2.6,
                borderRadius: '8px',
                fontWeight: 900,
                textTransform: 'none',
                ...sx
            })}
            {...rest}
        >
            {children}
        </Button>
    )
}

export const SecondaryButton = ({ children, sx = {}, ...rest }) => {
    const theme = useTheme()

    return (
        <Button
            sx={getLiquidGlassPanelSx(theme, {
                minHeight: 46,
                px: 2.6,
                borderRadius: '8px',
                color: SITE_COLORS.text,
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: 'none',
                ...sx
            })}
            {...rest}
        >
            {children}
        </Button>
    )
}

export const LanguageSwitch = ({ languages, currentLang, onChange, compact = false, dark = false }) => {
    const theme = useTheme()

    return (
        <Stack
            direction='row'
            spacing={0.4}
            sx={getLiquidGlassPanelSx(theme, {
                p: 0.5,
                borderRadius: '999px',
                boxShadow: 'none',
                flexShrink: 0
            })}
        >
            {languages.map((lng) => {
                const active = currentLang === lng.code || currentLang?.startsWith(`${lng.code}-`)
                return (
                    <Button
                        key={lng.code}
                        size='small'
                        onClick={() => onChange(lng.code)}
                        sx={{
                            minWidth: compact ? 36 : { xs: 38, sm: 58 },
                            px: compact ? 0.8 : { xs: 0.8, sm: 1.25 },
                            py: 0.45,
                            borderRadius: '999px',
                            textTransform: 'none',
                            fontWeight: 900,
                            color: active ? theme.palette.glass.accentText : dark ? 'rgba(248,251,255,0.72)' : SITE_COLORS.muted,
                            background: active
                                ? `linear-gradient(135deg, ${theme.palette.glass.highlight}, ${theme.palette.glass.controlActive})`
                                : 'transparent',
                            '&:hover': {
                                background: active ? theme.palette.glass.controlActive : theme.palette.glass.surface
                            }
                        }}
                    >
                        <Box component='span' sx={{ display: { xs: compact ? 'inline' : 'none', sm: 'inline' } }}>
                            {compact ? (lng.code === 'zh' ? '中' : 'En') : lng.label}
                        </Box>
                        {!compact ? (
                            <Box component='span' sx={{ display: { xs: 'inline', sm: 'none' } }}>
                                {lng.code === 'zh' ? '中' : 'En'}
                            </Box>
                        ) : null}
                    </Button>
                )
            })}
        </Stack>
    )
}

export const ProductCanvasMock = ({ copy, title }) => {
    const theme = useTheme()
    const labels = [copy.input, copy.model, copy.knowledge, copy.tool, copy.output]

    return (
        <Box className='public-reveal'>
            {/* TODO: Replace this CSS mock with a verified FlowOps product screenshot after approved assets are available. */}
            <Box
                sx={getLiquidGlassPanelSx(theme, {
                    position: 'relative',
                    p: { xs: 1.4, md: 1.6 },
                    borderRadius: '8px',
                    overflow: 'hidden',
                    minHeight: { xs: 330, md: 420 }
                })}
            >
                <Stack direction='row' spacing={0.7} sx={{ alignItems: 'center', mb: 1.4 }}>
                    {['#ff5f57', '#ffbd2e', '#28c840'].map((color) => (
                        <Box key={color} sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                    ))}
                    <Typography sx={{ pl: 1, color: SITE_COLORS.quiet, fontWeight: 800, fontSize: '0.8rem' }}>
                        {title || copy.title}
                    </Typography>
                    <Box
                        sx={{
                            ml: 'auto',
                            px: 1,
                            py: 0.35,
                            borderRadius: '999px',
                            color: theme.palette.glass.accentText,
                            background: theme.palette.glass.control
                        }}
                    >
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 900 }}>{copy.status}</Typography>
                    </Box>
                </Stack>
                <Box
                    sx={{
                        position: 'relative',
                        minHeight: { xs: 278, md: 360 },
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background:
                            'linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,255,255,0.26)), linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)',
                        backgroundSize: 'auto, 32px 32px, 32px 32px'
                    }}
                >
                    <Box
                        component='svg'
                        aria-hidden='true'
                        viewBox='0 0 620 330'
                        preserveAspectRatio='none'
                        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    >
                        <path
                            d='M88 84 C182 54 210 158 304 132 C390 108 420 206 524 180'
                            fill='none'
                            stroke={theme.palette.glass.accentStrong}
                            strokeWidth='4'
                            strokeLinecap='round'
                        />
                        <path
                            d='M112 244 C214 194 260 280 356 234 C430 198 478 260 540 238'
                            fill='none'
                            stroke='rgba(0,199,190,0.32)'
                            strokeWidth='4'
                            strokeLinecap='round'
                        />
                    </Box>
                    {labels.map((label, index) => (
                        <Box
                            key={label}
                            className='public-drift'
                            sx={{
                                position: 'absolute',
                                left: { xs: `${8 + (index % 2) * 46}%`, md: `${8 + index * 18}%` },
                                top: { xs: `${8 + index * 16}%`, md: `${18 + (index % 3) * 22}%` },
                                width: { xs: 132, sm: 150, md: 142 },
                                p: 1.3,
                                borderRadius: '8px',
                                color: SITE_COLORS.text,
                                background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 34%), ${theme.palette.glass.surfaceStrong}`,
                                border: `1px solid ${theme.palette.glass.border}`,
                                boxShadow: '0 14px 34px rgba(15,23,42,0.12)',
                                backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                                WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                                transform: `translateY(${index % 2 ? 7 : 0}px)`
                            }}
                        >
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 900 }}>{label}</Typography>
                            <Box sx={{ mt: 1, height: 6, borderRadius: '999px', backgroundColor: theme.palette.glass.accentStrong }} />
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    )
}

SectionShell.propTypes = {
    id: PropTypes.string,
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['light', 'blue', 'dark']),
    sx: PropTypes.object
}

SectionHeading.propTypes = {
    eyebrow: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    align: PropTypes.oneOf(['left', 'center']),
    color: PropTypes.string,
    muted: PropTypes.string
}

GlassCard.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    sx: PropTypes.object,
    component: PropTypes.elementType
}

IconFrame.propTypes = {
    children: PropTypes.node.isRequired,
    tone: PropTypes.oneOf(['blue', 'teal', 'amber'])
}

PrimaryButton.propTypes = {
    children: PropTypes.node.isRequired,
    sx: PropTypes.object
}

SecondaryButton.propTypes = {
    children: PropTypes.node.isRequired,
    sx: PropTypes.object
}

LanguageSwitch.propTypes = {
    languages: PropTypes.array.isRequired,
    currentLang: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    compact: PropTypes.bool,
    dark: PropTypes.bool
}

ProductCanvasMock.propTypes = {
    copy: PropTypes.object.isRequired,
    title: PropTypes.string
}
