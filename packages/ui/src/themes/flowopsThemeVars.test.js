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
        expect(flowopsVars).toContain('$brandPrimary: #7c3aed;')
        expect(flowopsVars).toContain('$brandFontFamily:')
        expect(flowopsVars).toContain('$primaryMain: #7c3aed;')
        expect(flowopsVars).toContain('$secondaryMain: #14b8a6;')
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
        expect(flowopsVars).toContain('$glassBlur:')

        expect(palette).toContain('glass:')
        expect(palette).toContain('surface:')
        expect(palette).toContain('blur:')

        expect(overrides).toContain('backdropFilter')
        expect(overrides).toContain('WebkitBackdropFilter')
    })
})
