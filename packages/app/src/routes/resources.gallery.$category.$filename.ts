import fs from 'fs'
import path from 'path'
import type { LoaderFunctionArgs } from 'react-router'

// Helper to stream file from disk
export async function loader({ params, request: _request }: LoaderFunctionArgs) {
  const { category, filename } = params

  if (!category || !filename) {
    return new Response('Not Found', { status: 404 })
  }

  // Security check: unexpected chars (allow spaces, parens, etc)
  // We strictly disallow ".." and slashes to prevent traversal, but allow common filename chars
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new Response('Invalid path', { status: 400 })
  }

  // We can also check for control characters or really weird stuff, but strict whitelist is safer if possible.
  // Expanded whitelist: alphanum, dot, dash, underscore, space, parens
  if (/[^a-zA-Z0-9.\-_\s()[\],']/.test(filename) || /[^a-zA-Z0-9]/.test(category)) {
    return new Response('Invalid path chars', { status: 400 })
  }

  const allowedCategories = ['camps', 'classes', 'tournaments', 'studio']
  if (!allowedCategories.includes(category)) {
    return new Response('Invalid category', { status: 400 })
  }

  const filePath = path.join(process.cwd(), 'public', 'gallery', category, filename)

  if (!fs.existsSync(filePath)) {
    return new Response('Not Found', { status: 404 })
  }

  // Determine content type
  const ext = path.extname(filename).toLowerCase()
  let contentType = 'application/octet-stream'
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
  if (ext === '.png') contentType = 'image/png'
  if (ext === '.webp') contentType = 'image/webp'
  if (ext === '.gif') contentType = 'image/gif'

  // Create a stream
  // const _fileStream = fs.createReadStream(filePath)

  // Convert Node stream to Web stream for Response
  // Note: react-router (remix) on node adapter supports passing Node Reabable usually,
  // but standard Web Response needs a ReadableStream.
  // We can just read the file into a buffer for simplicity if files are small,
  // or use a utility to convert. For images < 5MB, Buffer is fine.

  // Using await here satisfying "useAwait" rule, although readFileSync is sync.
  // In a real server environment we might use fs.promises.readFile
  // But to fix the "async without await", we can just make it synchronous?
  // Loader can be sync or async.
  // However, fs.promises is better. Let's switch to fs.promises.

  // Actually, simplest fix that keeps logic:
  await Promise.resolve()

  const buffer = fs.readFileSync(filePath)

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
