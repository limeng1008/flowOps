const clampNumber = (value, min, max, fallback) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, Math.floor(parsed)))
}

const parseTime = (time) => {
    const [hourRaw, minuteRaw] = String(time || '09:00').split(':')
    return {
        hour: clampNumber(hourRaw, 0, 23, 9),
        minute: clampNumber(minuteRaw, 0, 59, 0)
    }
}

const formatTime = (time) => {
    const { hour, minute } = parseTime(time)
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const normalizeDayOfWeek = (value) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 1
    if (parsed < 0 || parsed > 6) return 0
    return Math.floor(parsed)
}

export const buildCronExpression = (preset) => {
    const mode = preset?.mode || 'daily'

    if (mode === 'hourly') {
        const everyHours = clampNumber(preset?.everyHours, 1, 24, 1)
        return `0 */${everyHours} * * *`
    }

    const { hour, minute } = parseTime(preset?.time)

    if (mode === 'weekly') {
        const dayOfWeek = normalizeDayOfWeek(preset?.dayOfWeek)
        return `${minute} ${hour} * * ${dayOfWeek}`
    }

    if (mode === 'monthly') {
        const dayOfMonth = clampNumber(preset?.dayOfMonth, 1, 31, 1)
        return `${minute} ${hour} ${dayOfMonth} * *`
    }

    return `${minute} ${hour} * * *`
}

export const describeCronPreset = (preset, t) => {
    const mode = preset?.mode || 'daily'
    if (mode === 'hourly') {
        return t('canvas.cronBuilder.description.hourly', {
            hours: clampNumber(preset?.everyHours, 1, 24, 1)
        })
    }
    if (mode === 'weekly') {
        return t('canvas.cronBuilder.description.weekly', {
            day: preset?.dayOfWeekLabel || String(normalizeDayOfWeek(preset?.dayOfWeek)),
            time: formatTime(preset?.time)
        })
    }
    if (mode === 'monthly') {
        return t('canvas.cronBuilder.description.monthly', {
            day: clampNumber(preset?.dayOfMonth, 1, 31, 1),
            time: formatTime(preset?.time)
        })
    }
    return t('canvas.cronBuilder.description.daily', { time: formatTime(preset?.time) })
}

export const presetFromCron = (cron) => {
    const parts = String(cron || '')
        .trim()
        .split(/\s+/)
    if (parts.length !== 5) return { mode: 'daily', time: '09:00', dayOfWeek: 1, dayOfMonth: 1, everyHours: 1 }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    if (minute === '0' && /^\*\/\d+$/.test(hour) && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return { mode: 'hourly', everyHours: clampNumber(hour.slice(2), 1, 24, 1), time: '09:00', dayOfWeek: 1, dayOfMonth: 1 }
    }

    const time = `${String(clampNumber(hour, 0, 23, 9)).padStart(2, '0')}:${String(clampNumber(minute, 0, 59, 0)).padStart(2, '0')}`
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
        return { mode: 'weekly', time, dayOfWeek: normalizeDayOfWeek(dayOfWeek), dayOfMonth: 1, everyHours: 1 }
    }
    if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
        return { mode: 'monthly', time, dayOfMonth: clampNumber(dayOfMonth, 1, 31, 1), dayOfWeek: 1, everyHours: 1 }
    }
    return { mode: 'daily', time, dayOfWeek: 1, dayOfMonth: 1, everyHours: 1 }
}
