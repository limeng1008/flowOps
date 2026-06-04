import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@mui/material'

const HowToUseFunctionDialog = ({ show, onCancel }) => {
    const { t } = useTranslation()
    const portalElement = document.getElementById('portal')

    const component = show ? (
        <Dialog
            onClose={onCancel}
            open={show}
            fullWidth
            maxWidth='sm'
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                {t('pages.tools.howToUseFunctionDialog.title')}
            </DialogTitle>
            <DialogContent>
                <ul>
                    <li style={{ marginTop: 10 }}>{t('pages.tools.howToUseFunctionDialog.libraries')}</li>
                    <li style={{ marginTop: 10 }}>
                        {t('pages.tools.howToUseFunctionDialog.schemaVariables')}
                        <ul style={{ marginTop: 10 }}>
                            <li>
                                {t('pages.tools.howToUseFunctionDialog.propertyLabel')} = <code>userid</code>
                            </li>
                            <li>
                                {t('pages.tools.howToUseFunctionDialog.variableLabel')} = <code>$userid</code>
                            </li>
                        </ul>
                    </li>
                    <li style={{ marginTop: 10 }}>
                        {t('pages.tools.howToUseFunctionDialog.flowConfig')}
                        <ul style={{ marginTop: 10 }}>
                            <li>
                                <code>$flow.sessionId</code>
                            </li>
                            <li>
                                <code>$flow.chatId</code>
                            </li>
                            <li>
                                <code>$flow.chatflowId</code>
                            </li>
                            <li>
                                <code>$flow.input</code>
                            </li>
                            <li>
                                <code>$flow.state</code>
                            </li>
                        </ul>
                    </li>
                    <li style={{ marginTop: 10 }}>
                        {t('pages.tools.howToUseFunctionDialog.customVariables')}&nbsp;<code>{`$vars.<variable-name>`}</code>
                    </li>
                    <li style={{ marginTop: 10 }}>{t('pages.tools.howToUseFunctionDialog.returnString')}</li>
                </ul>
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

HowToUseFunctionDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func
}

export default HowToUseFunctionDialog
