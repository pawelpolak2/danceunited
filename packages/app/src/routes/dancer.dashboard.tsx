import { prisma } from 'db'
import { Check, Package, X } from 'lucide-react'
import { useState } from 'react'
import { Link, redirect, useFetcher, useLoaderData } from 'react-router'
import { NextClassWidget } from '../components/dashboard/NextClassWidget'
import { ConfirmModal, MetallicButton, MetallicTooltip, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dancer.dashboard'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'Dancer Dashboard - Dance United' }, { name: 'description', content: 'Your classes and progress' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'DANCER') {
    return redirect('/')
  }

  const today = new Date()
  const startOfToday = new Date(today.setHours(0, 0, 0, 0))
  const endOfToday = new Date(today.setHours(23, 59, 59, 999))

  // Fetch Agenda (Classes Today where User is attending)
  const agendaRaw = await prisma.classInstance.findMany({
    where: {
      startTime: { gte: startOfToday, lte: endOfToday },
      attendances: {
        some: { userId: user.userId },
      },
      status: { not: 'CANCELLED' },
    },
    include: {
      classTemplate: true,
      actualTrainer: true,
    },
    orderBy: { startTime: 'asc' },
  })

  // Fetch Next Class (Immediate next one from ANY time in future)
  // We want to show the next AVAILABLE class or the next ATTENDING class?
  // User asked for "zapowiedzi następnych zajęć do zapisania się / odwołania rejestracji"
  // So we should pick the absolute next class instance in the system, and check status.
  const nextClassRaw = await prisma.classInstance.findFirst({
    where: {
      startTime: { gt: new Date() },
      status: { not: 'CANCELLED' },
    },
    orderBy: { startTime: 'asc' },
    include: {
      classTemplate: true,
      actualTrainer: true,
      attendances: {
        where: { userId: user.userId },
      },
    },
  })

  const nextClass = nextClassRaw
    ? {
        id: nextClassRaw.id,
        name: nextClassRaw.classTemplate.name,
        startTime: nextClassRaw.startTime.toISOString(),
        endTime: nextClassRaw.endTime.toISOString(),
        hall: nextClassRaw.actualHall,
        trainerName: `${nextClassRaw.actualTrainer.firstName} ${nextClassRaw.actualTrainer.lastName}`,
        isAttending: nextClassRaw.attendances.length > 0,
      }
    : null

  // Fetch Active Packages
  const activePackages = await prisma.userPurchase.findMany({
    where: {
      userId: user.userId,
      status: 'ACTIVE',
      classesRemaining: { gt: 0 },
      OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
    },
    include: {
      package: true,
    },
    orderBy: { expiryDate: 'asc' },
  })

  // Fetch upcoming classes count (next 7 days)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const upcomingClassesCount = await prisma.classInstance.count({
    where: {
      startTime: { gte: startOfToday, lte: nextWeek },
      attendances: { some: { userId: user.userId } },
      status: { not: 'CANCELLED' },
    },
  })

  // Calculate Classes Attended This Month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const classesMonthCount = await prisma.attendance.count({
    where: {
      userId: user.userId,
      class: {
        startTime: { gte: startOfMonth, lte: endOfToday },
        status: { in: ['ACTIVE'] },
      },
    },
  })

  // KPIs
  const kpi = {
    classesToday: agendaRaw.length,
    upcomingClasses: upcomingClassesCount,
    classesMonth: classesMonthCount,
  }

  const agenda = agendaRaw.map((c) => ({
    id: c.id,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
    className: c.classTemplate.name,
    trainerName: c.actualTrainer.firstName,
    hall: c.actualHall,
    duration: c.classTemplate.duration,
  }))

  return { user, kpi, nextClass, agenda, activePackages }
}

export async function action({ request }: Route.ActionArgs) {
  // We reuse the logic from schedule action effectively, or we call the same services if we had them extracted.
  // For now duplicating the core logic for safety and speed to ensuring specific dashboard behavior.
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'DANCER') return redirect('/')

  const formData = await request.formData()
  const intent = formData.get('intent')
  const classId = formData.get('classId') as string

  if (!classId) return { error: 'Missing class ID' }

  try {
    if (intent === 'signup') {
      // ... Copy of signup logic from schedule ... with package verification
      const existing = await prisma.attendance.findUnique({
        where: { userId_classId: { userId: user.userId, classId } },
      })
      if (existing) return { success: true, message: 'Already signed up' }

      const classInstance = await prisma.classInstance.findUnique({
        where: { id: classId },
        include: { classTemplate: true },
      })
      if (!classInstance) return { error: 'Class not found' }

      const purchases = await prisma.userPurchase.findMany({
        where: {
          userId: user.userId,
          status: 'ACTIVE',
          classesRemaining: { gt: 0 },
          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
        include: { package: { include: { classLinks: true } } },
        orderBy: { expiryDate: 'asc' },
      })

      const validPurchase = purchases.find((p) => {
        if (p.package.classLinks.length === 0) return true
        return p.package.classLinks.some((link) => link.classTemplateId === classInstance.classTemplateId)
      })

      if (!validPurchase) return { error: 'No valid package found for this class' }

      await prisma.$transaction([
        prisma.attendance.create({ data: { userId: user.userId, classId } }),
        prisma.userPurchase.update({
          where: { id: validPurchase.id },
          data: {
            classesRemaining: { decrement: 1 },
            classesUsed: { increment: 1 },
            status: validPurchase.classesRemaining === 1 ? 'USED' : undefined,
          },
        }),
      ])
      return { success: true, message: 'Successfully signed up!' }
    }

    if (intent === 'cancel') {
      const classInstance = await prisma.classInstance.findUnique({
        where: { id: classId },
        include: { classTemplate: true },
      })
      if (!classInstance) return { error: 'Class not found' }

      const purchaseToCredit = await prisma.userPurchase.findFirst({
        where: {
          userId: user.userId,
          package: {
            OR: [
              { classLinks: { none: {} } },
              { classLinks: { some: { classTemplateId: classInstance.classTemplateId } } },
            ],
          },
          OR: [{ status: 'ACTIVE' }, { status: 'USED' }],
        },
        orderBy: { expiryDate: 'asc' },
      })

      if (purchaseToCredit) {
        await prisma.$transaction([
          prisma.attendance.delete({ where: { userId_classId: { userId: user.userId, classId } } }),
          prisma.userPurchase.update({
            where: { id: purchaseToCredit.id },
            data: {
              classesRemaining: { increment: 1 },
              classesUsed: { decrement: 1 },
              status: 'ACTIVE',
            },
          }),
        ])
      } else {
        await prisma.attendance.delete({ where: { userId_classId: { userId: user.userId, classId } } })
      }
      return { success: true, message: 'Reservation cancelled.' }
    }
  } catch (error) {
    console.error(error)
    return { error: 'Action failed' }
  }
  return null
}

export default function DancerDashboard() {
  const { user, kpi, nextClass, agenda, activePackages } = useLoaderData<typeof loader>()
  // We use fetcher for interacting with the widget without full page reload feels
  const fetcher = useFetcher()
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleConfirmCancel = () => {
    if (nextClass) {
      const fd = new FormData()
      fd.append('intent', 'cancel')
      fd.append('classId', nextClass.id)
      fetcher.submit(fd, { method: 'post' })
    }
    setIsConfirmModalOpen(false)
  }

  return (
    <div className="text-amber-50">
      <div className="mx-auto max-w-7xl">
        {/* ... Header ... */}
        {/* ... Global Alerts ... */}

        {/* ... Packages ... */}

        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <ShinyText as="h1" variant="title" className="mb-0 font-serif text-4xl text-amber-400 tracking-wide">
              HELLO, {user?.firstName}
            </ShinyText>
            <ShinyText variant="body" className="font-light text-lg opacity-80">
              Your dance journey overview
            </ShinyText>
          </div>
        </div>

        {/* Global Alerts */}
        {fetcher.data?.error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-red-200">
            <X className="h-5 w-5" /> {fetcher.data.error}
          </div>
        )}
        {fetcher.data?.message && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-900/20 p-4 text-green-200">
            <Check className="h-5 w-5" /> {fetcher.data.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content (2/3) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Next Class Widget */}
            <section>
              <h2 className="mb-4 font-serif text-amber-400 text-xl tracking-wide">Next Class</h2>
              <NextClassWidget nextClass={nextClass} userRole="DANCER">
                {nextClass && (
                  <div className="flex gap-4">
                    {(() => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const classDate = new Date(nextClass.startTime)
                      classDate.setHours(0, 0, 0, 0)

                      const isTooLate = today.getTime() >= classDate.getTime()
                      const tooltipText = 'Changes are allowed only until the day before the class.'

                      return nextClass.isAttending ? (
                        <MetallicTooltip content={tooltipText} shouldShow={isTooLate}>
                          <div className="w-full">
                            <button
                              type="button"
                              onClick={() => !isTooLate && setIsConfirmModalOpen(true)}
                              disabled={fetcher.state !== 'idle' || isTooLate}
                              className={`w-full rounded-md border px-4 py-2 transition-colors ${
                                isTooLate
                                  ? 'cursor-not-allowed border-gray-700 bg-gray-800 text-gray-500'
                                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50'
                              }`}
                            >
                              {fetcher.state !== 'idle' ? 'Processing...' : 'Cancel Reservation'}
                            </button>
                          </div>
                        </MetallicTooltip>
                      ) : (
                        <MetallicTooltip content={tooltipText} shouldShow={isTooLate}>
                          <div className="w-full">
                            <MetallicButton
                              className={`w-full justify-center ${isTooLate ? '!opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                if (!isTooLate) {
                                  const fd = new FormData()
                                  fd.append('intent', 'signup')
                                  fd.append('classId', nextClass.id)
                                  fetcher.submit(fd, { method: 'post' })
                                }
                              }}
                              disabled={fetcher.state !== 'idle' || isTooLate}
                            >
                              {fetcher.state !== 'idle' ? 'Processing...' : 'Sign Up for Class'}
                            </MetallicButton>
                          </div>
                        </MetallicTooltip>
                      )
                    })()}
                  </div>
                )}
              </NextClassWidget>

              <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmCancel}
                title="Cancel Reservation"
                description="Are you sure you want to cancel this reservation? The class will be returned to your package."
                confirmLabel="Yes, Cancel"
                cancelLabel="No, Keep it"
                isDestructive
                isLoading={fetcher.state !== 'idle'}
              />
            </section>

            {/* Agenda */}
            <section className="rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-serif text-amber-400 text-xl tracking-wide">Today's Schedule</h2>

              {agenda.length === 0 ? (
                <p className="text-gray-500 italic">You haven't signed up for any classes today.</p>
              ) : (
                <div className="space-y-4">
                  {agenda.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between border-amber-500/10 border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="font-bold text-amber-400 text-lg">{cls.className}</div>
                        <div className="flex gap-2 text-gray-400 text-sm">
                          <span>
                            {formatDate(cls.startTime)} - {formatDate(cls.endTime)}
                          </span>
                          <span className="text-amber-500/50">•</span>
                          <span>{cls.hall}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-amber-100 text-xl">{cls.trainerName}</div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider">Trainer</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Packages Summary */}
            <section>
              <h2 className="mb-4 font-serif text-amber-400 text-xl tracking-wide">My Active Packages</h2>

              <div className="group relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-6 shadow-lg backdrop-blur-md transition-all hover:border-amber-500/50">
                {/* Background Glow */}
                <div className="-right-20 -top-20 absolute h-64 w-64 rounded-full bg-amber-500/10 blur-3xl transition-opacity group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-medium text-amber-400 text-xs uppercase tracking-wider">
                      Active • {activePackages.length}
                    </div>
                    <Link to="/dancer/packages" title="Refill">
                      <Package className="h-5 w-5 text-gray-400 transition-colors hover:text-amber-400" />
                    </Link>
                  </div>

                  {activePackages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                      <Package className="mb-2 h-8 w-8 opacity-20" />
                      <p className="italic">You don't have any active packages.</p>
                      <Link to="/dancer/packages" className="mt-4 text-amber-400 text-sm hover:underline">
                        Purchase a package
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {activePackages.map((p) => (
                        <div
                          key={p.id}
                          className="relative overflow-hidden rounded-md border border-amber-500/10 bg-black/40 p-4 transition-colors hover:bg-black/60"
                        >
                          <div className="-mt-2 -mr-2 absolute top-0 right-0 select-none p-2 font-bold text-6xl text-amber-500/10 leading-none">
                            {p.classesRemaining}
                          </div>
                          <div className="relative z-10">
                            <div className="truncate font-bold text-amber-100">{p.package.name}</div>
                            <div className="mb-2 text-amber-400/80 text-xs">
                              Expires: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="flex items-end gap-1">
                              <span className="font-bold text-2xl text-amber-400">{p.classesRemaining}</span>
                              <span className="mb-1 text-gray-400 text-sm">classes left</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: KPIs (1/3) */}
          <div className="space-y-4">
            <h2 className="mb-4 font-serif text-amber-400 text-xl tracking-wide">My Stats</h2>
            <KpiCard title="Classes Today" value={kpi.classesToday} />
            <KpiCard title="Month Activity" value={kpi.classesMonth} />
            <KpiCard title="Upcoming (7 days)" value={kpi.upcomingClasses} />
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-amber-500/30 bg-gray-900/60 p-5 transition-colors hover:border-amber-500/50">
      <div className="-mr-8 -mt-8 absolute top-0 right-0 h-16 w-16 rounded-full bg-amber-500/5 blur-xl transition-all group-hover:bg-amber-500/10" />
      <h3 className="z-10 font-medium text-gray-400 text-sm uppercase tracking-wider">{title}</h3>
      <div className="z-10 mt-2">
        <div className="font-bold font-serif text-3xl text-amber-100">{value}</div>
      </div>
    </div>
  )
}
