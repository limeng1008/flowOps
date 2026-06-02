import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'

// material-ui
import { Box, Typography, Alert, Button, Divider, Icon, TextField, InputAdornment, IconButton, Stack } from '@mui/material'
import { IconExclamationCircle, IconEye, IconEyeOff, IconPlugConnected, IconShieldCheck, IconSitemap } from '@tabler/icons-react'
import { LoadingButton } from '@mui/lab'
import gsap from 'gsap'
import { useTranslation } from 'react-i18next'

// Hooks
import useApi from '@/hooks/useApi'
import { useConfig } from '@/store/context/ConfigContext'
import { useError } from '@/store/context/ErrorContext'

// API
import authApi from '@/api/auth'
import accountApi from '@/api/account.api'
import loginMethodApi from '@/api/loginmethod'
import ssoApi from '@/api/sso'

// utils
import useNotifier from '@/utils/useNotifier'

// store
import { loginSuccess, logoutSuccess } from '@/store/reducers/authSlice'
import { store } from '@/store'

// icons
import AzureSSOLoginIcon from '@/assets/images/microsoft-azure.svg'
import GoogleSSOLoginIcon from '@/assets/images/google.svg'
import Auth0SSOLoginIcon from '@/assets/images/auth0.svg'
import GithubSSOLoginIcon from '@/assets/images/github.svg'
import FlowOpsLogo from '@/assets/images/flowops_dark.svg'

// ==============================|| design tokens (FlowOps) ||============================== //

const C = {
    teal: '#5eead4',
    tealDeep: '#14b8a6',
    blue: '#60a5fa',
    amber: '#fbbf24',
    text: '#f8fafc',
    textDim: '#cbd5e1',
    textMute: '#64748b',
    glow: 'rgba(20, 184, 166, 0.30)',
    panel: 'rgba(15, 23, 42, 0.78)',
    panelSolid: '#0f172a',
    border: 'rgba(226, 232, 240, 0.14)'
}

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '14px',
        color: C.text,
        backgroundColor: 'rgba(0,0,0,0.30)',
        '& fieldset': { borderColor: C.border },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.20)' },
        '&.Mui-focused fieldset': { borderColor: C.teal, borderWidth: '1px' }
    },
    '& .MuiOutlinedInput-input': { padding: '14px 16px' },
    '& .MuiOutlinedInput-input::placeholder': { color: C.textMute, opacity: 1 }
}

const ssoBtnSx = {
    height: 48,
    borderRadius: '8px',
    textTransform: 'none',
    color: C.text,
    backgroundColor: C.panel,
    border: `1px solid ${C.border}`,
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(94,234,212,0.45)' }
}

// ==============================|| SignInPage ||============================== //

const SignInPage = () => {
    const formRef = useRef(null)
    const { t } = useTranslation()
    useSelector((state) => state.customization)
    useNotifier()
    const { isEnterpriseLicensed, isCloud, isOpenSource } = useConfig()

    const [usernameVal, setUsernameVal] = useState('')
    const [passwordVal, setPasswordVal] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [configuredSsoProviders, setConfiguredSsoProviders] = useState([])
    const [authError, setAuthError] = useState(undefined)
    const [loading, setLoading] = useState(false)
    const [showResendButton, setShowResendButton] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const { authRateLimitError, setAuthRateLimitError } = useError()

    const loginApi = useApi(authApi.login)
    const ssoLoginApi = useApi(ssoApi.ssoLogin)
    const getDefaultProvidersApi = useApi(loginMethodApi.getDefaultLoginMethods)
    const navigate = useNavigate()
    const location = useLocation()
    const resendVerificationApi = useApi(accountApi.resendVerificationEmail)

    const doLogin = (event) => {
        event.preventDefault()
        setAuthRateLimitError(null)
        setLoading(true)
        const body = {
            email: usernameVal,
            password: passwordVal
        }
        loginApi.request(body)
    }

    useEffect(() => {
        if (loginApi.error) {
            setLoading(false)
            const responseData = loginApi.error.response?.data
            if (loginApi.error.response?.status === 401 && responseData?.redirectUrl) {
                window.location.href = responseData.redirectUrl
            } else {
                setAuthError(responseData?.message || loginApi.error.message)
            }
        }
    }, [loginApi.error])

    useEffect(() => {
        store.dispatch(logoutSuccess())
        setAuthRateLimitError(null)
        if (!isOpenSource) {
            getDefaultProvidersApi.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setAuthRateLimitError, isOpenSource])

    useEffect(() => {
        // Parse the "user" query parameter from the URL
        const queryParams = new URLSearchParams(location.search)
        const errorData = queryParams.get('error')
        if (!errorData) return
        const parsedErrorData = JSON.parse(decodeURIComponent(errorData))
        setAuthError(parsedErrorData.message)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search])

    useEffect(() => {
        if (loginApi.data) {
            setLoading(false)
            store.dispatch(loginSuccess(loginApi.data))
            navigate(location.state?.path || '/')
            //navigate(0)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginApi.data])

    useEffect(() => {
        if (ssoLoginApi.data) {
            store.dispatch(loginSuccess(ssoLoginApi.data))
            navigate(location.state?.path || '/')
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ssoLoginApi.data])

    useEffect(() => {
        if (ssoLoginApi.error) {
            if (ssoLoginApi.error?.response?.status === 401 && ssoLoginApi.error?.response?.data.redirectUrl) {
                window.location.href = ssoLoginApi.error.response.data.redirectUrl
            } else {
                setAuthError(ssoLoginApi.error.message)
            }
        }
    }, [ssoLoginApi.error])

    useEffect(() => {
        if (getDefaultProvidersApi.data && getDefaultProvidersApi.data.providers) {
            //data is an array of objects, store only the provider attribute
            setConfiguredSsoProviders(getDefaultProvidersApi.data.providers.map((provider) => provider))
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getDefaultProvidersApi.data])

    useEffect(() => {
        if (authError === 'User Email Unverified') {
            setShowResendButton(true)
        } else {
            setShowResendButton(false)
        }
    }, [authError])

    // GSAP entrance: keep motion on transform/opacity so login stays responsive.
    useEffect(() => {
        let cleanupHover = []
        const ctx = gsap.context(() => {
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

            if (reduceMotion) {
                gsap.set('.auth-brand-item, .auth-metric-card, .auth-feature-row, .auth-anim-item, .auth-sheen', {
                    clearProps: 'all'
                })
                return
            }

            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

            if (formRef.current) {
                tl.fromTo(formRef.current, { autoAlpha: 0.94, scale: 0.985, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.34 })
            }

            tl.fromTo('.auth-anim-item', { y: 14, autoAlpha: 0.78 }, { y: 0, autoAlpha: 1, duration: 0.34, stagger: 0.05 }, 0.12)
                .fromTo('.auth-brand-item', { x: -16, autoAlpha: 0.78 }, { x: 0, autoAlpha: 1, duration: 0.36, stagger: 0.05 }, '-=0.26')
                .fromTo(
                    '.auth-metric-card',
                    { y: 10, scale: 0.97, autoAlpha: 0.78 },
                    { y: 0, scale: 1, autoAlpha: 1, duration: 0.28, stagger: 0.04, ease: 'back.out(1.25)' },
                    '-=0.16'
                )
                .fromTo('.auth-feature-row', { x: -10, autoAlpha: 0.78 }, { x: 0, autoAlpha: 1, duration: 0.28, stagger: 0.04 }, '-=0.14')
                .fromTo('.auth-sheen', { xPercent: -170 }, { xPercent: 170, duration: 0.82, ease: 'power2.inOut' }, 0.14)

            gsap.to('.auth-ambient', {
                y: -12,
                x: 8,
                duration: 3.8,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                stagger: 0.5
            })

            const hoverItems = gsap.utils.toArray('.auth-hover-lift')
            cleanupHover = hoverItems.map((item) => {
                const onEnter = () => gsap.to(item, { y: -2, scale: 1.01, duration: 0.18, ease: 'power2.out' })
                const onLeave = () => gsap.to(item, { y: 0, scale: 1, duration: 0.22, ease: 'power2.out' })
                item.addEventListener('mouseenter', onEnter)
                item.addEventListener('mouseleave', onLeave)
                item.addEventListener('focusin', onEnter)
                item.addEventListener('focusout', onLeave)
                return () => {
                    item.removeEventListener('mouseenter', onEnter)
                    item.removeEventListener('mouseleave', onLeave)
                    item.removeEventListener('focusin', onEnter)
                    item.removeEventListener('focusout', onLeave)
                }
            })
        }, formRef)
        return () => {
            cleanupHover.forEach((cleanup) => cleanup())
            ctx.revert()
        }
    }, [])

    const signInWithSSO = (ssoProvider) => {
        window.location.href = `/api/v1/${ssoProvider}/login`
    }

    const handleResendVerification = async () => {
        try {
            await resendVerificationApi.request({ email: usernameVal })
            setAuthError(undefined)
            setSuccessMessage(t('auth.verificationEmailSent'))
            setShowResendButton(false)
        } catch (error) {
            setAuthError(error.response?.data?.message || t('auth.verificationEmailFailed'))
        }
    }

    return (
        <Box
            ref={formRef}
            sx={{
                width: '100%',
                maxWidth: 1080,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
                backgroundColor: C.panel,
                border: `1px solid ${C.border}`,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 24px 90px rgba(0,0,0,0.36)'
            }}
        >
            <Box
                className='auth-brand-panel'
                sx={{
                    position: 'relative',
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 6,
                    p: 5,
                    minHeight: 650,
                    background:
                        'linear-gradient(135deg, rgba(20,184,166,0.18), rgba(96,165,250,0.10)), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,17,31,0.98))',
                    borderRight: `1px solid ${C.border}`,
                    overflow: 'hidden'
                }}
            >
                <Box
                    className='auth-ambient'
                    sx={{
                        position: 'absolute',
                        right: 54,
                        top: 58,
                        width: 186,
                        height: 54,
                        borderRadius: '8px',
                        border: '1px solid rgba(94,234,212,0.25)',
                        background:
                            'linear-gradient(90deg, rgba(94,234,212,0), rgba(94,234,212,0.14), rgba(96,165,250,0.10), rgba(94,234,212,0))',
                        transform: 'rotate(-8deg)',
                        pointerEvents: 'none'
                    }}
                />
                <Box
                    className='auth-ambient'
                    sx={{
                        position: 'absolute',
                        left: -42,
                        bottom: 92,
                        width: 216,
                        height: 46,
                        borderRadius: '8px',
                        border: '1px solid rgba(96,165,250,0.18)',
                        background:
                            'linear-gradient(90deg, rgba(96,165,250,0), rgba(96,165,250,0.14), rgba(94,234,212,0.08), rgba(96,165,250,0))',
                        transform: 'rotate(10deg)',
                        pointerEvents: 'none'
                    }}
                />
                <Box
                    className='auth-sheen'
                    sx={{
                        position: 'absolute',
                        top: -80,
                        bottom: -80,
                        left: '38%',
                        width: '28%',
                        transform: 'skewX(-18deg)',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                        pointerEvents: 'none'
                    }}
                />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <img
                        className='auth-brand-item'
                        src={FlowOpsLogo}
                        alt='FlowOps'
                        style={{ width: 164, height: 'auto', display: 'block' }}
                    />
                    <Typography
                        className='auth-brand-item'
                        sx={{ mt: 5, color: C.teal, fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.12em' }}
                    >
                        {t('auth.brandEyebrow')}
                    </Typography>
                    <Typography
                        className='auth-brand-item'
                        component='h1'
                        sx={{ mt: 1.5, color: C.text, fontSize: '2.55rem', lineHeight: 1.08, fontWeight: 900 }}
                    >
                        {t('auth.brandTitle')}
                    </Typography>
                    <Typography
                        className='auth-brand-item'
                        sx={{ mt: 2.5, color: C.textDim, fontSize: '1rem', lineHeight: 1.75, maxWidth: 440 }}
                    >
                        {t('auth.brandSubtitle')}
                    </Typography>
                </Box>

                <Box
                    className='auth-brand-item'
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        border: `1px solid ${C.border}`,
                        borderRadius: '8px',
                        backgroundColor: 'rgba(8,17,31,0.74)',
                        p: 2.5
                    }}
                >
                    <Stack direction='row' spacing={1.5} sx={{ mb: 2 }}>
                        {[
                            { value: '10x', label: t('auth.brandMetricAuto') },
                            { value: '24/7', label: t('auth.brandMetricOnline') },
                            { value: '100+', label: t('auth.brandMetricCost') }
                        ].map((metric) => (
                            <Box
                                className='auth-metric-card auth-hover-lift'
                                key={metric.label}
                                sx={{
                                    flex: 1,
                                    p: 1.5,
                                    borderRadius: '8px',
                                    border: `1px solid ${C.border}`,
                                    backgroundColor: 'rgba(255,255,255,0.04)'
                                }}
                            >
                                <Typography sx={{ color: C.text, fontWeight: 900, fontSize: '1.2rem' }}>{metric.value}</Typography>
                                <Typography sx={{ color: C.textMute, fontSize: '0.75rem', mt: 0.25 }}>{metric.label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                    {[
                        { icon: <IconSitemap size={18} />, text: t('auth.brandPointOrder') },
                        { icon: <IconPlugConnected size={18} />, text: t('auth.brandPointSystems') },
                        { icon: <IconShieldCheck size={18} />, text: t('auth.brandPointTrust') }
                    ].map((item) => (
                        <Box
                            className='auth-feature-row'
                            key={item.text}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: C.textDim, py: 0.8 }}
                        >
                            <Box sx={{ color: C.teal, display: 'flex' }}>{item.icon}</Box>
                            <Typography sx={{ fontSize: '0.9rem' }}>{item.text}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box sx={{ p: { xs: 3.5, md: 5 }, backgroundColor: 'rgba(15,23,42,0.55)' }}>
                {/* alerts */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {successMessage && (
                        <Alert variant='filled' severity='success' onClose={() => setSuccessMessage('')}>
                            {successMessage}
                        </Alert>
                    )}
                    {authRateLimitError && (
                        <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                            {authRateLimitError}
                        </Alert>
                    )}
                    {authError && (
                        <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                            {authError}
                        </Alert>
                    )}
                    {showResendButton && (
                        <Button variant='text' onClick={handleResendVerification} sx={{ color: C.teal, textTransform: 'none' }}>
                            {t('auth.resendVerificationEmail')}
                        </Button>
                    )}
                </Box>

                {/* header */}
                <Box
                    className='auth-anim-item'
                    sx={{ textAlign: 'center', mb: 4, mt: successMessage || authError || authRateLimitError ? 2 : 0 }}
                >
                    <Box
                        component='img'
                        src={FlowOpsLogo}
                        alt='FlowOps'
                        sx={{ width: 156, mb: 2, display: { xs: 'inline-block', md: 'none' } }}
                    />
                    <Typography component='h1' sx={{ fontSize: '2rem', fontWeight: 800, color: C.text }}>
                        {t('auth.welcomeBack')}
                    </Typography>
                    <Typography sx={{ color: C.textDim, mt: 1, fontSize: '0.95rem' }}>{t('auth.loginSubtitle')}</Typography>
                    {isCloud && (
                        <Typography sx={{ color: C.textDim, mt: 1.5, fontSize: '0.9rem' }}>
                            {t('auth.noAccount')}{' '}
                            <Link style={{ color: C.teal, textDecoration: 'none' }} to='/register'>
                                {t('auth.signUpFree')}
                            </Link>
                            .
                        </Typography>
                    )}
                    {isEnterpriseLicensed && (
                        <Typography sx={{ color: C.textDim, mt: 1.5, fontSize: '0.9rem' }}>
                            {t('auth.haveInviteCode')}{' '}
                            <Link style={{ color: C.teal, textDecoration: 'none' }} to='/register'>
                                {t('auth.signUpAccount')}
                            </Link>
                            .
                        </Typography>
                    )}
                </Box>

                {/* form */}
                <form onSubmit={doLogin}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box className='auth-anim-item'>
                            <Typography sx={{ color: C.textDim, mb: 1, fontSize: '0.875rem' }}>{t('auth.email')}</Typography>
                            <TextField
                                fullWidth
                                type='email'
                                placeholder='user@company.com'
                                value={usernameVal}
                                onChange={(e) => setUsernameVal(e.target.value)}
                                sx={inputSx}
                            />
                        </Box>

                        <Box className='auth-anim-item'>
                            <Typography sx={{ color: C.textDim, mb: 1, fontSize: '0.875rem' }}>{t('auth.password')}</Typography>
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                placeholder='********'
                                value={passwordVal}
                                onChange={(e) => setPasswordVal(e.target.value)}
                                sx={inputSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton onClick={() => setShowPassword((s) => !s)} edge='end' sx={{ color: C.textMute }}>
                                                {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Box sx={{ textAlign: 'right', mt: 1 }}>
                                <Link style={{ color: C.teal, fontSize: '0.85rem', textDecoration: 'none' }} to='/forgot-password'>
                                    {t('auth.forgotPassword')}
                                </Link>
                            </Box>
                        </Box>

                        <LoadingButton
                            className='auth-anim-item auth-hover-lift'
                            loading={loading}
                            type='submit'
                            fullWidth
                            sx={{
                                mt: 1,
                                height: 52,
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: '#042f2e',
                                backgroundColor: C.teal,
                                boxShadow: `0 0 40px ${C.glow}`,
                                '&:hover': { backgroundColor: C.tealDeep },
                                '&.Mui-disabled': { backgroundColor: 'rgba(94,234,212,0.5)', color: '#042f2e' }
                            }}
                        >
                            {t('auth.loginDashboard')}
                        </LoadingButton>

                        {configuredSsoProviders && configuredSsoProviders.length > 0 && (
                            <Divider
                                className='auth-anim-item'
                                sx={{ color: C.textMute, '&::before, &::after': { borderColor: C.border } }}
                            >
                                {t('auth.or')}
                            </Divider>
                        )}
                        {configuredSsoProviders &&
                            configuredSsoProviders.map(
                                (ssoProvider) =>
                                    ssoProvider === 'azure' && (
                                        <Button
                                            className='auth-anim-item auth-hover-lift'
                                            key={ssoProvider}
                                            fullWidth
                                            sx={ssoBtnSx}
                                            onClick={() => signInWithSSO(ssoProvider)}
                                            startIcon={
                                                <Icon>
                                                    <img src={AzureSSOLoginIcon} alt={'MicrosoftSSO'} width={20} height={20} />
                                                </Icon>
                                            }
                                        >
                                            {t('auth.signInWithMicrosoft')}
                                        </Button>
                                    )
                            )}
                        {configuredSsoProviders &&
                            configuredSsoProviders.map(
                                (ssoProvider) =>
                                    ssoProvider === 'google' && (
                                        <Button
                                            className='auth-anim-item auth-hover-lift'
                                            key={ssoProvider}
                                            fullWidth
                                            sx={ssoBtnSx}
                                            onClick={() => signInWithSSO(ssoProvider)}
                                            startIcon={
                                                <Icon>
                                                    <img src={GoogleSSOLoginIcon} alt={'GoogleSSO'} width={20} height={20} />
                                                </Icon>
                                            }
                                        >
                                            {t('auth.signInWithGoogle')}
                                        </Button>
                                    )
                            )}
                        {configuredSsoProviders &&
                            configuredSsoProviders.map(
                                (ssoProvider) =>
                                    ssoProvider === 'auth0' && (
                                        <Button
                                            className='auth-anim-item auth-hover-lift'
                                            key={ssoProvider}
                                            fullWidth
                                            sx={ssoBtnSx}
                                            onClick={() => signInWithSSO(ssoProvider)}
                                            startIcon={
                                                <Icon>
                                                    <img src={Auth0SSOLoginIcon} alt={'Auth0SSO'} width={20} height={20} />
                                                </Icon>
                                            }
                                        >
                                            {t('auth.signInWithAuth0')}
                                        </Button>
                                    )
                            )}
                        {configuredSsoProviders &&
                            configuredSsoProviders.map(
                                (ssoProvider) =>
                                    ssoProvider === 'github' && (
                                        <Button
                                            className='auth-anim-item auth-hover-lift'
                                            key={ssoProvider}
                                            fullWidth
                                            sx={ssoBtnSx}
                                            onClick={() => signInWithSSO(ssoProvider)}
                                            startIcon={
                                                <Icon>
                                                    <img src={GithubSSOLoginIcon} alt={'GithubSSO'} width={20} height={20} />
                                                </Icon>
                                            }
                                        >
                                            {t('auth.signInWithGithub')}
                                        </Button>
                                    )
                            )}
                    </Box>
                </form>
            </Box>
        </Box>
    )
}

export default SignInPage
