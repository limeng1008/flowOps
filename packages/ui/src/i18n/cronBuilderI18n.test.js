const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)
const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')

const requiredKeys = [
    'canvas.cronBuilder.open',
    'canvas.cronBuilder.title',
    'canvas.cronBuilder.mode',
    'canvas.cronBuilder.daily',
    'canvas.cronBuilder.weekly',
    'canvas.cronBuilder.monthly',
    'canvas.cronBuilder.hourly',
    'canvas.cronBuilder.time',
    'canvas.cronBuilder.dayOfWeek',
    'canvas.cronBuilder.dayOfMonth',
    'canvas.cronBuilder.everyHours',
    'canvas.cronBuilder.generated',
    'canvas.cronBuilder.apply',
    'canvas.cronBuilder.copy',
    'canvas.cronBuilder.copied',
    'canvas.cronBuilder.description.daily',
    'canvas.cronBuilder.description.weekly',
    'canvas.cronBuilder.description.monthly',
    'canvas.cronBuilder.description.hourly'
]

describe('CronBuilder i18n and canvas integration', () => {
    it.each(requiredKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('integrates CronBuilder with the schedule cron expression field only', () => {
        const nodeInputSource = read('views/canvas/NodeInputHandler.jsx')
        const dialogSource = read('ui-component/cron/CronBuilderDialog.jsx')

        expect(nodeInputSource).toContain("import CronBuilderDialog from '@/ui-component/cron/CronBuilderDialog'")
        expect(nodeInputSource).toContain("inputParam.name === 'scheduleCronExpression'")
        expect(nodeInputSource).toContain('setShowCronBuilderDialog(true)')
        expect(nodeInputSource).toContain('onApply={(cron) =>')
        expect(dialogSource).toContain("t('canvas.cronBuilder.title')")
        expect(dialogSource).toContain('buildCronExpression')
        expect(dialogSource).not.toContain('Daily')
        expect(dialogSource).not.toContain('Weekly')
        expect(dialogSource).not.toContain('Monthly')
    })
})
