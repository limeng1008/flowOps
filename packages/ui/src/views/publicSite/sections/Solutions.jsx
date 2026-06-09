import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconArrowUpRight, IconHeadset, IconNotes, IconPresentationAnalytics, IconSpeakerphone } from '@tabler/icons-react'

import { GlassCard, IconFrame, SectionHeading, SectionShell, SITE_COLORS } from './shared'

const icons = [IconHeadset, IconNotes, IconPresentationAnalytics, IconSpeakerphone]

const Solutions = ({ copy }) => {
    const theme = useTheme()

    return (
        <SectionShell id='solutions' variant='blue'>
            <SectionHeading eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mt: 5 }}>
                {copy.items.map(([title, desc], index) => {
                    const Icon = icons[index] || IconHeadset
                    return (
                        <GlassCard key={title} sx={{ minHeight: 270, display: 'flex', flexDirection: 'column' }}>
                            <IconFrame tone={index % 3 === 1 ? 'teal' : index % 3 === 2 ? 'amber' : 'blue'}>
                                <Icon size={22} />
                            </IconFrame>
                            <Typography component='h3' sx={{ mt: 2.2, color: SITE_COLORS.text, fontWeight: 950, fontSize: '1.18rem' }}>
                                {title}
                            </Typography>
                            <Typography sx={{ mt: 1.1, color: SITE_COLORS.muted, lineHeight: 1.72 }}>{desc}</Typography>
                            <Stack
                                direction='row'
                                spacing={0.8}
                                sx={{ mt: 'auto', pt: 2.6, alignItems: 'center', color: theme.palette.glass.accentText }}
                            >
                                <Typography sx={{ fontWeight: 950 }}>{copy.learnMore}</Typography>
                                <IconArrowUpRight size={17} />
                            </Stack>
                        </GlassCard>
                    )
                })}
            </Box>
        </SectionShell>
    )
}

Solutions.propTypes = {
    copy: PropTypes.object.isRequired
}

export default Solutions
