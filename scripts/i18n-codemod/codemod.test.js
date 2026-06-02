const assert = require('assert')
const path = require('path')

const { buildLocaleDictionary, transformSource } = require('./index')

const repoRoot = path.resolve(__dirname, '../..')

const dictionary = buildLocaleDictionary({
    enPath: path.join(repoRoot, 'packages/ui/src/i18n/locales/en.json'),
    zhPath: path.join(repoRoot, 'packages/ui/src/i18n/locales/zh.json')
})

const source = `import Button from '@mui/material/Button'

const Example = () => (
    <div>
        <input placeholder='Search Credentials' />
        <Button title='Save'>Add Credential</Button>
    </div>
)

export default Example
`

const firstPass = transformSource(source, { dictionary, filename: 'Example.jsx' })

assert.strictEqual(firstPass.changed, true)
assert.match(firstPass.code, /import \{ useTranslation \} from ['"]react-i18next['"]/)
assert.match(firstPass.code, /const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\)/)
assert.match(firstPass.code, /placeholder=\{t\(['"]pages.credentials.searchPlaceholder['"]\)\}/)
assert.match(firstPass.code, /title=\{t\(['"]common.save['"]\)\}/)
assert.match(firstPass.code, /<Button title=\{t\(['"]common.save['"]\)\}>\{t\(['"]pages.credentials.addButton['"]\)\}<\/Button>/)

const secondPass = transformSource(firstPass.code, { dictionary, filename: 'Example.jsx' })
assert.strictEqual(secondPass.changed, false)
assert.strictEqual(secondPass.code, firstPass.code)

const unmatched = transformSource('<span>Definitely Missing UI Copy</span>', { dictionary, filename: 'Missing.jsx' })
assert.deepStrictEqual(unmatched.unmatchedText, ['Definitely Missing UI Copy'])

console.log('i18n codemod tests passed')
