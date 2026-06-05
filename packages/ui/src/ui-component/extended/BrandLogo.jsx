import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import logo from '@/assets/images/flowops-logo.svg'
import logoInverse from '@/assets/images/flowops-logo-inverse.svg'
import logoMark from '@/assets/images/flowops-logo-mark.svg'

const BrandLogo = ({ variant = 'wordmark', tone = 'onLight', width = 150, sx, alt = 'FlowOps', ...rest }) => {
    const src = variant === 'mark' ? logoMark : tone === 'onDark' ? logoInverse : logo

    return <Box component='img' src={src} alt={alt} sx={{ display: 'block', width, height: 'auto', ...sx }} {...rest} />
}

BrandLogo.propTypes = {
    variant: PropTypes.oneOf(['wordmark', 'mark']),
    tone: PropTypes.oneOf(['onLight', 'onDark']),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object]),
    sx: PropTypes.object,
    alt: PropTypes.string
}

export default BrandLogo
