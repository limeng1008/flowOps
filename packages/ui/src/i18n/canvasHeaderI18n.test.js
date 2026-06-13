const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

describe('canvas header i18n', () => {
    it('routes the embed/API dialog title through chatflow translations', () => {
        const canvasHeaderSource = fs.readFileSync(path.join(__dirname, '../views/canvas/CanvasHeader.jsx'), 'utf8')

        expect(en.pages.chatflows.embedApiTitle).toBe('Embed in website or use as API')
        expect(zh.pages.chatflows.embedApiTitle).toBe('嵌入网站或作为 API 使用')
        expect(canvasHeaderSource).toContain("title: t('pages.chatflows.embedApiTitle')")
        expect(canvasHeaderSource).not.toContain("title: 'Embed in website or use as API'")
    })
})
