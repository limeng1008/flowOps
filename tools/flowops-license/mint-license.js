#!/usr/bin/env node
/* eslint-disable no-console */

const { mkdirSync, writeFileSync } = require('fs')
const path = require('path')
const { getLast, mintLicense, parseArgs } = require('./lib')

function printHelp() {
    console.log(`Usage:
  node tools/flowops-license/mint-license.js \\
    --private-key ./flowops-license-private.pem \\
    --customer "Acme" --tier team --model subscription \\
    --seats 20 --concurrency 10 \\
    --issued-at 2026-06-01T00:00:00.000Z \\
    --expire-at 2027-06-01T00:00:00.000Z \\
    --machine-fingerprint '*' \\
    --module feat:datasets --module feat:logs

Private key input:
  --private-key <path>
  --private-key-env <ENV_NAME>       Defaults to FLOWOPS_LICENSE_PRIVATE_KEY.
  FLOWOPS_LICENSE_PRIVATE_KEY_PATH   Alternative path input.
  FLOWOPS_LICENSE_PRIVATE_KEY        Alternative PEM content input.

Output:
  stdout by default, or --output <path> to write a .lic file.
`)
}

function main() {
    const args = parseArgs(process.argv.slice(2))
    if (args.help || args.h) {
        printHelp()
        return
    }

    const license = mintLicense(args)
    const outputPath = getLast(args, 'output')
    if (outputPath) {
        mkdirSync(path.dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, `${license}\n`, 'utf8')
        console.log(`License written to ${outputPath}`)
        return
    }

    console.log(license)
}

try {
    main()
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
}
