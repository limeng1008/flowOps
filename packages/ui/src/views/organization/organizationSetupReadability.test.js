const fs = require('fs')
const path = require('path')

describe('organization setup readability', () => {
    const source = fs.readFileSync(path.join(__dirname, 'index.jsx'), 'utf8')

    it('pins high-contrast text, panel, and input styles on the auth background', () => {
        expect(source).toContain('const setupColors')
        expect(source).toContain("text: '#102033'")
        expect(source).toContain('color: setupColors.text')
        expect(source).toContain('color: setupColors.textDim')
        expect(source).toContain('backgroundColor: setupColors.panel')
        expect(source).toContain('& .MuiOutlinedInput-input::placeholder')
    })
})
