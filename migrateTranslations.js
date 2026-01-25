// To run script: node migrateTranslations.js
const fs = require('fs')
const path = require('path')
const deepl = require('deepl-node')

// --- CONFIGURATION ---
const SOURCE_LANG = 'en'
const SOURCE_FILE = path.resolve(__dirname, 'packages/app/src/locales/en-US.json')

const TARGET_LANGUAGES = [
    { code: 'pl', filePath: path.resolve(__dirname, 'packages/app/src/locales/pl-PL.json') },
    { code: 'uk', filePath: path.resolve(__dirname, 'packages/app/src/locales/uk-UA.json') },
    { code: 'de', filePath: path.resolve(__dirname, 'packages/app/src/locales/de-DE.json') }
]

const translator = new deepl.Translator('1e08303c-52f0-4577-8ad3-b5194aa4417a:fx')

async function runSyncTranslations() {

    console.log(`Starting translation sync from source file: ${SOURCE_FILE}`)

    let sourceTranslations
    try {
        sourceTranslations = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
    } catch (error) {
        console.error(`Error: Could not read or parse the source file at ${SOURCE_FILE}`)
        return
    }

    const sourceKeys = Object.keys(sourceTranslations)

    for (const target of TARGET_LANGUAGES) {
        console.log(`\n--- Syncing language: ${target.code.toUpperCase()} ---`)

        let existingTargetTranslations = {}
        try {
            if (fs.existsSync(target.filePath)) {
                existingTargetTranslations = JSON.parse(fs.readFileSync(target.filePath, 'utf8'))
            }
        } catch (e) {
            console.warn(
                `Warning: Could not parse existing file for ${target.code}. A new file will be created.`,
            )
        }

        const missingKeys = sourceKeys.filter((key) => !existingTargetTranslations.hasOwnProperty(key))

        if (missingKeys.length === 0) {
            console.log('  -> No missing keys found. File is up to date.')
            continue
        }

        console.log(`  -> Found ${missingKeys.length} missing keys to translate.`)
        const newTranslations = { ...existingTargetTranslations }

        for (const key of missingKeys) {
            const sourceText = sourceTranslations[key]
            try {
                await new Promise((resolve) => setTimeout(resolve, 500))
                const result = await translator.translateText(sourceText, 'en', target.code);
                newTranslations[key] = result.text;
                console.log(`    - Translated "${key}"`);
            } catch (error) {
                console.error(`\nError translating key "${key}":`, error.message)
                newTranslations[key] = `[TRANSLATION FAILED] ${sourceText}`
            }
        }

        const sortedTranslations = Object.keys(newTranslations)
            .sort()
            .reduce((obj, key) => {
                obj[key] = newTranslations[key]
                return obj
            }, {})

        try {
            fs.mkdirSync(path.dirname(target.filePath), { recursive: true })
            fs.writeFileSync(target.filePath, JSON.stringify(sortedTranslations, null, 2), 'utf8')
            console.log(`Successfully synced translation file: ${target.filePath}`)
        } catch (error) {
            console.error(`\nError: Could not write the new translation file to ${target.filePath}`)
        }
    }

    console.log('\nAll translations synced!')
}

runSyncTranslations()
