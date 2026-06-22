import MainCard from '@/ui-component/cards/MainCard'
import { Box, Stack, Typography } from '@mui/material'
import contactSupport from '@/assets/images/contact_support.svg'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { useTranslation } from 'react-i18next'
import { useConfig } from '@/store/context/ConfigContext'

// ==============================|| License Expired Page ||============================== //

const LicenseExpired = () => {
    const { t } = useTranslation()
    const { brand } = useConfig()

    return (
        <>
            <MainCard>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 'calc(100vh - 210px)'
                    }}
                >
                    <Stack
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        flexDirection='column'
                    >
                        <Box sx={{ p: 2, height: 'auto', mb: 4 }}>
                            <img style={{ objectFit: 'cover', height: '16vh', width: 'auto' }} src={contactSupport} alt='contact support' />
                        </Box>
                        <Typography sx={{ mb: 2 }} variant='h4' component='div' fontWeight='bold'>
                            {t('auth.licenseExpiredTitle')}
                        </Typography>
                        <Typography variant='body1' component='div' sx={{ mb: 2 }}>
                            {t('auth.licenseExpiredDesc')}
                        </Typography>
                        {brand?.supportEmail ? (
                            <a href={`mailto:${brand.supportEmail}`}>
                                <StyledButton sx={{ px: 2, py: 1 }}>{t('auth.contactSupport')}</StyledButton>
                            </a>
                        ) : null}
                    </Stack>
                </Box>
            </MainCard>
        </>
    )
}

export default LicenseExpired
