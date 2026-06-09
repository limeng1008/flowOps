import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconCloudLock, IconDatabase, IconLockAccess, IconServerCog, IconShieldCheck, IconWifiOff } from '@tabler/icons-react'

import { GlassCard, IconFrame, SectionHeading, SectionShell, SITE_COLORS } from './shared'

const icons = [IconServerCog, IconDatabase, IconShieldCheck, IconWifiOff, IconLockAccess, IconCloudLock]

const DeploymentMock = ({ copy }) => {
    const theme = useTheme()

    return (
        <GlassCard sx={{ minHeight: { xs: 360, md: 460 } }}>
            {/* TODO: Replace this deployment diagram with a real architecture screenshot when deployment assets are finalized. */}
            <Typography component='h3' sx={{ color: SITE_COLORS.text, fontWeight: 950, fontSize: '1.18rem' }}>
                {copy.title}
            </Typography>
            <Box
                sx={{
                    position: 'relative',
                    mt: 3,
                    minHeight: { xs: 280, md: 350 },
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background:
                        'linear-gradient(135deg, rgba(255,255,255,0.66), rgba(255,255,255,0.28)), linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)',
                    backgroundSize: 'auto, 34px 34px, 34px 34px'
                }}
            >
                <Box
                    component='svg'
                    aria-hidden='true'
                    viewBox='0 0 620 340'
                    preserveAspectRatio='none'
                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                >
                    <path
                        d='M95 96 H252 C302 96 302 170 352 170 H520'
                        fill='none'
                        stroke={theme.palette.glass.accentStrong}
                        strokeWidth='4'
                        strokeLinecap='round'
                    />
                    <path
                        d='M96 246 H250 C305 246 305 170 352 170'
                        fill='none'
                        stroke='rgba(0,199,190,0.34)'
                        strokeWidth='4'
                        strokeLinecap='round'
                    />
                </Box>
                {copy.nodes.map((node, index) => (
                    <Box
                        key={node}
                        className='public-drift'
                        sx={{
                            position: 'absolute',
                            left: { xs: `${8 + (index % 2) * 48}%`, md: `${8 + (index % 3) * 31}%` },
                            top: { xs: `${8 + index * 15}%`, md: index < 3 ? `${16 + index * 18}%` : `${58 + (index - 3) * 13}%` },
                            width: { xs: 128, sm: 156, md: 166 },
                            p: 1.4,
                            borderRadius: '8px',
                            background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 34%), ${theme.palette.glass.surfaceStrong}`,
                            border: `1px solid ${theme.palette.glass.border}`,
                            boxShadow: '0 14px 34px rgba(15,23,42,0.12)'
                        }}
                    >
                        <Typography sx={{ color: SITE_COLORS.text, fontWeight: 950, fontSize: '0.82rem' }}>{node}</Typography>
                    </Box>
                ))}
            </Box>
        </GlassCard>
    )
}

const Enterprise = ({ copy }) => (
    <SectionShell id='enterprise' variant='dark'>
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' },
                gap: { xs: 4, md: 5 },
                alignItems: 'center'
            }}
        >
            <Box>
                <SectionHeading
                    eyebrow={copy.eyebrow}
                    title={copy.title}
                    subtitle={copy.subtitle}
                    color='#f8fbff'
                    muted='rgba(248,251,255,0.72)'
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.4, mt: 4 }}>
                    {copy.items.map(([title, desc], index) => {
                        const Icon = icons[index] || IconShieldCheck
                        return (
                            <GlassCard key={title} sx={{ background: 'rgba(15,23,42,0.56)', color: '#f8fbff', minHeight: 180 }}>
                                <Stack direction='row' spacing={1.2} sx={{ alignItems: 'center' }}>
                                    <IconFrame tone={index % 3 === 1 ? 'teal' : index % 3 === 2 ? 'amber' : 'blue'}>
                                        <Icon size={21} />
                                    </IconFrame>
                                    <Typography component='h3' sx={{ fontWeight: 950 }}>
                                        {title}
                                    </Typography>
                                </Stack>
                                <Typography sx={{ mt: 1.4, color: 'rgba(248,251,255,0.72)', lineHeight: 1.65 }}>{desc}</Typography>
                            </GlassCard>
                        )
                    })}
                </Box>
            </Box>
            <DeploymentMock copy={copy.mock} />
        </Box>
    </SectionShell>
)

DeploymentMock.propTypes = {
    copy: PropTypes.object.isRequired
}

Enterprise.propTypes = {
    copy: PropTypes.object.isRequired
}

export default Enterprise
