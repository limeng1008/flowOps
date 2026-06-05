import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { store } from '@/store'
import { loginSuccess } from '@/store/reducers/authSlice'
import authApi from '@/api/auth'
import { getPostLoginRedirectPath } from './loginRedirect'

const SSOSuccess = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { t } = useTranslation()

    useEffect(() => {
        const run = async () => {
            const queryParams = new URLSearchParams(location.search)
            const token = queryParams.get('token')

            if (token) {
                try {
                    const user = await authApi.ssoSuccess(token)
                    if (user) {
                        if (user.status === 200) {
                            store.dispatch(loginSuccess(user.data))
                            navigate(getPostLoginRedirectPath())
                        } else {
                            navigate('/login')
                        }
                    } else {
                        navigate('/login')
                    }
                } catch (error) {
                    navigate('/login')
                }
            }
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search])

    return (
        <div>
            <h1>{t('auth.ssoLoadingDashboard')}</h1>
            <p>{t('auth.ssoLoadingData')}</p>
        </div>
    )
}

export default SSOSuccess
