import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
    IconChartDots3,
    IconDatabase,
    IconFingerprint,
    IconPlugConnected,
    IconRoute,
    IconServer,
    IconShieldCheck,
    IconSitemap,
    IconUsersGroup
} from '@tabler/icons-react'

import { GlassCard, IconFrame, SectionHeading, SectionShell, SITE_COLORS } from './shared'

const icons = [
    IconSitemap,
    IconServer,
    IconDatabase,
    IconPlugConnected,
    IconUsersGroup,
    IconRoute,
    IconChartDots3,
    IconShieldCheck,
    IconFingerprint
]

const CapabilityGrid = ({ copy }) => {
    const theme = useTheme()

    return (
        <SectionShell id='capabilities' variant='light'>
            <SectionHeading eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} align='center' />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2, mt: 5 }}>
                {copy.items.map(([title, desc], index) => {
                    const Icon = icons[index] || IconSitemap
                    return (
                        <GlassCard key={title} sx={{ minHeight: 236 }}>
                            <IconFrame tone={index % 3 === 1 ? 'teal' : index % 3 === 2 ? 'amber' : 'blue'}>
                                <Icon size={22} />
                            </IconFrame>
                            <Typography component='h3' sx={{ mt: 2.2, color: SITE_COLORS.text, fontWeight: 950, fontSize: '1.14rem' }}>
                                {title}
                            </Typography>
                            <Typography sx={{ mt: 1.1, color: SITE_COLORS.muted, lineHeight: 1.72 }}>{desc}</Typography>
                            <Box
                                sx={{
                                    mt: 2.2,
                                    height: 6,
                                    width: 78,
                                    borderRadius: '999px',
                                    background: `linear-gradient(90deg, ${theme.palette.glass.accentStrong}, rgba(0,199,190,0.24))`
                                }}
                            />
                        </GlassCard>
                    )
                })}
            </Box>
        </SectionShell>
    )
}

CapabilityGrid.propTypes = {
    copy: PropTypes.object.isRequired
}

export default CapabilityGrid
