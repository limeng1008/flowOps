const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')
const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

const requiredKeys = [
    'pages.schedule.badgeChecking',
    'pages.schedule.badgeActive',
    'pages.schedule.badgeActiveNextRun',
    'pages.schedule.badgePaused',
    'pages.schedule.badgeLoading',
    'pages.schedule.badgeScheduled',
    'pages.schedule.badgePausedShort',
    'pages.schedule.resizeDrawer',
    'pages.schedule.selectAllRowsOnPage',
    'pages.schedule.selectRow',
    'pages.webhookListener.resizePanel',
    'common.close'
]

describe('trigger activation i18n coverage', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('localizes schedule status badge copy', () => {
        const source = read('ui-component/extended/ScheduleStatusBadge.jsx')

        expect(source).toContain('const { t, i18n } = useTranslation()')
        expect(source).toContain("t('pages.schedule.badgeChecking')")
        expect(source).toContain("t('pages.schedule.badgeActiveNextRun'")
        expect(source).toContain("t('pages.schedule.badgeScheduled')")
        expect(source).not.toContain('Checking schedule status')
        expect(source).not.toContain('Schedule active')
        expect(source).not.toContain('Schedule configured but turned off')
        expect(source).not.toContain("? 'Loading…'")
        expect(source).not.toContain("? 'Scheduled'")
        expect(source).not.toContain(": 'Paused'")
    })

    it('localizes schedule and webhook drawer accessibility labels', () => {
        const scheduleDrawerSource = read('views/schedule/ScheduleHistoryDrawer.jsx')
        const webhookDrawerSource = read('views/webhooklistener/WebhookListenerDrawer.jsx')

        expect(scheduleDrawerSource).toContain("aria-label={t('pages.schedule.resizeDrawer')}")
        expect(scheduleDrawerSource).toContain("aria-label={t('common.close')}")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.selectAllRowsOnPage')")
        expect(scheduleDrawerSource).toContain("t('pages.schedule.selectRow'")
        expect(scheduleDrawerSource).not.toContain("aria-label='Resize drawer'")
        expect(scheduleDrawerSource).not.toContain("aria-label='Select all rows on page'")
        expect(scheduleDrawerSource).not.toContain('`Select row ${row.id}`')

        expect(webhookDrawerSource).toContain("aria-label={t('pages.webhookListener.resizePanel')}")
        expect(webhookDrawerSource).toContain("aria-label={t('common.close')}")
        expect(webhookDrawerSource).not.toContain("aria-label='Resize panel'")
    })
})
