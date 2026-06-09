import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconBrain, IconCpu2, IconDatabaseSearch } from '@tabler/icons-react'

import { IconFrame, SectionHeading, SectionShell, SITE_COLORS } from './shared'

const ModelWall = ({ copy }) => {
    const theme = useTheme()
    const repeated = [...copy.items, ...copy.items]

    return (
        <SectionShell id='models' variant='blue' sx={{ py: { xs: 6, md: 7 } }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '0.76fr 1.24fr' },
                    gap: { xs: 3, md: 5 },
                    alignItems: 'center'
                }}
            >
                <SectionHeading eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />
                <Box className='public-reveal' sx={{ minWidth: 0, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '8px',
                            border: `1px solid ${theme.palette.glass.border}`,
                            background: theme.palette.glass.surfaceStrong,
                            boxShadow: theme.palette.glass.shadow,
                            backdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`,
                            WebkitBackdropFilter: `blur(${theme.palette.glass.blur}) saturate(1.45)`
                        }}
                    >
                        <Stack
                            className='public-marquee-track'
                            direction='row'
                            spacing={1.2}
                            sx={{
                                width: 'max-content',
                                py: 2,
                                px: 2,
                                willChange: 'transform'
                            }}
                        >
                            {repeated.map((item, index) => (
                                <Stack
                                    key={`${item}-${index}`}
                                    direction='row'
                                    spacing={1}
                                    sx={{
                                        alignItems: 'center',
                                        minWidth: { xs: 164, sm: 190 },
                                        px: 1.7,
                                        py: 1.35,
                                        borderRadius: '8px',
                                        color: SITE_COLORS.text,
                                        background: `linear-gradient(145deg, ${theme.palette.glass.highlight}, transparent 34%), ${theme.palette.glass.control}`,
                                        border: `1px solid ${theme.palette.glass.border}`
                                    }}
                                >
                                    <IconFrame tone={index % 3 === 1 ? 'teal' : index % 3 === 2 ? 'amber' : 'blue'}>
                                        {index % 3 === 1 ? (
                                            <IconCpu2 size={20} />
                                        ) : index % 3 === 2 ? (
                                            <IconDatabaseSearch size={20} />
                                        ) : (
                                            <IconBrain size={20} />
                                        )}
                                    </IconFrame>
                                    <Typography sx={{ fontWeight: 950, whiteSpace: 'nowrap' }}>{item}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </SectionShell>
    )
}

ModelWall.propTypes = {
    copy: PropTypes.object.isRequired
}

export default ModelWall
