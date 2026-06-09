import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { GlassCard, SectionHeading, SectionShell, SITE_COLORS } from './shared'

const Metrics = ({ copy }) => {
    const theme = useTheme()

    return (
        <SectionShell id='metrics' variant='light' sx={{ py: { xs: 6, md: 8 } }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '0.82fr 1.18fr' },
                    gap: { xs: 4, md: 5 },
                    alignItems: 'center'
                }}
            >
                <SectionHeading eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                    {copy.items.map(([value, label, desc]) => (
                        <GlassCard key={label} sx={{ minHeight: 176 }}>
                            {/* Metrics are derived from the current public capability scope; replace with telemetry-backed data when available. */}
                            <Typography
                                sx={{
                                    color: theme.palette.glass.accentText,
                                    fontSize: { xs: '2.7rem', md: '3.25rem' },
                                    lineHeight: 1,
                                    fontWeight: 950
                                }}
                            >
                                {value}
                            </Typography>
                            <Typography component='h3' sx={{ mt: 1.4, color: SITE_COLORS.text, fontWeight: 950 }}>
                                {label}
                            </Typography>
                            <Typography sx={{ mt: 0.8, color: SITE_COLORS.muted, lineHeight: 1.6 }}>{desc}</Typography>
                        </GlassCard>
                    ))}
                </Box>
            </Box>
        </SectionShell>
    )
}

Metrics.propTypes = {
    copy: PropTypes.object.isRequired
}

export default Metrics
