import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconArrowRight, IconLifebuoy } from '@tabler/icons-react'

import { PrimaryButton, SecondaryButton, SectionShell, SITE_COLORS, getLinkProps } from './shared'
import { getLiquidGlassPanelSx } from '@/ui-component/utils/liquidGlassStyles'

const FinalCTA = ({ copy }) => {
    const theme = useTheme()

    return (
        <SectionShell id='cta' variant='blue' sx={{ py: { xs: 7, md: 9 } }}>
            <Box
                className='public-reveal'
                sx={getLiquidGlassPanelSx(theme, {
                    position: 'relative',
                    overflow: 'hidden',
                    p: { xs: 3, md: 5 },
                    borderRadius: '8px',
                    textAlign: 'center'
                })}
            >
                <Box
                    aria-hidden='true'
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(135deg, rgba(10,132,255,0.12), transparent 42%), linear-gradient(315deg, rgba(0,199,190,0.14), transparent 46%)'
                    }}
                />
                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 860, mx: 'auto' }}>
                    <Typography
                        sx={{ color: theme.palette.glass.accentText, fontSize: '0.82rem', fontWeight: 950, textTransform: 'uppercase' }}
                    >
                        {copy.eyebrow}
                    </Typography>
                    <Typography
                        component='h2'
                        sx={{
                            mt: 1.4,
                            color: SITE_COLORS.ink,
                            fontSize: { xs: '2.05rem', md: '3.25rem' },
                            lineHeight: 1.08,
                            fontWeight: 950,
                            letterSpacing: 0
                        }}
                    >
                        {copy.title}
                    </Typography>
                    <Typography sx={{ mt: 2, color: SITE_COLORS.muted, fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.78 }}>
                        {copy.subtitle}
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.4}
                        sx={{ mt: 4, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <PrimaryButton {...getLinkProps('/signin')} endIcon={<IconArrowRight size={18} />}>
                            {copy.primary}
                        </PrimaryButton>
                        <SecondaryButton {...getLinkProps('/help')} startIcon={<IconLifebuoy size={18} />}>
                            {copy.secondary}
                        </SecondaryButton>
                    </Stack>
                </Box>
            </Box>
        </SectionShell>
    )
}

FinalCTA.propTypes = {
    copy: PropTypes.object.isRequired
}

export default FinalCTA
