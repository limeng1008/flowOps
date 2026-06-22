import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import logo from '@/assets/images/flowops-logo.svg'
import logoInverse from '@/assets/images/flowops-logo-inverse.svg'
import logoMark from '@/assets/images/flowops-logo-mark.svg'
import { useConfig } from '@/store/context/ConfigContext'

const BrandLogo = ({ variant = 'wordmark', tone = 'onLight', width = 150, sx, alt, ...rest }) => {
    const { brand } = useConfig() || {}
    const defaultSrc = variant === 'mark' ? logoMark : tone === 'onDark' ? logoInverse : logo
    // 白标:配置了 brand.logoUrl 则覆盖内置 Logo;alt 用品牌名
    const src = brand?.logoUrl || defaultSrc
    const altText = alt || brand?.name || 'FlowOps'

    return <Box component='img' src={src} alt={altText} sx={{ display: 'block', width, height: 'auto', ...sx }} {...rest} />
}

BrandLogo.propTypes = {
    variant: PropTypes.oneOf(['wordmark', 'mark']),
    tone: PropTypes.oneOf(['onLight', 'onDark']),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object]),
    sx: PropTypes.object,
    alt: PropTypes.string
}

export default BrandLogo
