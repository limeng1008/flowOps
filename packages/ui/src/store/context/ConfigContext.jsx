import platformsettingsApi from '@/api/platformsettings'
import PropTypes from 'prop-types'
import { createContext, useContext, useEffect, useState } from 'react'

const ConfigContext = createContext()

// 内置默认品牌(与后端 DEFAULT_FLOWOPS_BRAND 对齐)。空串=中性,UI 据此隐藏入口/显示「联系管理员」。
export const DEFAULT_FLOWOPS_BRAND = { name: 'FlowOps', supportEmail: '', repoUrl: '', primaryColor: '', logoUrl: '' }

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(true)
    const [isEnterpriseLicensed, setEnterpriseLicensed] = useState(false)
    const [isCloud, setCloudLicensed] = useState(false)
    const [isOpenSource, setOpenSource] = useState(false)
    const [flowOpsEdition, setFlowOpsEdition] = useState('private')
    const [brand, setBrand] = useState(DEFAULT_FLOWOPS_BRAND)

    useEffect(() => {
        const userSettings = platformsettingsApi.getSettings()
        Promise.all([userSettings])
            .then(([currentSettingsData]) => {
                const finalData = {
                    ...currentSettingsData.data
                }
                const edition =
                    finalData.FLOWOPS_EDITION || finalData.EDITION || (finalData.PLATFORM_TYPE === 'cloud' ? 'cloud' : 'private')
                setConfig(finalData)
                setBrand({ ...DEFAULT_FLOWOPS_BRAND, ...(finalData.BRAND || {}) })
                setFlowOpsEdition(edition === 'cloud' ? 'cloud' : 'private')
                if (finalData.PLATFORM_TYPE) {
                    if (finalData.PLATFORM_TYPE === 'enterprise') {
                        setEnterpriseLicensed(true)
                        setCloudLicensed(false)
                        setOpenSource(false)
                    } else if (finalData.PLATFORM_TYPE === 'cloud') {
                        setCloudLicensed(true)
                        setEnterpriseLicensed(false)
                        setOpenSource(false)
                    } else {
                        setOpenSource(true)
                        setEnterpriseLicensed(false)
                        setCloudLicensed(false)
                    }
                }

                setLoading(false)
            })
            .catch((error) => {
                console.error('Error fetching data:', error)
                setLoading(false)
            })
    }, [])

    return (
        <ConfigContext.Provider value={{ config, loading, isEnterpriseLicensed, isCloud, isOpenSource, flowOpsEdition, brand }}>
            {children}
        </ConfigContext.Provider>
    )
}

export const useConfig = () => useContext(ConfigContext)

ConfigProvider.propTypes = {
    children: PropTypes.any
}
