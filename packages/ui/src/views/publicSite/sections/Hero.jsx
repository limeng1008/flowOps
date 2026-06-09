import PropTypes from 'prop-types'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconArrowRight, IconBooks, IconSparkles } from '@tabler/icons-react'

import { GlassCard, PrimaryButton, ProductCanvasMock, SecondaryButton, SITE_COLORS, getLinkProps } from './shared'

const Hero = ({ copy }) => {
    const theme = useTheme()

    return (
        <Box
            component='section'
            className='public-section'
            sx={{
                position: 'relative',
                overflow: 'hidden',
                px: { xs: 2, sm: 3, md: 6 },
                py: { xs: 7, md: 9 },
                minHeight: { xs: 'auto', md: 'calc(100dvh - 74px)' },
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f7fbff',
                backgroundImage:
                    'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(238,247,255,0.72) 48%, rgba(231,251,249,0.82)), linear-gradient(120deg, rgba(10,132,255,0.12), rgba(0,199,190,0.1))'
            }}
        >
            <Box
                aria-hidden='true'
                sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.45,
                    backgroundImage:
                        'linear-gradient(rgba(15,23,42,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)',
                    backgroundSize: { xs: '36px 36px', md: '56px 56px' },
                    maskImage: 'linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)'
                }}
            />
            <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1240, mx: 'auto' }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '0.92fr 1.08fr' },
                        gap: { xs: 5, lg: 6 },
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Chip
                            className='public-reveal'
                            icon={<IconSparkles size={16} />}
                            label={copy.eyebrow}
                            variant='outlined'
                            sx={{
                                color: theme.palette.glass.accentText,
                                borderColor: theme.palette.glass.accentStrong,
                                background: theme.palette.glass.surface,
                                fontWeight: 900
                            }}
                        />
                        <Typography
                            className='public-reveal'
                            component='h1'
                            sx={{
                                mt: 2.5,
                                color: SITE_COLORS.ink,
                                fontSize: { xs: '2.65rem', sm: '3.25rem', md: '4.65rem' },
                                lineHeight: 1.02,
                                fontWeight: 950,
                                letterSpacing: 0
                            }}
                        >
                            {copy.title}
                        </Typography>
                        <Typography
                            className='public-reveal'
                            sx={{
                                mt: 2.6,
                                color: SITE_COLORS.muted,
                                fontSize: { xs: '1rem', md: '1.15rem' },
                                lineHeight: 1.78,
                                maxWidth: 760
                            }}
                        >
                            {copy.subtitle}
                        </Typography>
                        <Stack className='public-reveal' direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ mt: 4 }}>
                            <PrimaryButton {...getLinkProps('/signin')} endIcon={<IconArrowRight size={18} />}>
                                {copy.primary}
                            </PrimaryButton>
                            <SecondaryButton {...getLinkProps('/docs')} startIcon={<IconBooks size={18} />}>
                                {copy.secondary}
                            </SecondaryButton>
                        </Stack>
                        <Typography className='public-reveal' sx={{ mt: 2.4, color: SITE_COLORS.quiet, fontWeight: 800 }}>
                            {copy.trust}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.4, mt: 4 }}>
                            {copy.highlights.map(([value, label]) => (
                                <GlassCard key={value} sx={{ p: 2.1, minHeight: 116 }}>
                                    <Typography sx={{ color: theme.palette.glass.accentText, fontWeight: 950, fontSize: '1.05rem' }}>
                                        {value}
                                    </Typography>
                                    <Typography sx={{ mt: 0.8, color: SITE_COLORS.muted, lineHeight: 1.55 }}>{label}</Typography>
                                </GlassCard>
                            ))}
                        </Box>
                    </Box>
                    <ProductCanvasMock copy={copy.mock} />
                </Box>
            </Box>
        </Box>
    )
}

Hero.propTypes = {
    copy: PropTypes.object.isRequired
}

export default Hero
