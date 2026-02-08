import { createRequire } from 'module'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const require = createRequire(import.meta.url)
// @ts-ignore
const { PrismaClient } = require('../../../db/generated/prisma/client.ts')

const connectionString = process.env.DATABASE_URL || 'postgresql://devuser:devpassword@localhost:5432/devdb'
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const action = process.argv[2]
  const arg1 = process.argv[3]

  if (action === 'make-manager') {
    const email = arg1
    await prisma.user.update({
      where: { email },
      data: { role: 'MANAGER' },
    })
    console.error(`User ${email} promoted to MANAGER`)
  } else if (action === 'get-or-create-style') {
    let style = await prisma.danceStyle.findFirst()
    if (!style) {
      style = await prisma.danceStyle.create({
        data: { name: `Style ${Math.random()}`, description: 'Test' },
      })
    }
  } else if (action === 'get-user-id') {
    const email = arg1
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
    } else {
      console.error('User not found')
      process.exit(1)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
