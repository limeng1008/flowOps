import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod/v3'

// material-ui
import { Alert, Box, Button, Chip, Divider, Icon, List, ListItemText, Stack, Typography } from '@mui/material'

// project imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Input } from '@/ui-component/input/Input'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'
import { translateAuthErrorMessage } from '@/views/auth/authErrorMessage'

// API
import accountApi from '@/api/account.api'
import authApi from '@/api/auth'
import loginMethodApi from '@/api/loginmethod'

// Hooks
import useApi from '@/hooks/useApi'
import { store } from '@/store'
import { loginSuccess } from '@/store/reducers/authSlice'

// utils
import useNotifier from '@/utils/useNotifier'
import { passwordSchema } from '@/utils/validation'

// Icons
import Auth0SSOLoginIcon from '@/assets/images/auth0.svg'
import GoogleSSOLoginIcon from '@/assets/images/google.svg'
import AzureSSOLoginIcon from '@/assets/images/microsoft-azure.svg'
import { useConfig } from '@/store/context/ConfigContext'
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

// ==============================|| Organization & Admin User Setup ||============================== //

// IMPORTANT: when updating this schema, update the schema on the server as well
// packages/server/src/enterprise/Interface.Enterprise.ts
const createOrgSetupSchema = (t) =>
    z
        .object({
            username: z.string().min(1, t('auth.validation.nameRequired')),
            email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.invalidEmail')),
            password: passwordSchema,
            confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired'))
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('auth.validation.passwordsDontMatch'),
            path: ['confirmPassword']
        })

const setupColors = {
    text: '#102033',
    textDim: 'rgba(16, 32, 51, 0.72)',
    textMute: 'rgba(16, 32, 51, 0.54)',
    panel: 'rgba(248, 251, 255, 0.88)',
    input: 'rgba(255, 255, 255, 0.86)',
    border: 'rgba(15, 23, 42, 0.14)',
    focus: '#14b8a6',
    required: '#e11d48'
}

const setupInputStyles = {
    '& .MuiFormControl-root': {
        mt: 1
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: '14px',
        color: setupColors.text,
        backgroundColor: setupColors.input,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: setupColors.border
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(20, 184, 166, 0.46)'
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: setupColors.focus,
            borderWidth: '1px'
        }
    },
    '& .MuiOutlinedInput-input': {
        color: setupColors.text,
        fontWeight: 600,
        '&:-webkit-autofill': {
            WebkitTextFillColor: setupColors.text,
            caretColor: setupColors.text
        }
    },
    '& .MuiOutlinedInput-input::placeholder': {
        color: setupColors.textMute,
        opacity: 1
    }
}

const OrganizationSetupPage = () => {
    const { t } = useTranslation()
    useNotifier()
    const { isEnterpriseLicensed, isOpenSource } = useConfig()

    const orgNameInput = {
        label: t('auth.organization'),
        name: 'organization',
        type: 'text',
        placeholder: t('auth.organizationName')
    }

    const usernameInput = {
        label: t('auth.administratorName'),
        name: 'username',
        type: 'text',
        placeholder: 'John Doe'
    }

    const passwordInput = {
        label: t('auth.password'),
        name: 'password',
        type: 'password',
        placeholder: '********'
    }

    const confirmPasswordInput = {
        label: t('auth.confirmPassword'),
        name: 'confirmPassword',
        type: 'password',
        placeholder: '********'
    }

    const emailInput = {
        label: t('auth.email'),
        name: 'email',
        type: 'email',
        placeholder: 'user@company.com'
    }

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [username, setUsername] = useState('')
    const [orgName, setOrgName] = useState('')

    const [loading, setLoading] = useState(false)
    const [authError, setAuthError] = useState('')
    const [successMsg, setSuccessMsg] = useState(undefined)

    const loginApi = useApi(authApi.login)
    const registerAccountApi = useApi(accountApi.registerAccount)
    const navigate = useNavigate()

    const getDefaultProvidersApi = useApi(loginMethodApi.getDefaultLoginMethods)
    const [configuredSsoProviders, setConfiguredSsoProviders] = useState([])

    const register = async (event) => {
        event.preventDefault()
        const result = createOrgSetupSchema(t).safeParse({
            orgName,
            username,
            email,
            password,
            confirmPassword
        })
        if (result.success) {
            setLoading(true)
            setAuthError('')

            // Proceed with registration after successful authentication
            const body = {
                user: {
                    name: username,
                    email: email,
                    credential: password
                }
            }
            if (isEnterpriseLicensed) {
                body.organization = {
                    name: orgName
                }
            }
            await registerAccountApi.request(body)
        } else {
            // Handle validation errors
            const errorMessages = result.error.errors.map((error) => error.message)
            setAuthError(errorMessages.join(', '))
        }
    }

    useEffect(() => {
        if (registerAccountApi.error) {
            const errMessage =
                typeof registerAccountApi.error.response.data === 'object'
                    ? registerAccountApi.error.response.data.message
                    : registerAccountApi.error.response.data
            const localizedErrMessage = translateAuthErrorMessage(errMessage, t)
            let finalErrMessage = ''
            if (isEnterpriseLicensed) {
                finalErrMessage = t('auth.registerOrganizationFailed', { message: localizedErrMessage })
            } else {
                finalErrMessage = t('auth.registerAccountFailed', { message: localizedErrMessage })
            }
            setAuthError(finalErrMessage)
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerAccountApi.error])

    useEffect(() => {
        if (!isOpenSource) {
            getDefaultProvidersApi.request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getDefaultProvidersApi.data && getDefaultProvidersApi.data.providers) {
            setConfiguredSsoProviders(getDefaultProvidersApi.data.providers.map((provider) => provider))
        }
    }, [getDefaultProvidersApi.data])

    useEffect(() => {
        if (registerAccountApi.data) {
            setAuthError(undefined)
            setConfirmPassword('')
            setPassword('')
            setUsername('')
            setEmail('')
            setSuccessMsg(registerAccountApi.data.message)
            setTimeout(() => {
                const body = {
                    email,
                    password
                }
                loginApi.request(body)
            }, 1000)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registerAccountApi.data])

    useEffect(() => {
        if (loginApi.data) {
            setLoading(false)
            store.dispatch(loginSuccess(loginApi.data))
            localStorage.setItem('username', loginApi.data.name)
            navigate(location.state?.path || '/')
            //navigate(0)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginApi.data])

    const signInWithSSO = (ssoProvider) => {
        window.location.href = `/api/v1/${ssoProvider}/login`
    }

    return (
        <>
            <Box
                sx={{
                    width: '100%',
                    maxHeight: 'calc(100vh - 48px)',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: { xs: '16px', sm: '24px' },
                    color: setupColors.text
                }}
            >
                <Stack
                    flexDirection='column'
                    sx={{
                        width: { xs: '100%', sm: '520px' },
                        maxWidth: '100%',
                        gap: 2.5,
                        p: { xs: 3, sm: 4 },
                        color: setupColors.text,
                        backgroundColor: setupColors.panel,
                        border: `1px solid ${setupColors.border}`,
                        borderRadius: '8px',
                        boxShadow: '0 24px 70px rgba(15, 23, 42, 0.14)',
                        backdropFilter: 'blur(22px) saturate(1.35)',
                        WebkitBackdropFilter: 'blur(22px) saturate(1.35)'
                    }}
                >
                    {authError && (
                        <Alert icon={<IconExclamationCircle />} variant='filled' severity='error'>
                            {authError.split(', ').length > 0 ? (
                                <List dense sx={{ py: 0 }}>
                                    {authError.split(', ').map((error, index) => (
                                        <ListItemText key={index} primary={error} primaryTypographyProps={{ color: '#fff !important' }} />
                                    ))}
                                </List>
                            ) : (
                                authError
                            )}
                        </Alert>
                    )}
                    {successMsg && (
                        <Alert icon={<IconCircleCheck />} variant='filled' severity='success'>
                            {successMsg}
                        </Alert>
                    )}
                    <Stack sx={{ gap: 1 }}>
                        <Typography variant='h1' sx={{ color: setupColors.text, fontWeight: 800, fontSize: { xs: '2rem', sm: '2.35rem' } }}>
                            {t('auth.setupAccount')}
                        </Typography>
                    </Stack>
                    {(isOpenSource || isEnterpriseLicensed) && (
                        <Typography variant='caption' sx={{ color: setupColors.textDim, fontSize: '0.94rem', lineHeight: 1.7 }}>
                            {t('auth.accountSetupLocalNotice')}
                        </Typography>
                    )}
                    <form onSubmit={register}>
                        <Stack
                            sx={{
                                width: '100%',
                                flexDirection: 'column',
                                alignItems: 'left',
                                justifyContent: 'center',
                                gap: 2,
                                ...setupInputStyles,
                                '& .MuiTypography-root': {
                                    color: setupColors.text
                                },
                                '& .MuiTypography-caption': {
                                    color: setupColors.textDim,
                                    lineHeight: 1.55
                                },
                                '& .MuiDivider-root': {
                                    color: setupColors.textDim,
                                    '&::before, &::after': {
                                        borderColor: setupColors.border
                                    }
                                },
                                '& .MuiChip-root': {
                                    color: setupColors.text,
                                    backgroundColor: 'rgba(20, 184, 166, 0.14)',
                                    border: `1px solid rgba(20, 184, 166, 0.24)`
                                }
                            }}
                        >
                            {isEnterpriseLicensed && (
                                <>
                                    <Box>
                                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                                            <Typography>
                                                {t('auth.organizationName')}
                                                <span style={{ color: setupColors.required }}>&nbsp;*</span>
                                            </Typography>
                                            <div style={{ flexGrow: 1 }}></div>
                                        </div>
                                        <Input
                                            inputParam={orgNameInput}
                                            placeholder={t('auth.organizationName')}
                                            onChange={(newValue) => setOrgName(newValue)}
                                            value={orgName}
                                            showDialog={false}
                                        />
                                    </Box>
                                    <Box>
                                        <Divider>
                                            <Chip label={t('auth.accountAdministrator')} size='small' />
                                        </Divider>
                                    </Box>
                                </>
                            )}
                            <Box>
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <Typography>
                                        {t('auth.administratorName')}
                                        <span style={{ color: setupColors.required }}>&nbsp;*</span>
                                    </Typography>
                                    <div style={{ flexGrow: 1 }}></div>
                                </div>
                                <Input
                                    inputParam={usernameInput}
                                    placeholder={t('auth.displayName')}
                                    onChange={(newValue) => setUsername(newValue)}
                                    value={username}
                                    showDialog={false}
                                />
                                <Typography variant='caption'>
                                    <i>{t('auth.displayNameHint')}</i>
                                </Typography>
                            </Box>
                            <Box>
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <Typography>
                                        {t('auth.administratorEmail')}
                                        <span style={{ color: setupColors.required }}>&nbsp;*</span>
                                    </Typography>
                                    <div style={{ flexGrow: 1 }}></div>
                                </div>
                                <Input
                                    inputParam={emailInput}
                                    onChange={(newValue) => setEmail(newValue)}
                                    type='email'
                                    value={email}
                                    showDialog={false}
                                />
                                <Typography variant='caption'>
                                    <i>{t('auth.emailHint')}</i>
                                </Typography>
                            </Box>
                            <Box>
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <Typography>
                                        {t('auth.password')}
                                        <span style={{ color: setupColors.required }}>&nbsp;*</span>
                                    </Typography>
                                    <div style={{ flexGrow: 1 }}></div>
                                </div>
                                <Input inputParam={passwordInput} onChange={(newValue) => setPassword(newValue)} value={password} />
                                <Typography variant='caption'>
                                    <i>{t('auth.passwordRule')}</i>
                                </Typography>
                            </Box>
                            <Box>
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <Typography>
                                        {t('auth.confirmPassword')}
                                        <span style={{ color: setupColors.required }}>&nbsp;*</span>
                                    </Typography>
                                    <div style={{ flexGrow: 1 }}></div>
                                </div>
                                <Input
                                    inputParam={confirmPasswordInput}
                                    onChange={(newValue) => setConfirmPassword(newValue)}
                                    value={confirmPassword}
                                />
                                <Typography variant='caption'>
                                    <i>{t('auth.confirmPasswordHint')}</i>
                                </Typography>
                            </Box>
                            <StyledButton
                                variant='contained'
                                sx={{
                                    borderRadius: '999px',
                                    height: 48,
                                    mt: 0.5,
                                    color: '#042f2e',
                                    fontWeight: 800,
                                    backgroundColor: 'rgba(20, 184, 166, 0.24)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(20, 184, 166, 0.32)'
                                    }
                                }}
                                type='submit'
                            >
                                {t('auth.signUp')}
                            </StyledButton>
                            {configuredSsoProviders && configuredSsoProviders.length > 0 && (
                                <Divider sx={{ width: '100%' }}>{t('auth.or')}</Divider>
                            )}
                            {configuredSsoProviders &&
                                configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        //https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps
                                        ssoProvider === 'azure' && (
                                            <Button
                                                key={ssoProvider}
                                                variant='outlined'
                                                style={{ borderRadius: 12, height: 45, marginRight: 5, lineHeight: 0 }}
                                                onClick={() => signInWithSSO(ssoProvider)}
                                                startIcon={
                                                    <Icon>
                                                        <img src={AzureSSOLoginIcon} alt={'MicrosoftSSO'} width={20} height={20} />
                                                    </Icon>
                                                }
                                            >
                                                {t('auth.signUpWithMicrosoft')}
                                            </Button>
                                        )
                                )}
                            {configuredSsoProviders &&
                                configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        ssoProvider === 'google' && (
                                            <Button
                                                key={ssoProvider}
                                                variant='outlined'
                                                style={{ borderRadius: 12, height: 45, marginRight: 5, lineHeight: 0 }}
                                                onClick={() => signInWithSSO(ssoProvider)}
                                                startIcon={
                                                    <Icon>
                                                        <img src={GoogleSSOLoginIcon} alt={'GoogleSSO'} width={20} height={20} />
                                                    </Icon>
                                                }
                                            >
                                                {t('auth.signUpWithGoogle')}
                                            </Button>
                                        )
                                )}
                            {configuredSsoProviders &&
                                configuredSsoProviders.map(
                                    (ssoProvider) =>
                                        ssoProvider === 'auth0' && (
                                            <Button
                                                key={ssoProvider}
                                                variant='outlined'
                                                style={{ borderRadius: 12, height: 45, marginRight: 5, lineHeight: 0 }}
                                                onClick={() => signInWithSSO(ssoProvider)}
                                                startIcon={
                                                    <Icon>
                                                        <img src={Auth0SSOLoginIcon} alt={'Auth0SSO'} width={20} height={20} />
                                                    </Icon>
                                                }
                                            >
                                                {t('auth.signUpWithAuth0')}
                                            </Button>
                                        )
                                )}
                        </Stack>
                    </form>
                </Stack>
            </Box>
            {loading && <BackdropLoader open={loading} />}
        </>
    )
}

export default OrganizationSetupPage
