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
})
