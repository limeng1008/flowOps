#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const bt = require('@babel/types')

const repoRoot = path.resolve(__dirname, '../..')
const defaultEnPath = path.join(repoRoot, 'packages/ui/src/i18n/locales/en.json')
const defaultZhPath = path.join(repoRoot, 'packages/ui/src/i18n/locales/zh.json')

const parseSource = (source) =>
    parser.parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'classProperties', 'dynamicImport', 'optionalChaining', 'nullishCoalescingOperator']
    })

const flattenLocale = (obj, prefix = '', out = {}) => {
    for (const [key, value] of Object.entries(obj || {})) {
        const nextKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenLocale(value, nextKey, out)
        } else if (typeof value === 'string' && value.trim()) {
            out[nextKey] = value.trim()
        }
    }
    return out
}

const normalizeText = (value) =>
    String(value || '')
        .replace(/\s+/g, ' ')
        .trim()

const hasVisibleEnglish = (value) => {
    const normalized = normalizeText(value)
    if (normalized.length < 3) return false
    if (!/[A-Za-z]/.test(normalized)) return false
    if (/^(https?:\/\/|\/|\.\/|\.\.\/|[A-Z_]+$)/.test(normalized)) return false
    return /[A-Za-z]{2,}/.test(normalized)
}

const buildLocaleDictionary = ({ enPath = defaultEnPath, zhPath = defaultZhPath } = {}) => {
    const en = flattenLocale(JSON.parse(fs.readFileSync(enPath, 'utf8')))
    const zh = flattenLocale(JSON.parse(fs.readFileSync(zhPath, 'utf8')))
    const dictionary = new Map()

    for (const [key, englishText] of Object.entries(en)) {
        if (!zh[key]) continue
        const normalized = normalizeText(englishText)
        if (!hasVisibleEnglish(normalized)) continue
        if (!dictionary.has(normalized)) dictionary.set(normalized, key)
    }

    return dictionary
}

const quoteForTCall = (key) => `t('${String(key).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')`

const hasUseTranslationImport = (program) =>
    program.body.some(
        (node) =>
            bt.isImportDeclaration(node) &&
            node.source.value === 'react-i18next' &&
            node.specifiers.some((specifier) => bt.isImportSpecifier(specifier) && specifier.imported.name === 'useTranslation')
    )

const functionHasJSX = (fnPath) => {
    let found = false
    fnPath.traverse({
        JSXElement(path) {
            found = true
            path.stop()
        },
        JSXFragment(path) {
            found = true
            path.stop()
        }
    })
    return found
}

const shouldTranslateAttribute = (attrName) => {
    if (!attrName) return false
    const allowed = new Set([
        'title',
        'placeholder',
        'label',
        'aria-label',
        'helperText',
        'tooltip',
        'description',
        'header',
        'emptyText',
        'buttonText',
        'confirmButtonName',
        'cancelButtonName'
    ])
    return (
        allowed.has(attrName) ||
        attrName.endsWith('Label') ||
        attrName.endsWith('Title') ||
        attrName.endsWith('Text') ||
        attrName.endsWith('Placeholder')
    )
}

const uniquePush = (arr, value) => {
    if (!arr.includes(value)) arr.push(value)
}

const functionName = (fnPath) => {
    if (bt.isFunctionDeclaration(fnPath.node) && fnPath.node.id?.name) return fnPath.node.id.name

    const parent = fnPath.parentPath?.node
    if (bt.isVariableDeclarator(parent) && bt.isIdentifier(parent.id)) return parent.id.name
    if (bt.isAssignmentExpression(parent) && bt.isIdentifier(parent.left)) return parent.left.name

    return ''
}

const isComponentFunction = (fnPath) => /^[A-Z]/.test(functionName(fnPath))

const getTranslationFunctionPath = (path) => {
    if (path.scope.hasBinding('t')) return null

    let current = path.parentPath
    while (current) {
        if (current.isFunction?.()) {
            if (bt.isClassMethod(current.node) || bt.isObjectMethod(current.node)) return undefined
            if (isComponentFunction(current) && functionHasJSX(current)) return current
        }
        current = current.parentPath
    }

    return undefined
}

const addOperation = (operations, start, end, text) => {
    if (typeof start !== 'number' || typeof end !== 'number' || start > end) return
    operations.push({ start, end, text })
}

const applyOperations = (source, operations) => {
    let output = source
    const sorted = operations
        .filter((operation) => !operation.consumed)
        .sort((a, b) => {
            if (a.start !== b.start) return b.start - a.start
            return b.end - a.end
        })

    for (const operation of sorted) {
        output = `${output.slice(0, operation.start)}${operation.text}${output.slice(operation.end)}`
    }

    return output
}

const getLineIndent = (source, pos) => {
    const lineStart = source.lastIndexOf('\n', pos) + 1
    const match = source.slice(lineStart, pos).match(/^[ \t]*/)
    return match ? match[0] : ''
}

const hookInsertionForBlock = (source, body) => {
    let pos = body.start + 1
    if (source[pos] === '\r' && source[pos + 1] === '\n') pos += 2
    else if (source[pos] === '\n') pos += 1

    const indentStart = pos
    while (source[pos] === ' ' || source[pos] === '\t') pos += 1

    const indent = source.slice(indentStart, pos) || `${getLineIndent(source, body.start)}    `
    return {
        start: pos,
        end: pos,
        text: `const { t } = useTranslation()\n${indent}`
    }
}

const indentMultiline = (text, indent) => text.replace(/\n/g, `\n${indent}`)

const hookReplacementForExpressionBody = (source, body, replacements) => {
    const innerOperations = replacements.filter((operation) => operation.start >= body.start && operation.end <= body.end)
    for (const operation of innerOperations) operation.consumed = true

    const bodySource = applyOperations(
        source.slice(body.start, body.end),
        innerOperations.map((operation) => ({
            ...operation,
            start: operation.start - body.start,
            end: operation.end - body.start,
            consumed: false
        }))
    )
    const baseIndent = getLineIndent(source, body.start)
    const childIndent = `${baseIndent}    `
    let replacementStart = body.start
    let replacementEnd = body.end

    let beforeBody = body.start - 1
    while (beforeBody >= 0 && /\s/.test(source[beforeBody])) beforeBody -= 1
    if (source[beforeBody] === '(') replacementStart = beforeBody

    let afterBody = body.end
    while (afterBody < source.length && /\s/.test(source[afterBody])) afterBody += 1
    if (source[afterBody] === ')') replacementEnd = afterBody + 1

    const indentedBody = `${childIndent}${indentMultiline(bodySource, childIndent)}`

    return {
        start: replacementStart,
        end: replacementEnd,
        text: `{\n${childIndent}const { t } = useTranslation()\n${childIndent}return (\n${indentedBody}\n${childIndent})\n${baseIndent}}`
    }
}

const createHookOperation = (source, fnPath, replacements) => {
    if (!functionHasJSX(fnPath)) return null
    const body = fnPath.node.body

    if (bt.isBlockStatement(body)) return hookInsertionForBlock(source, body)
    if (bt.isArrowFunctionExpression(fnPath.node)) return hookReplacementForExpressionBody(source, body, replacements)

    return null
}

const createUseTranslationImportOperation = (source, program) => {
    const existing = program.body.find((node) => bt.isImportDeclaration(node) && node.source.value === 'react-i18next')
    if (existing) {
        const closeBrace = source.indexOf('}', existing.start)
        if (closeBrace !== -1 && closeBrace < existing.source.start) {
            const beforeBrace = source.slice(existing.start, closeBrace)
            const separator = beforeBrace.includes('{') && !beforeBrace.trim().endsWith('{') ? ', ' : ' '
            return { start: closeBrace, end: closeBrace, text: `${separator}useTranslation` }
        }

        return { start: existing.end, end: existing.end, text: `\nimport { useTranslation } from 'react-i18next'` }
    }

    const imports = program.body.filter((node) => bt.isImportDeclaration(node))
    const lastImport = imports[imports.length - 1]
    if (lastImport) return { start: lastImport.end, end: lastImport.end, text: `\nimport { useTranslation } from 'react-i18next'` }

    return { start: 0, end: 0, text: `import { useTranslation } from 'react-i18next'\n` }
}

const transformSource = (source, { dictionary = buildLocaleDictionary(), filename = 'unknown.jsx' } = {}) => {
    const ast = parseSource(source)
    let replacements = 0
    const unmatchedText = []
    const functionsNeedingHook = new Set()
    const operations = []

    traverse(ast, {
        JSXText(path) {
            const normalized = normalizeText(path.node.value)
            if (!normalized) return

            const key = dictionary.get(normalized)
            if (key) {
                const fnPath = getTranslationFunctionPath(path)
                if (fnPath === undefined) {
                    uniquePush(unmatchedText, normalized)
                    return
                }
                if (fnPath) functionsNeedingHook.add(fnPath)
                const leading = path.node.value.match(/^\s*/)?.[0] || ''
                const trailing = path.node.value.match(/\s*$/)?.[0] || ''
                addOperation(operations, path.node.start, path.node.end, `${leading}{${quoteForTCall(key)}}${trailing}`)
                replacements += 1
            } else if (hasVisibleEnglish(normalized)) {
                uniquePush(unmatchedText, normalized)
            }
        },
        JSXAttribute(path) {
            const attrName = path.node.name?.name
            if (!shouldTranslateAttribute(attrName) || !bt.isStringLiteral(path.node.value)) return

            const normalized = normalizeText(path.node.value.value)
            const key = dictionary.get(normalized)
            if (key) {
                const fnPath = getTranslationFunctionPath(path)
                if (fnPath === undefined) {
                    uniquePush(unmatchedText, normalized)
                    return
                }
                if (fnPath) functionsNeedingHook.add(fnPath)
                addOperation(operations, path.node.value.start, path.node.value.end, `{${quoteForTCall(key)}}`)
                replacements += 1
            } else if (hasVisibleEnglish(normalized)) {
                uniquePush(unmatchedText, normalized)
            }
        }
    })

    if (replacements === 0) {
        return { changed: false, code: source, replacements, unmatchedText, filename }
    }

    const hookOperations = []
    for (const fnPath of functionsNeedingHook) {
        const operation = createHookOperation(source, fnPath, operations)
        if (operation) hookOperations.push(operation)
        else uniquePush(unmatchedText, `Unable to inject useTranslation hook in ${filename}`)
    }

    if (hookOperations.length > 0 && !hasUseTranslationImport(ast.program)) {
        const operation = createUseTranslationImportOperation(source, ast.program)
        if (operation) operations.push(operation)
    }
    operations.push(...hookOperations)

    return {
        changed: true,
        code: applyOperations(source, operations),
        replacements,
        unmatchedText,
        filename
    }
}

const collectFiles = (inputPath) => {
    const stat = fs.statSync(inputPath)
    if (stat.isFile()) return /\.(jsx?|tsx?)$/.test(inputPath) ? [inputPath] : []

    const files = []
    for (const entry of fs.readdirSync(inputPath, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'build' || entry.name.startsWith('.')) continue
        files.push(...collectFiles(path.join(inputPath, entry.name)))
    }
    return files
}

const runCli = () => {
    const args = process.argv.slice(2)
    const write = args.includes('--write')
    const check = args.includes('--check')
    const paths = args.filter((arg) => !arg.startsWith('--'))

    if (paths.length === 0) {
        console.error('Usage: node scripts/i18n-codemod/index.js [--write|--check] <file-or-dir>...')
        process.exit(2)
    }

    const dictionary = buildLocaleDictionary()
    const results = []

    for (const input of paths) {
        for (const file of collectFiles(path.resolve(input))) {
            const source = fs.readFileSync(file, 'utf8')
            const result = transformSource(source, { dictionary, filename: path.relative(repoRoot, file) })
            if (write && result.changed) fs.writeFileSync(file, result.code.endsWith('\n') ? result.code : `${result.code}\n`)
            results.push(result)
        }
    }

    const changed = results.filter((result) => result.changed)
    const unmatched = results.filter((result) => result.unmatchedText.length)

    for (const result of changed) {
        console.log(`changed ${result.filename} (${result.replacements} replacements)`)
    }
    for (const result of unmatched) {
        console.log(`unmatched ${result.filename}: ${result.unmatchedText.join(' | ')}`)
    }

    if (check && changed.length > 0) process.exit(1)
}

if (require.main === module) runCli()

module.exports = {
    buildLocaleDictionary,
    collectFiles,
    flattenLocale,
    normalizeText,
    transformSource
}
