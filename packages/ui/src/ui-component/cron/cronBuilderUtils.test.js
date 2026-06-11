describe('CronBuilder utils', () => {
    it('builds a daily cron expression at 09:00', async () => {
        const { buildCronExpression, describeCronPreset } = await import('./cronBuilderUtils.js')

        const preset = { mode: 'daily', time: '09:00' }
        expect(buildCronExpression(preset)).toBe('0 9 * * *')
        expect(describeCronPreset(preset, (key, vars) => `${key}:${vars?.time ?? ''}`)).toBe('canvas.cronBuilder.description.daily:09:00')
    })

    it('builds a weekly cron expression for Monday 09:30', async () => {
        const { buildCronExpression } = await import('./cronBuilderUtils.js')

        expect(buildCronExpression({ mode: 'weekly', dayOfWeek: 1, time: '09:30' })).toBe('30 9 * * 1')
    })

    it('builds a monthly cron expression for the 15th at 18:45', async () => {
        const { buildCronExpression } = await import('./cronBuilderUtils.js')

        expect(buildCronExpression({ mode: 'monthly', dayOfMonth: 15, time: '18:45' })).toBe('45 18 15 * *')
    })

    it('builds an every-N-hours cron expression', async () => {
        const { buildCronExpression } = await import('./cronBuilderUtils.js')

        expect(buildCronExpression({ mode: 'hourly', everyHours: 6 })).toBe('0 */6 * * *')
    })

    it('normalizes invalid numeric inputs into safe cron ranges', async () => {
        const { buildCronExpression } = await import('./cronBuilderUtils.js')

        expect(buildCronExpression({ mode: 'weekly', dayOfWeek: 9, time: '99:99' })).toBe('59 23 * * 0')
        expect(buildCronExpression({ mode: 'monthly', dayOfMonth: 99, time: '08:15' })).toBe('15 8 31 * *')
        expect(buildCronExpression({ mode: 'hourly', everyHours: 99 })).toBe('0 */24 * * *')
    })
})
