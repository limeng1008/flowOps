#!/usr/bin/env node
/* eslint-disable no-console */

const { generateKeypair, getLast, parseArgs } = require('./lib')

function printHelp() {
    console.log(`Usage:
  node tools/flowops-license/generate-keypair.js --public-key ./public.pem --private-key ./private.pem
  node tools/flowops-license/generate-keypair.js --stdout

Options:
  --public-key <path>   Write the Ed25519 public key PEM to this path.
  --private-key <path>  Write the Ed25519 private key PEM to this path (mode 0600).
  --out-dir <dir>       Use default file names inside a directory.
  --stdout              Print both PEM values as JSON. Use only in an offline secret-safe shell.
`)
}

function main() {
    const args = parseArgs(process.argv.slice(2))
    if (args.help || args.h) {
        printHelp()
        return
    }

    const outDir = getLast(args, 'out-dir')
    const result = generateKeypair({
        publicKeyPath: getLast(args, 'public-key') || (outDir ? `${outDir}/flowops-license-public.pem` : undefined),
        privateKeyPath: getLast(args, 'private-key') || (outDir ? `${outDir}/flowops-license-private.pem` : undefined),
        stdout: args.stdout === 'true'
    })

    if (args.stdout === 'true') {
        console.log(JSON.stringify(result, null, 2))
    } else {
        console.log(`Generated FlowOps Ed25519 license key pair:
publicKey: ${result.publicKeyPath}
privateKey: ${result.privateKeyPath}

Keep the private key offline. Only deploy the public key through FLOWOPS_LICENSE_PUBLIC_KEY or a reviewed product build.`)
    }
}

try {
    main()
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
}
