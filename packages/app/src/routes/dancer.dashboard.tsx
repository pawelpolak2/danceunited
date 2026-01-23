import { prisma } from 'db'
import { redirect, useLoaderData } from 'react-router'
import { NextClassWidget } from '../components/dashboard/NextClassWidget'
import { ShinyText } from '../components/ui'
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
  // We check if 'attendances' has a record for this user
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
      actualTrainer: true, // Need trainer name for dancer view
    },
    orderBy: { startTime: 'asc' },
  })

  // Fetch Next Class (Immediate next one from ANY time in future where attending)
  const nextClassRaw = await prisma.classInstance.findFirst({
    where: {
      startTime: { gt: new Date() },
      attendances: {
        some: { userId: user.userId },
      },
      status: { not: 'CANCELLED' },
    },
    orderBy: { startTime: 'asc' },
    include: {
      classTemplate: true,
      actualTrainer: true,
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
      }
    : null

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
        status: { in: ['COMPLETED', 'SCHEDULED'] }, // Count scheduled too or just completed? usually both for "this month activity"
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

  return { user, kpi, nextClass, agenda }
}

export default function DancerDashboard() {
  const { user, kpi, nextClass, agenda } = useLoaderData<typeof loader>()

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="text-amber-50">
      <div className="mx-auto max-w-7xl">
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content (2/3) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Next Class Widget */}
            <section>
              <h2 className="mb-4 font-serif text-amber-400 text-xl tracking-wide">Next Class</h2>
              <NextClassWidget nextClass={nextClass} userRole="DANCER" />
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
