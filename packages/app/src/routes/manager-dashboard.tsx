import { prisma } from 'db'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, redirect, useActionData, useLoaderData, useSearchParams } from 'react-router'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EditClassModal } from '../components/dashboard/EditClassModal'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/manager-dashboard'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Manager Dashboard - Dance United' },
    { name: 'description', content: 'Overview & Daily Operations' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  if (user.role !== 'MANAGER') {
    return redirect('/')
  }

  // Date logic based on ?range param
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || 'today' // 'today' | 'week' | 'month'

  const now = new Date()
  const startOfPeriod = new Date(now)
  const endOfPeriod = new Date(now)

  // Default: Today
  startOfPeriod.setHours(0, 0, 0, 0)
  endOfPeriod.setDate(now.getDate() + 1)
  endOfPeriod.setHours(0, 0, 0, 0)

  let previousStart = new Date(startOfPeriod)
  let previousEnd = new Date(startOfPeriod)

  if (range === 'week') {
    // Last 7 Days
    startOfPeriod.setDate(now.getDate() - 6) // Include today + 6 previous days
    previousStart.setDate(startOfPeriod.getDate() - 7)
    previousEnd = new Date(startOfPeriod)
  } else if (range === 'month') {
    // This Month
    startOfPeriod.setDate(1) // 1st of current month
    endOfPeriod.setMonth(now.getMonth() + 1)
    endOfPeriod.setDate(1) // 1st of next month

    previousStart = new Date(startOfPeriod)
    previousStart.setMonth(startOfPeriod.getMonth() - 1)
    previousEnd = new Date(startOfPeriod)
  } else {
    // Today (already set defaults)
    previousStart.setDate(startOfPeriod.getDate() - 1)
    previousEnd = new Date(startOfPeriod)
  }

  // 1. KPIs
  // Revenue (in selected period)
  const revenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      paymentDate: { gte: startOfPeriod, lt: endOfPeriod },
      paymentStatus: 'COMPLETED',
    },
  })
  const revenueValue = revenueResult._sum.amount ? Number(revenueResult._sum.amount) : 0

  // Revenue Previous Period (for percentage change)
  const revenuePrevResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      paymentDate: { gte: previousStart, lt: previousEnd },
      paymentStatus: 'COMPLETED',
    },
  })
  const revenuePrev = revenuePrevResult._sum.amount ? Number(revenuePrevResult._sum.amount) : 0

  const revenueChange =
    revenuePrev === 0 ? (revenueValue > 0 ? 100 : 0) : Math.round(((revenueValue - revenuePrev) / revenuePrev) * 100)

  // Active Subscriptions (Always current active)
  const activeSubscriptions = await prisma.userPurchase.count({
    where: { status: 'ACTIVE' },
  })

  // Signups/Bookings (in selected period)
  const periodSignups = await prisma.attendance.count({
    where: {
      class: {
        startTime: { gte: startOfPeriod, lt: endOfPeriod }, // attendances for classes in this range
      },
    },
  })

  // New Clients (Created in selected period)
  const newClients = await prisma.user.count({
    where: {
      createdAt: { gte: startOfPeriod, lt: endOfPeriod },
      role: 'DANCER',
    },
  })

  // 2. Agenda (Classes Today - Always show today's agenda regardless of filter)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(startOfToday.getDate() + 1)

  const agendaRaw = await prisma.classInstance.findMany({
    where: {
      startTime: { gte: startOfToday, lt: endOfToday },
    },
    include: {
      classTemplate: true,
      actualTrainer: true,
      _count: {
        select: { attendances: true },
      },
    },
    orderBy: { startTime: 'asc' },
  })

  // Map agenda for display, but keep raw for editing
  const agenda = agendaRaw.map((c) => ({
    id: c.id,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
    className: c.classTemplate.name,
    hall: c.actualHall,
    trainerName: `${c.actualTrainer.firstName} ${c.actualTrainer.lastName}`,
    occupancy: c._count.attendances,
    capacity: 20,
    raw: {
      ...c,
      startTime: c.startTime.toISOString(), // Serialize dates
      endTime: c.endTime.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    },
  }))

  // Fetch potential trainers (Trainers & Managers) for edit modal
  const trainers = await prisma.user.findMany({
    where: {
      role: { in: ['TRAINER', 'MANAGER'] },
      isActive: true,
    },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true },
  })

  // 3. Action Center (Always next 3 days)
  const threeDaysFromNow = new Date(now)
  threeDaysFromNow.setDate(now.getDate() + 3)

  const expiringPurchases = await prisma.userPurchase.findMany({
    where: {
      expiryDate: { gte: now, lte: threeDaysFromNow },
      status: 'ACTIVE',
    },
    include: { user: true, package: true },
    take: 5,
  })

  const alerts = expiringPurchases.map((p) => ({
    id: p.id,
    type: 'warning',
    message: `Pass for ${p.user.firstName} ${p.user.lastName} expires on ${p.expiryDate?.toISOString().split('T')[0]}`,
    link: `/users/${p.userId}`,
  }))

  // 4. Charts - Keeping the 30-day Trend for now as it gives context, or should it adapt?
  // "Revenue Trend (30 Days)" suggests fixed. If user selects "Today", a 1-point chart is useless.
  // I will leave charts as "30 Day Trend" for now regardless of filter, as filter mainly targets KPIs.

  // ... Chart data fetching logic same as before ...
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const paymentsLast30Days = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: thirtyDaysAgo },
      paymentStatus: 'COMPLETED',
    },
    select: { paymentDate: true, amount: true },
    orderBy: { paymentDate: 'asc' },
  })

  const revenueMap = new Map<string, number>()
  // Initialize map with 0s
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(thirtyDaysAgo.getDate() + i)
    const key = d.toISOString().split('T')[0]
    revenueMap.set(key, 0)
  }

  for (const p of paymentsLast30Days) {
    const dateKey = p.paymentDate.toISOString().split('T')[0]
    if (revenueMap.has(dateKey)) {
      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + Number(p.amount))
    }
  }

  const revenueChartData = Array.from(revenueMap.entries()).map(([date, amount]) => ({
    date: date.slice(5), // MM-DD
    amount,
  }))

  // Class Popularity (Attendances by Style for last 30 days)
  const popularityRaw = await prisma.classInstance.findMany({
    where: {
      startTime: { gte: thirtyDaysAgo },
    },
    include: {
      classTemplate: {
        include: { style: true },
      },
      _count: { select: { attendances: true } },
    },
  })

  const styleMap = new Map<string, number>()
  for (const c of popularityRaw) {
    const styleName = c.classTemplate.style.name
    const count = c._count.attendances
    styleMap.set(styleName, (styleMap.get(styleName) || 0) + count)
  }

  const popularityChartData = Array.from(styleMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5

  return {
    user,
    kpi: {
      revenueToday: revenueValue,
      revenueChange,
      activeSubscriptions,
      todaysSignups: periodSignups,
      newClients,
    },
    agenda,
    alerts,
    charts: {
      revenue: revenueChartData,
      popularity: popularityChartData,
    },
    range,
    trainers,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent') as string

  // 4. Delete Class
  if (intent === 'deleteClass') {
    const classInstanceId = formData.get('classInstanceId') as string

    if (!classInstanceId) return { error: 'Missing required fields' }

    try {
      const instance = await prisma.classInstance.findUnique({ where: { id: classInstanceId } })
      if (!instance) return { error: 'Not found' }

      await prisma.classInstance.delete({ where: { id: classInstanceId } })
      return { success: true, intent: 'deleteClass' }
    } catch (_error) {
      return { error: 'Delete failed' }
    }
  }

  // 3. Update Class (From Edit Modal)
  if (intent === 'updateClass') {
    const classInstanceId = formData.get('classInstanceId') as string
    const startTimeStr = formData.get('startTime') as string
    const hall = formData.get('hall') as any

    const actualTrainerId = formData.get('actualTrainerId') as string

    if (!classInstanceId || !startTimeStr) return { error: 'Missing required fields' }

    try {
      const instance = await prisma.classInstance.findUnique({
        where: { id: classInstanceId },
        include: { classTemplate: { select: { duration: true } } },
      })
      if (!instance) return { error: 'Instance not found' }

      const newStartTime = new Date(startTimeStr)
      const templateDuration = instance.classTemplate.duration

      const endTime = new Date(newStartTime.getTime() + templateDuration * 1000)
      await prisma.classInstance.update({
        where: { id: classInstanceId },
        data: {
          startTime: newStartTime,
          endTime,
          ...(hall && { actualHall: hall }),
          ...(actualTrainerId && { actualTrainerId }),
        },
      })
      return { success: true, intent: 'updateClass' }
    } catch (error) {
      console.error('Update failed:', error)
      return { error: 'Update failed' }
    }
  }

  return null
}

export default function ManagerDashboardPage() {
  const { user: _user, kpi, agenda, alerts, charts, range, trainers } = useLoaderData<typeof loader>()
  const [_searchParams, setSearchParams] = useSearchParams()
  const actionData = useActionData<{ success?: boolean; intent?: string }>()

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  // Close modal on success
  useEffect(() => {
    if (actionData?.success && (actionData.intent === 'updateClass' || actionData.intent === 'deleteClass')) {
      setIsEditModalOpen(false)
      setSelectedClassId(null)
    }
  }, [actionData])

  // Find the full class object for the modal when ID is selected
  // Note: 'agenda' from loader is mapped. We need the raw data structure for EditClassModal.
  // However, the loader returns mapped 'agenda'. EditClassModal needs 'ClassInstance' shape.
  // Solution: Map 'agenda' back or pass enough data?
  // EditClassModal expects: id, startTime, actualHall, actualTrainerId, notes, classTemplate...
  // The current 'agenda' map is simplified.
  // I should update the 'agenda' map in loader to include everything or return raw 'agendaRaw' as 'classes' alongside 'agenda'.
  // Or better: update 'agenda' in loader to just include the full raw object inside as 'raw'.

  // Let's rely on finding it from a new prop 'classes' passed from loader, OR
  // Just inject the required props into the `agenda` items in loader.
  // I'll update the loader to include `raw` property in agenda items. But I can't edit loader here easily without seeing line numbers.
  // I'll assume I update loader in next step or include it here if I edit enough lines.
  // Wait, replace_file_content is for one block. I should do loader edits separately if they are far apart.
  // They are far apart (lines 26-253 vs 255-472).
  // I will act on the request to "replace pencil" and "add modal" here. I'll need 'raw' data.
  // I will edit the loader in a separate call or try to match the mapped agenda if possible.
  // EditClassModal needs: { id, startTime, actualHall, actualTrainerId, notes, recurrenceGroupId, classTemplate: {name, duration} }
  // The current 'agenda' has: id, startTime, className, hall, trainerName, occupancy, capacity.
  // Missing: actualTrainerId, notes, recurrenceGroupId, duration.
  // I MUST update the loader.

  const selectedClass = agenda.find((c) => c.id === selectedClassId)?.raw || null

  // Function to set range
  const setRange = (newRange: string) => {
    setSearchParams((prev) => {
      prev.set('range', newRange)
      return prev
    })
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="text-amber-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col">
            <ShinyText as="h1" variant="title" className="mb-2 font-serif text-4xl text-amber-400 tracking-wide">
              MANAGER DASHBOARD
            </ShinyText>
            <ShinyText variant="body" className="font-light text-lg opacity-80">
              Overview & Daily Operations
            </ShinyText>
          </div>
          {/* Global Date Filter */}
          <div className="flex rounded-md border border-amber-500/30 bg-gray-900 p-1">
            <button
              type="button"
              onClick={() => setRange('today')}
              className={`rounded px-4 py-1 text-sm transition-colors ${range === 'today' ? 'bg-amber-500/20 text-amber-100 shadow-sm' : 'text-amber-100/60 hover:bg-white/5'}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setRange('week')}
              className={`rounded px-4 py-1 text-sm transition-colors ${range === 'week' ? 'bg-amber-500/20 text-amber-100 shadow-sm' : 'text-amber-100/60 hover:bg-white/5'}`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setRange('month')}
              className={`rounded px-4 py-1 text-sm transition-colors ${range === 'month' ? 'bg-amber-500/20 text-amber-100 shadow-sm' : 'text-amber-100/60 hover:bg-white/5'}`}
            >
              This Month
            </button>
          </div>
        </div>

        <div className="grid gap-8">
          {/* Top Cards (KPIs) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Daily Revenue"
              value={`${kpi.revenueToday} PLN`}
              subValue={`${kpi.revenueChange > 0 ? '+' : ''}${kpi.revenueChange}% vs yesterday`}
              highlight={kpi.revenueChange >= 0}
            />
            <KpiCard title="Active Members" value={kpi.activeSubscriptions} subValue="Active passes" />
            <KpiCard title="Today's Signups" value={kpi.todaysSignups} subValue="Total bookings" />
            <KpiCard title="New Clients" value={kpi.newClients} subValue="This week" />
          </div>

          {/* Middle Section (Split View) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Agenda (2/3) */}
            <div className="rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-serif text-amber-400 text-xl tracking-wide">Today's Agenda</h2>
                <span className="text-amber-500/60 text-xs uppercase tracking-widest">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-amber-500/10 border-b text-amber-500/50 text-xs">
                      <th className="px-2 py-2 font-light">TIME</th>
                      <th className="px-2 py-2 font-light">CLASS</th>
                      <th className="px-2 py-2 font-light">HALL</th>
                      <th className="px-2 py-2 font-light">TRAINER</th>
                      <th className="px-2 py-2 font-light">OCCUPANCY</th>
                      <th className="px-2 py-2 text-right font-light">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agenda.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                          No classes scheduled for today
                        </td>
                      </tr>
                    ) : (
                      agenda.map((item) => (
                        <tr key={item.id} className="border-white/5 border-b transition-colors hover:bg-white/5">
                          <td className="px-2 py-3 font-mono text-amber-100 text-sm">{formatDate(item.startTime)}</td>
                          <td className="px-2 py-3 font-medium text-amber-50">{item.className}</td>
                          <td className="px-2 py-3 text-amber-500/80 text-sm">{item.hall}</td>
                          <td className="px-2 py-3 text-gray-300 text-sm">{item.trainerName}</td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-800">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400"
                                  style={{ width: `${Math.min(100, (item.occupancy / item.capacity) * 100)}%` }}
                                />
                              </div>
                              <span className="text-gray-400 text-xs">
                                {item.occupancy}/{item.capacity}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClassId(item.id)
                                setIsEditModalOpen(true)
                              }}
                              className="p-1 text-amber-400 transition-colors hover:text-amber-300"
                              title="Edit Class"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Center (1/3) */}
            <div className="rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-serif text-amber-400 text-xl tracking-wide">Action Center</h2>

              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No pending actions.</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="group flex cursor-pointer items-start gap-3 rounded border border-amber-600/20 bg-amber-900/10 p-3 transition-colors hover:border-amber-600/40"
                    >
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-amber-100/90 text-sm leading-snug">{alert.message}</p>
                        <Link to={alert.link} className="mt-1 block text-amber-500 text-xs group-hover:underline">
                          Resolve
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section (Analytics) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <div className="h-[400px] rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-serif text-amber-400 text-xl tracking-wide">Revenue Trend (30 Days)</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#666"
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value} PLN`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #b45309', borderRadius: '4px' }}
                      itemStyle={{ color: '#fbbf24' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#fbbf24' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popularity Chart */}
            <div className="h-[400px] rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
              <h2 className="mb-6 font-serif text-amber-400 text-xl tracking-wide">Class Popularity</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={charts.popularity} margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#666"
                      width={100}
                      tick={{ fill: '#ccc', fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #b45309', borderRadius: '4px' }}
                      itemStyle={{ color: '#fbbf24' }}
                    />
                    <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Class Modal */}
      {selectedClass && (
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          classInstance={selectedClass}
          trainers={trainers}
        />
      )}
    </div>
  )
}

function KpiCard({
  title,
  value,
  subValue,
  highlight = true,
}: { title: string; value: string | number; subValue?: string; highlight?: boolean }) {
  return (
    <div className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border border-amber-500/30 bg-gray-900/60 p-5 transition-colors hover:border-amber-500/50">
      <div className="-mr-8 -mt-8 absolute top-0 right-0 h-16 w-16 rounded-full bg-amber-500/5 blur-xl transition-all group-hover:bg-amber-500/10" />

      <h3 className="z-10 font-medium text-gray-400 text-sm uppercase tracking-wider">{title}</h3>

      <div className="z-10 mt-2">
        <div className="font-bold font-serif text-3xl text-amber-100">{value}</div>
        {subValue && <div className={`mt-1 text-xs ${highlight ? 'text-green-400' : 'text-gray-500'}`}>{subValue}</div>}
      </div>
    </div>
  )
}
