const fs = require('fs')
const path = require('path')

describe('FlowOps theme variables', () => {
    it('loads fork-owned color tokens from the FlowOps SCSS module', () => {
        const themeEntry = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8')
        const flowopsVarsPath = path.join(__dirname, '../assets/scss/_flowops-vars.module.scss')

        expect(themeEntry).toContain('_flowops-vars.module.scss')
        expect(themeEntry).not.toContain('_themes-vars.module.scss')
        expect(fs.existsSync(flowopsVarsPath)).toBe(true)

        const flowopsVars = fs.readFileSync(flowopsVarsPath, 'utf8')
        expect(flowopsVars).toContain('$brandPrimary: #0a84ff;')
        expect(flowopsVars).toContain('$brandFontFamily:')
        expect(flowopsVars).toContain('$primaryMain: #0a84ff;')
        expect(flowopsVars).toContain('$secondaryMain: #00c7be;')
        expect(flowopsVars).toContain('$darkBackground: #08111f;')
    })

    it('exposes liquid glass surface tokens through the FlowOps theme layer', () => {
        const flowopsVarsPath = path.join(__dirname, '../assets/scss/_flowops-vars.module.scss')
        const palettePath = path.join(__dirname, 'palette.js')
        const overridePath = path.join(__dirname, 'compStyleOverride.js')

        const flowopsVars = fs.readFileSync(flowopsVarsPath, 'utf8')
        const palette = fs.readFileSync(palettePath, 'utf8')
        const overrides = fs.readFileSync(overridePath, 'utf8')

        expect(flowopsVars).toContain('$glassLightSurface:')
        expect(flowopsVars).toContain('$glassDarkSurface:')
        expect(flowopsVars).toContain('$glassBorder:')
        expect(flowopsVars).toContain('$glassControlSurface:')
        expect(flowopsVars).toContain('$glassAccent:')
        expect(flowopsVars).toContain('$glassBlur:')

        expect(palette).toContain('glass:')
        expect(palette).toContain('surface:')
        expect(palette).toContain('control:')
        expect(palette).toContain('accent:')
        expect(palette).toContain('blur:')

        expect(overrides).toContain('backdropFilter')
        expect(overrides).toContain('WebkitBackdropFilter')
    })
})
