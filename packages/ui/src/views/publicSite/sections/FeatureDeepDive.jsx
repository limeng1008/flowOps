import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'
import { IconCheck } from '@tabler/icons-react'

import { GlassCard, IconFrame, ProductCanvasMock, SectionHeading, SectionShell } from './shared'

const FeatureDeepDive = ({ copy, heroMock }) => (
    <SectionShell id='features' variant='dark'>
        <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            subtitle={copy.subtitle}
            align='center'
            color='#f8fbff'
            muted='rgba(248,251,255,0.72)'
        />
        <Stack spacing={{ xs: 4, md: 6 }} sx={{ mt: 6 }}>
            {copy.items.map((item, index) => {
                const visual = (
                    <ProductCanvasMock copy={{ ...heroMock, title: item.mockTitle, status: heroMock.status }} title={item.mockTitle} />
                )
                const text = (
                    <GlassCard sx={{ color: '#f8fbff', background: 'rgba(15,23,42,0.56)', minHeight: { md: 380 } }}>
                        <Typography component='h3' sx={{ fontSize: { xs: '1.55rem', md: '2rem' }, lineHeight: 1.18, fontWeight: 950 }}>
                            {item.title}
                        </Typography>
                        <Typography sx={{ mt: 2, color: 'rgba(248,251,255,0.72)', lineHeight: 1.78 }}>{item.body}</Typography>
                        <Stack spacing={1.2} sx={{ mt: 3 }}>
                            {item.points.map((point) => (
                                <Stack key={point} direction='row' spacing={1.1} sx={{ alignItems: 'center' }}>
                                    <IconFrame tone='teal'>
                                        <IconCheck size={19} />
                                    </IconFrame>
                                    <Typography sx={{ color: '#f8fbff', fontWeight: 850 }}>{point}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </GlassCard>
                )

                return (
                    <Box
                        key={item.title}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                            gap: { xs: 2.5, md: 4 },
                            alignItems: 'center'
                        }}
                    >
                        {index % 2 === 0 ? (
                            <>
                                {text}
                                {visual}
                            </>
                        ) : (
                            <>
                                <Box sx={{ display: { xs: 'none', lg: 'block' } }}>{visual}</Box>
                                {text}
                                <Box sx={{ display: { xs: 'block', lg: 'none' } }}>{visual}</Box>
                            </>
                        )}
                    </Box>
                )
            })}
        </Stack>
    </SectionShell>
)

FeatureDeepDive.propTypes = {
    copy: PropTypes.object.isRequired,
    heroMock: PropTypes.object.isRequired
}

export default FeatureDeepDive
