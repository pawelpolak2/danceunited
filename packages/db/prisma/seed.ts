
import { PrismaClient, UserRole, ClassLevel, PackageCategory, DanceHall, ClassStatus, PurchaseStatus } from '../generated/prisma/client'
import * as bcrypt from 'bcryptjs'

import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL || "postgresql://devuser:devpassword@localhost:5432/devdb"
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10)

  const upsertUser = async (email: string, firstName: string, lastName: string, role: UserRole) => {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, firstName, lastName, role, passwordHash },
    })
  }

  const admin = await upsertUser('admin@danceunited.pl', 'Admin', 'User', UserRole.MANAGER)
  const trainer1 = await upsertUser('trainer1@danceunited.pl', 'Alice', 'Dancer', UserRole.TRAINER)
  const trainer2 = await upsertUser('trainer2@danceunited.pl', 'Bob', 'Stepper', UserRole.TRAINER)
  const dancer1 = await upsertUser('user1@danceunited.pl', 'Charlie', 'Student', UserRole.DANCER)
  const dancer2 = await upsertUser('user2@danceunited.pl', 'Diana', 'Learner', UserRole.DANCER)

  console.log('✅ Users seeded')

  // 2. Create Dance Styles
  const upsertStyle = async (name: string, description: string) => {
    return prisma.danceStyle.upsert({
      where: { name },
      update: {},
      create: { name, description },
    })
  }

  const styleSalsa = await upsertStyle('Salsa', 'Cuban Salsa classes')
  const styleBachata = await upsertStyle('Bachata', 'Sensual and Dominican Bachata')
  const styleHipHop = await upsertStyle('Hip Hop', 'Urban dance styles')

  console.log('✅ Styles seeded')

  // 3. Create Class Templates
  // Name is not unique, so we check first
  const ensureTemplate = async (
    name: string,
    description: string,
    duration: number,
    level: ClassLevel,
    styleId: string,
    trainerId: string,
    hallId: DanceHall
  ) => {
    const existing = await prisma.classTemplate.findFirst({ where: { name } })
    if (existing) return existing

    return prisma.classTemplate.create({
      data: {
        name,
        description,
        duration,
        level,
        styleId,
        trainerId,
        hallId,
        isWhitelistEnabled: false,
      },
    })
  }

  const templateSalsaBeg = await ensureTemplate(
    'Salsa Beginner',
    'Learn the basics of Salsa',
    3600,
    ClassLevel.BEGINNER,
    styleSalsa.id,
    trainer1.id,
    DanceHall.HALL1
  )

  const templateBachataInter = await ensureTemplate(
    'Bachata Intermediate',
    'Improve your Bachata flow',
    3600,
    ClassLevel.INTERMEDIATE,
    styleBachata.id,
    trainer2.id,
    DanceHall.HALL2
  )

  const templateHipHopAdv = await ensureTemplate(
    'Hip Hop Advanced',
    'Choreography implementation',
    5400,
    ClassLevel.ADVANCED,
    styleHipHop.id,
    trainer1.id,
    DanceHall.HALL1
  )

  console.log('✅ Templates seeded')

  // 4. Create Packages
  const ensurePackage = async (
    name: string,
    description: string,
    classCount: number,
    price: number,
    validityDays: number,
    category: PackageCategory
  ) => {
    const existing = await prisma.package.findFirst({ where: { name } })
    if (existing) return existing

    return prisma.package.create({
      data: {
        name,
        description,
        classCount,
        price,
        validityDays,
        category,
        isActive: true,
      },
    })
  }

  const pkgSingle = await ensurePackage('Single Class', 'One time entry', 1, 40.0, 14, PackageCategory.UNIVERSAL)
  const pkg4 = await ensurePackage('4 Classes', 'Valid for 1 month', 4, 140.0, 30, PackageCategory.UNIVERSAL)
  const pkgOpen = await ensurePackage('Open Pass', 'Unlimited access', 999, 350.0, 30, PackageCategory.UNIVERSAL) // VIP not in enum? Schema says UNIVERSAL, YOUTH etc. Let's use UNIVERSAL for now or check enum. Schema says: YOUTH, KIDS, SPORT, ADULTS, UNIVERSAL. No VIP.

  // Link packages
  const linkPackage = async (templateId: string, packageId: string) => {
    const exists = await prisma.classTemplateToPackage.findUnique({
      where: {
        classTemplateId_packageId: {
          classTemplateId: templateId,
          packageId: packageId,
        },
      },
    })

    if (!exists) {
      await prisma.classTemplateToPackage.create({
        data: {
          classTemplateId: templateId,
          packageId: packageId,
        },
      })
    }
  }

  const templates = [templateSalsaBeg, templateBachataInter, templateHipHopAdv]
  const packages = [pkgSingle, pkg4, pkgOpen]

  for (const t of templates) {
    for (const p of packages) {
      await linkPackage(t.id, p.id)
    }
  }

  console.log('✅ Packages seeded & Linked')

  // 5. Create user Purchases
  // Logic: Only create if none active? Or just create one.
  const existingPurchase = await prisma.userPurchase.findFirst({ where: { userId: dancer1.id } })
  if (!existingPurchase) {
    await prisma.userPurchase.create({
      data: {
        userId: dancer1.id,
        packageId: pkg4.id,
        classesRemaining: 4,
        purchaseDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: PurchaseStatus.ACTIVE,
        // amountPaid removed as not in schema.
      },
    })
  }

  const existingPurchase2 = await prisma.userPurchase.findFirst({ where: { userId: dancer2.id } })
  if (!existingPurchase2) {
    await prisma.userPurchase.create({
      data: {
        userId: dancer2.id,
        packageId: pkgOpen.id,
        classesRemaining: 999,
        purchaseDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: PurchaseStatus.ACTIVE,
      },
    })
  }
  console.log('✅ Purchases seeded')

  // 6. Schedule Classes
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  for (let i = -7; i <= 7; i++) {
    const date = new Date(todayStart)
    date.setDate(date.getDate() + i)

    // Schedule Salsa
    const salsaStart = new Date(date)
    salsaStart.setHours(18, 0, 0, 0)
    const salsaEnd = new Date(date)
    salsaEnd.setHours(19, 0, 0, 0)

    // Check if exists
    const existingSalsa = await prisma.classInstance.findFirst({
      where: {
        classTemplateId: templateSalsaBeg.id,
        startTime: salsaStart
      }
    })

    let salsaId = existingSalsa?.id

    if (!existingSalsa) {
      const salsa = await prisma.classInstance.create({
        data: {
          classTemplateId: templateSalsaBeg.id,
          startTime: salsaStart,
          endTime: salsaEnd,
          actualTrainerId: trainer1.id,
          actualHall: DanceHall.HALL1,
          status: ClassStatus.ACTIVE,
        },
      })
      salsaId = salsa.id
    }

    // Schedule Bachata
    const bachataStart = new Date(date)
    bachataStart.setHours(19, 30, 0, 0)
    const bachataEnd = new Date(date)
    bachataEnd.setHours(20, 30, 0, 0)

    const existingBachata = await prisma.classInstance.findFirst({
      where: {
        classTemplateId: templateBachataInter.id,
        startTime: bachataStart
      }
    })

    if (!existingBachata) {
      await prisma.classInstance.create({
        data: {
          classTemplateId: templateBachataInter.id,
          startTime: bachataStart,
          endTime: bachataEnd,
          actualTrainerId: trainer2.id,
          actualHall: DanceHall.HALL2,
          status: i === 1 ? ClassStatus.CANCELLED : ClassStatus.ACTIVE,
        },
      })
    }

    // Enroll dancer1 in past salsa classes
    if (i < 0 && salsaId) {
      // Check attendance
      const attendance = await prisma.attendance.findUnique({
        where: {
          userId_classId: {
            userId: dancer1.id,
            classId: salsaId
          }
        }
      })

      if (!attendance) {
        await prisma.attendance.create({
          data: {
            userId: dancer1.id,
            classId: salsaId,
            // Status/CheckedInAt removed
          },
        })
      }
    }
  }

  console.log('✅ Schedule seeded')
  console.log('🌱 Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
