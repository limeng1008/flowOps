import { useSelector } from 'react-redux'

import BrandLogo from '@/ui-component/extended/BrandLogo'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
            <BrandLogo tone={customization.isDarkMode ? 'onDark' : 'onLight'} width={150} />
        </div>
    )
}

export default Logo
