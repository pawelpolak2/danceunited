import { prisma } from 'db'
import { redirect, useLoaderData } from 'react-router'
import { NextClassWidget } from '../components/dashboard/NextClassWidget'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/trainer.dashboard'

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'TRAINER') {
    return redirect('/')
  }

  const today = new Date()
  const startOfToday = new Date(today.setHours(0, 0, 0, 0))
  const endOfToday = new Date(today.setHours(23, 59, 59, 999))

  // Fetch Agenda (Classes Today)
  const agendaRaw = await prisma.classInstance.findMany({
    where: {
      startTime: { gte: startOfToday, lte: endOfToday },
      actualTrainerId: user.userId,
    },
    include: {
      classTemplate: true,
      _count: {
        select: { attendances: true },
      },
    },
    orderBy: { startTime: 'asc' },
  })

  // Fetch Next Class (Immediate next one from ANY time in future)
  const nextClassRaw = await prisma.classInstance.findFirst({
    where: {
      actualTrainerId: user.userId,
      startTime: { gt: new Date() },
      status: { not: 'CANCELLED' },
    },
    orderBy: { startTime: 'asc' },
    include: {
      classTemplate: true,
    },
  })

  const nextClass = nextClassRaw
    ? {
        id: nextClassRaw.id,
        name: nextClassRaw.classTemplate.name,
        startTime: nextClassRaw.startTime.toISOString(),
        endTime: nextClassRaw.endTime.toISOString(),
        hall: nextClassRaw.actualHall,
        // Trainer doesn't need to see trainer name (it's them)
      }
    : null

  // Fetch upcoming classes count (next 7 days)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const upcomingClassesCount = await prisma.classInstance.count({
    where: {
      actualTrainerId: user.userId,
      startTime: { gte: startOfToday, lte: nextWeek },
    },
  })

  // Calculate Hours Worked This Month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const monthlyClasses = await prisma.classInstance.findMany({
    where: {
      actualTrainerId: user.userId,
      startTime: { gte: startOfMonth, lte: endOfToday },
      status: { not: 'CANCELLED' },
    },
    include: {
      classTemplate: { select: { duration: true } },
    },
  })

  const totalSeconds = monthlyClasses.reduce((acc, curr) => acc + curr.classTemplate.duration, 0)
  const hoursWorkedMonth = Math.round((totalSeconds / 3600) * 10) / 10

  // Mock KPIs for now, can be expanded
  const kpi = {
    classesToday: agendaRaw.length,
    upcomingClasses: upcomingClassesCount,
    hoursWorkedMonth, // Replaced studentsToday
  }

  const agenda = agendaRaw.map((c) => ({
    id: c.id,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
    className: c.classTemplate.name,
    hall: c.actualHall,
    occupancy: c._count.attendances,
    duration: c.classTemplate.duration,
  }))

  return { user, kpi, nextClass, agenda }
}

// ... imports ...
import { useTranslation } from '../contexts/LanguageContext'

// ... loader ...

export default function TrainerDashboard() {
  const { user, kpi, nextClass, agenda } = useLoaderData<typeof loader>()
  const { t } = useTranslation()

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
              {t('TRAINER_DASH_HELLO')}
              {user?.firstName}
            </ShinyText>
            <ShinyText variant="body" className="font-light text-lg opacity-80">
              {t('TRAINER_DASH_SUBTITLE')}
            </ShinyText>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content (2/3) */}
          <div className="space-y-8 lg:col-span-2">
            {/* Next Class Widget */}
            <section>
              <h2 className="mb-4 font-serif text-amber-400 text-xl tracking-wide">{t('TRAINER_NEXT_CLASS_TITLE')}</h2>
              <NextClassWidget nextClass={nextClass} userRole="TRAINER" />
            </section>

            {/* Agenda */}
            <section className="rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-serif text-amber-400 text-xl tracking-wide">
                {t('TRAINER_TODAYS_CLASSES_TITLE')}
              </h2>

              {agenda.length === 0 ? (
                <p className="text-gray-500 italic">{t('TRAINER_NO_CLASSES_TODAY')}</p>
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
                        <div className="font-serif text-2xl text-amber-100">{cls.occupancy}</div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider">
                          {t('TRAINER_CLASS_STUDENTS')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: KPIs (1/3) */}
          <div className="space-y-4">
            <h2 className="mb-4 font-serif text-amber-400 text-xl tracking-wide">{t('TRAINER_STATS_TITLE')}</h2>
            <KpiCard title={t('TRAINER_STAT_TODAY')} value={kpi.classesToday} />
            <KpiCard title={t('TRAINER_STAT_HOURS')} value={kpi.hoursWorkedMonth} />
            <KpiCard title={t('TRAINER_STAT_UPCOMING')} value={kpi.upcomingClasses} />
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
