import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// material-ui
import { Alert, Box, Button, OutlinedInput, Stack, TextField, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'

// project imports
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'

// API
import accountApi from '@/api/account.api'

// utils
import useNotifier from '@/utils/useNotifier'
import { validatePassword } from '@/utils/validation'

// Hooks
import { useError } from '@/store/context/ErrorContext'

// Icons
import { IconExclamationCircle, IconX } from '@tabler/icons-react'

// ==============================|| ResetPasswordPage ||============================== //

const C = {
    cyan: '#22d3ee',
    cyanDeep: '#06b6d4',
    text: '#e5e7eb',
    textDim: '#9ca3af',
    textMute: '#6b7280',
    glow: 'rgba(34, 211, 238, 0.35)',
    panel: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.10)'
}

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '14px',
        color: C.text,
        backgroundColor: 'rgba(0,0,0,0.30)',
        '& fieldset': { borderColor: C.border },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.20)' },
        '&.Mui-focused fieldset': { borderColor: C.cyan, borderWidth: '1px' }
    },
    '& .MuiOutlinedInput-input': { padding: '14px 16px' },
    '& .MuiOutlinedInput-input::placeholder': { color: C.textMute, opacity: 1 }
}

const ResetPasswordPage = () => {
    const { t } = useTranslation()
    useNotifier()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [params] = useSearchParams()
    const token = params.get('token')

    const [emailVal, setEmailVal] = useState('')
    const [newPasswordVal, setNewPasswordVal] = useState('')
    const [confirmPasswordVal, setConfirmPasswordVal] = useState('')
    const [tokenVal, setTokenVal] = useState(token ?? '')

    const [loading, setLoading] = useState(false)
    const [authErrors, setAuthErrors] = useState([])

    const { authRateLimitError, setAuthRateLimitError } = useError()

    const validationMessage = (message) =>
        ({
            'Token cannot be left blank!': t('auth.resetTokenRequired'),
            'New Password and Confirm Password do not match.': t('auth.passwordsDontMatch'),
            'Password must be at least 8 characters': t('auth.passwordMinLength'),
            'Password must not be more than 128 characters': t('auth.passwordMaxLength'),
            'Password must contain at least one lowercase letter': t('auth.passwordLowercase'),
            'Password must contain at least one uppercase letter': t('auth.passwordUppercase'),
            'Password must contain at least one digit': t('auth.passwordDigit'),
            'Password must contain at least one special character': t('auth.passwordSpecial')
        }[message] || message)

    const goLogin = () => {
        navigate('/signin', { replace: true })
    }

    const validateAndSubmit = async (event) => {
        event.preventDefault()
        const validationErrors = []
        setAuthErrors([])
        setAuthRateLimitError(null)
        if (!tokenVal) {
            validationErrors.push(t('auth.resetTokenRequired'))
        }
        if (newPasswordVal !== confirmPasswordVal) {
            validationErrors.push(t('auth.passwordsDoNotMatch'))
        }
        const passwordErrors = validatePassword(newPasswordVal)
        if (passwordErrors.length > 0) {
            validationErrors.push(...passwordErrors)
        }
        if (validationErrors.length > 0) {
            setAuthErrors(validationErrors.map((msg) => validationMessage(msg)))
            return
        }
        const body = {
            user: {
                email: emailVal,
                tempToken: tokenVal,
                password: newPasswordVal
            }
        }
        setLoading(true)
        try {
            const updateResponse = await accountApi.resetPassword(body)
            setAuthErrors([])
            setLoading(false)
            if (updateResponse.data) {
                enqueueSnackbar({
                    message: t('auth.passwordResetSuccessful'),
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                setEmailVal('')
                setTokenVal('')
                setNewPasswordVal('')
                setConfirmPasswordVal('')
                goLogin()
            }
        } catch (error) {
            setLoading(false)
            setAuthErrors([typeof error.response.data === 'object' ? error.response.data.message : error.response.data])
            enqueueSnackbar({
                message: t('auth.passwordResetFailed'),
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    useEffect(() => {
        setAuthRateLimitError(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <Box
                sx={{
                    width: '100%',
                    maxWidth: 520,
                    backgroundColor: C.panel,
                    border: `1px solid ${C.border}`,
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderRadius: '32px',
                    p: { xs: 3.5, md: 5 },
                    boxShadow: '0 0 80px rgba(34,211,238,0.10)'
                }}
            >
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    {authErrors && authErrors.length > 0 && (
                        <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                            <ul style={{ margin: 0 }}>
                                {authErrors.map((msg, key) => (
                                    <li key={key}>{msg}</li>
                                ))}
                            </ul>
                        </Alert>
                    )}
                    {authRateLimitError && (
                        <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                            {authRateLimitError}
                        </Alert>
                    )}

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography component='h1' sx={{ fontSize: '2rem', fontWeight: 800, color: C.text }}>
                            {t('auth.resetPasswordTitle')}
                        </Typography>
                        <Typography sx={{ color: C.textDim, mt: 1, fontSize: '0.95rem' }}>
                            <Link style={{ color: C.cyan, textDecoration: 'none' }} to='/signin'>
                                {t('auth.backToLogin')}
                            </Link>
                            .
                        </Typography>
                    </Box>

                    <form onSubmit={validateAndSubmit}>
                        <Stack sx={{ width: '100%', flexDirection: 'column', alignItems: 'left', justifyContent: 'center', gap: 2.5 }}>
                            <Box>
                                <Typography sx={{ color: C.textDim, mb: 1, fontSize: '0.875rem' }}>
                                    {t('auth.email')}
                                    <span style={{ color: '#f87171' }}>&nbsp;*</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    type='email'
                                    placeholder='user@company.com'
                                    value={emailVal}
                                    onChange={(e) => setEmailVal(e.target.value)}
                                    sx={inputSx}
                                />
                            </Box>
                            <Box>
                                <Typography sx={{ color: C.textDim, mb: 1, fontSize: '0.875rem' }}>
                                    {t('auth.resetToken')}
                                    <span style={{ color: '#f87171' }}>&nbsp;*</span>
                                </Typography>
                                <OutlinedInput
                                    fullWidth
                                    type='string'
                                    placeholder={t('auth.resetTokenPlaceholder')}
                                    multiline={true}
                                    rows={3}
                                    onChange={(e) => setTokenVal(e.target.value)}
                                    value={tokenVal}
                                    sx={{
                                        mt: '8px',
                                        borderRadius: '14px',
                                        color: C.text,
                                        backgroundColor: 'rgba(0,0,0,0.30)',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: C.border },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.20)' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.cyan, borderWidth: '1px' },
                                        '& textarea::placeholder': { color: C.textMute, opacity: 1 }
                                    }}
                                />
                                <Typography variant='caption' sx={{ color: C.textMute }}>
                                    <i>{t('auth.resetTokenHint')}</i>
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: C.textDim, mb: 1, fontSize: '0.875rem' }}>
                                    {t('auth.newPassword')}
                                    <span style={{ color: '#f87171' }}>&nbsp;*</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    type='password'
                                    placeholder='********'
                                    value={newPasswordVal}
                                    onChange={(e) => setNewPasswordVal(e.target.value)}
                                    sx={inputSx}
                                />
                                <Typography variant='caption' sx={{ color: C.textMute }}>
                                    <i>{t('auth.passwordRule')}</i>
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: C.textDim, mb: 1, fontSize: '0.875rem' }}>
                                    {t('auth.confirmPassword')}
                                    <span style={{ color: '#f87171' }}>&nbsp;*</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    type='password'
                                    placeholder='********'
                                    value={confirmPasswordVal}
                                    onChange={(e) => setConfirmPasswordVal(e.target.value)}
                                    sx={inputSx}
                                />
                                <Typography variant='caption' sx={{ color: C.textMute }}>
                                    <i>{t('auth.confirmPasswordHint')}</i>
                                </Typography>
                            </Box>

                            <LoadingButton
                                loading={loading}
                                variant='contained'
                                sx={{
                                    mt: 1,
                                    height: 52,
                                    borderRadius: '14px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: '#000',
                                    backgroundColor: C.cyan,
                                    boxShadow: `0 0 40px ${C.glow}`,
                                    '&:hover': { backgroundColor: C.cyanDeep },
                                    '&.Mui-disabled': { backgroundColor: 'rgba(34,211,238,0.5)', color: '#000' }
                                }}
                                type='submit'
                            >
                                {t('auth.updatePassword')}
                            </LoadingButton>
                        </Stack>
                    </form>
                </Stack>
            </Box>
            {loading && <BackdropLoader open={loading} />}
        </>
    )
}

export default ResetPasswordPage
