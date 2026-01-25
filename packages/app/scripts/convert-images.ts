import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const publicDir = path.join(process.cwd(), 'public')

async function convertRecursively(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await convertRecursively(fullPath)
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.png') || entry.name.endsWith('.jpg') || entry.name.endsWith('.jpeg'))
    ) {
      const extension = path.extname(entry.name)
      const outputPath = fullPath.replace(extension, '.webp')

      if (fs.existsSync(outputPath)) {
        // Skip if already exists
        continue
      }
      try {
        await sharp(fullPath).webp({ quality: 80 }).toFile(outputPath)
      } catch (e) {
        console.error(`Failed to convert ${entry.name}:`, e)
      }
    }
  }
}
;(async () => {
  await convertRecursively(publicDir)
})()
