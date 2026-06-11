import PropTypes from 'prop-types'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { IconCheck, IconCopy } from '@tabler/icons-react'

import { buildCronExpression, describeCronPreset, presetFromCron } from './cronBuilderUtils'

const modeOptions = ['daily', 'weekly', 'monthly', 'hourly']
const weekdayOptions = [
    { value: 0, key: 'sunday' },
    { value: 1, key: 'monday' },
    { value: 2, key: 'tuesday' },
    { value: 3, key: 'wednesday' },
    { value: 4, key: 'thursday' },
    { value: 5, key: 'friday' },
    { value: 6, key: 'saturday' }
]

const CronBuilderDialog = ({ open, initialValue, onApply, onClose }) => {
    const { t } = useTranslation()
    const [preset, setPreset] = useState(() => presetFromCron(initialValue))
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (open) {
            setPreset(presetFromCron(initialValue))
            setCopied(false)
        }
    }, [initialValue, open])

    const selectedWeekdayLabel = weekdayOptions.find((option) => option.value === Number(preset.dayOfWeek))?.key || 'monday'
    const description = describeCronPreset(
        {
            ...preset,
            dayOfWeekLabel: t(`canvas.cronBuilder.weekdays.${selectedWeekdayLabel}`)
        },
        t
    )
    const cron = useMemo(() => buildCronExpression(preset), [preset])

    const updatePreset = (key, value) => setPreset((current) => ({ ...current, [key]: value }))

    const handleCopy = () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) return
        navigator.clipboard.writeText(cron).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }

    const handleApply = () => {
        onApply(cron)
        onClose()
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle>{t('canvas.cronBuilder.title')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <FormControl fullWidth size='small'>
                        <InputLabel id='cron-builder-mode-label'>{t('canvas.cronBuilder.mode')}</InputLabel>
                        <Select
                            labelId='cron-builder-mode-label'
                            value={preset.mode}
                            label={t('canvas.cronBuilder.mode')}
                            onChange={(event) => updatePreset('mode', event.target.value)}
                        >
                            {modeOptions.map((mode) => (
                                <MenuItem key={mode} value={mode}>
                                    {t(`canvas.cronBuilder.${mode}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {preset.mode !== 'hourly' && (
                        <TextField
                            fullWidth
                            size='small'
                            type='time'
                            label={t('canvas.cronBuilder.time')}
                            value={preset.time || '09:00'}
                            onChange={(event) => updatePreset('time', event.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    )}

                    {preset.mode === 'weekly' && (
                        <FormControl fullWidth size='small'>
                            <InputLabel id='cron-builder-weekday-label'>{t('canvas.cronBuilder.dayOfWeek')}</InputLabel>
                            <Select
                                labelId='cron-builder-weekday-label'
                                value={preset.dayOfWeek}
                                label={t('canvas.cronBuilder.dayOfWeek')}
                                onChange={(event) => updatePreset('dayOfWeek', Number(event.target.value))}
                            >
                                {weekdayOptions.map((day) => (
                                    <MenuItem key={day.value} value={day.value}>
                                        {t(`canvas.cronBuilder.weekdays.${day.key}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {preset.mode === 'monthly' && (
                        <TextField
                            fullWidth
                            size='small'
                            type='number'
                            label={t('canvas.cronBuilder.dayOfMonth')}
                            value={preset.dayOfMonth || 1}
                            onChange={(event) => updatePreset('dayOfMonth', event.target.value)}
                            inputProps={{ min: 1, max: 31 }}
                        />
                    )}

                    {preset.mode === 'hourly' && (
                        <TextField
                            fullWidth
                            size='small'
                            type='number'
                            label={t('canvas.cronBuilder.everyHours')}
                            value={preset.everyHours || 1}
                            onChange={(event) => updatePreset('everyHours', event.target.value)}
                            inputProps={{ min: 1, max: 24 }}
                        />
                    )}

                    <Alert severity='info'>{description}</Alert>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            px: 1.5,
                            py: 1
                        }}
                    >
                        <Typography variant='caption' color='text.secondary'>
                            {t('canvas.cronBuilder.generated')}
                        </Typography>
                        <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: 14 }}>{cron}</Typography>
                        <Tooltip title={copied ? t('canvas.cronBuilder.copied') : t('canvas.cronBuilder.copy')}>
                            <IconButton size='small' onClick={handleCopy}>
                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.cancel')}</Button>
                <Button variant='contained' onClick={handleApply}>
                    {t('canvas.cronBuilder.apply')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

CronBuilderDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    initialValue: PropTypes.string,
    onApply: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
}

export default CronBuilderDialog
