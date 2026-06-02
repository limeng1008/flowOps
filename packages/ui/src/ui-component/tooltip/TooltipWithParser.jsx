import { Info } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'
import parser from 'html-react-parser'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { translateNodeTooltip } from '@/i18n/nodeI18n'

export const TooltipWithParser = ({ title, sx }) => {
    const customization = useSelector((state) => state.customization)
    const { i18n } = useTranslation()
    const currentLang = i18n.resolvedLanguage || i18n.language
    const translatedTitle = translateNodeTooltip(title, currentLang)
    const parsedTitle = typeof translatedTitle === 'string' ? parser(translatedTitle) : translatedTitle

    return (
        <Tooltip title={parsedTitle} placement='right'>
            <IconButton sx={{ height: 15, width: 15, ml: 2, mt: -0.5 }}>
                <Info
                    sx={{
                        ...sx,
                        background: 'transparent',
                        color: customization.isDarkMode ? 'white' : 'inherit',
                        height: 15,
                        width: 15
                    }}
                />
            </IconButton>
        </Tooltip>
    )
}

TooltipWithParser.propTypes = {
    title: PropTypes.node,
    sx: PropTypes.any
}
