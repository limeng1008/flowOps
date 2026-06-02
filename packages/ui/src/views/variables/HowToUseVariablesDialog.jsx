import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { CodeEditor } from '@/ui-component/editor/CodeEditor'

const overrideConfig = `{
    overrideConfig: {
        vars: {
            var1: 'abc'
        }
    }
}`

const HowToUseVariablesDialog = ({ show, onCancel }) => {
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
                {t('pages.variables.howToUseDialog.title')}
            </DialogTitle>
            <DialogContent>
                <p style={{ marginBottom: '10px' }}>{t('pages.variables.howToUseDialog.customUsage')}</p>
                <CodeEditor
                    disabled={true}
                    value={`$vars.<variable-name>`}
                    height={'50px'}
                    theme={'dark'}
                    lang={'js'}
                    basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
                />
                <p style={{ marginBottom: '10px' }}>{t('pages.variables.howToUseDialog.textFieldUsage')}</p>
                <CodeEditor
                    disabled={true}
                    value={t('pages.variables.howToUseDialog.textFieldExample')}
                    height={'50px'}
                    theme={'dark'}
                    lang={'js'}
                    basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
                />
                <p style={{ marginBottom: '10px' }}>{t('pages.variables.howToUseDialog.typeUsage')}</p>
                <p style={{ marginBottom: '10px' }}>
                    {t('pages.variables.howToUseDialog.overrideUsagePrefix')} <b>vars</b>
                    {t('pages.variables.howToUseDialog.overrideUsageSuffix')}
                </p>
                <CodeEditor
                    disabled={true}
                    value={overrideConfig}
                    height={'170px'}
                    theme={'dark'}
                    lang={'js'}
                    basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
                />
                <p>
                    {t('pages.variables.howToUseDialog.readMore')}{' '}
                    <a target='_blank' rel='noreferrer' href='https://docs.flowiseai.com/using-flowise/variables'>
                        {t('pages.variables.howToUseDialog.docs')}
                    </a>
                </p>
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

HowToUseVariablesDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func
}

export default HowToUseVariablesDialog
