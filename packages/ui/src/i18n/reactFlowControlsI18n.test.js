const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')

describe('React Flow controls i18n', () => {
    it('has localized labels for built-in canvas controls', () => {
        const keys = ['zoomIn', 'zoomOut', 'fitView', 'toggleInteractivity']

        keys.forEach((key) => {
            expect(en.canvas.controls[key]).toBeTruthy()
            expect(zh.canvas.controls[key]).toBeTruthy()
        })
        expect(zh.canvas.controls.toggleInteractivity).toBe('切换交互')
    })

    it('routes every canvas React Flow controls instance through localized controls', () => {
        const sources = [
            read('views/canvas/index.jsx'),
            read('views/marketplaces/MarketplaceCanvas.jsx'),
            read('views/agentflowsv2/Canvas.jsx'),
            read('views/agentflowsv2/MarketplaceCanvas.jsx')
        ]
        const localizedControlsSource = read('ui-component/canvas/LocalizedControls.jsx')

        sources.forEach((source) => {
            expect(source).toContain('<LocalizedControls')
            expect(source).not.toContain('<Controls')
        })
        expect(localizedControlsSource).toContain("title={t('canvas.controls.zoomIn')}")
        expect(localizedControlsSource).toContain("title={t('canvas.controls.zoomOut')}")
        expect(localizedControlsSource).toContain("title={t('canvas.controls.fitView')}")
        expect(localizedControlsSource).toContain("title={t('canvas.controls.toggleInteractivity')}")
        expect(localizedControlsSource).toContain('showZoom={false}')
        expect(localizedControlsSource).toContain('showFitView={false}')
        expect(localizedControlsSource).toContain('showInteractive={false}')
    })

    it('uses React Flow control buttons for custom snapping and background controls', () => {
        const sources = [
            read('views/canvas/index.jsx'),
            read('views/marketplaces/MarketplaceCanvas.jsx'),
            read('views/agentflowsv2/Canvas.jsx'),
            read('views/agentflowsv2/MarketplaceCanvas.jsx')
        ]

        sources.forEach((source) => {
            expect(source).toContain('ControlButton')
            expect(source).not.toContain("<button\n                                        className='react-flow__controls-button")
            expect(source).toContain('setIsSnappingEnabled((isEnabled) => !isEnabled)')
            expect(source).toContain('setIsBackgroundEnabled((isEnabled) => !isEnabled)')
        })
    })
})
