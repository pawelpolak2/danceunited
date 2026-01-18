import { prisma } from 'db'
import { redirect, useLoaderData } from 'react-router'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/admin.analytics'

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Analytics - Dance United Admin' },
    { name: 'description', content: 'Advanced statistics and reports' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'MANAGER') {
    return redirect('/')
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  // 1. Finance (Revenue Stream) - Last 6 Months
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(now.getMonth() - 5)
  sixMonthsAgo.setDate(1) // Start of month

  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: sixMonthsAgo },
      paymentStatus: 'COMPLETED',
    },
    select: { paymentDate: true, amount: true },
  })

  const revenueByMonth = new Map<string, number>()
  // Init months
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo)
    d.setMonth(sixMonthsAgo.getMonth() + i)
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    revenueByMonth.set(key, 0)
  }

  payments.forEach((p) => {
    const key = p.paymentDate.toLocaleString('default', { month: 'short', year: '2-digit' })
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + Number(p.amount))
    }
  })

  const revenueData = Array.from(revenueByMonth.entries()).map(([name, value]) => ({ name, value }))

  // 2. User Retention (New vs Recurring Users) - Approximation
  // Simplification: Count active passes vs expired passes or just New Users trend
  // Let's do New Users per week for last 8 weeks
  const eightWeeksAgo = new Date(now)
  eightWeeksAgo.setDate(now.getDate() - 56)

  const newUsers = await prisma.user.findMany({
    where: { createdAt: { gte: eightWeeksAgo }, role: 'DANCER' },
    select: { createdAt: true },
  })

  const retentionMap = new Map<string, number>()
  // Init weeks
  // This logic is simplified for demo
  newUsers.forEach((u) => {
    // Group by week start? Or just day?
    // Let's do daily for smoother line
    const key = u.createdAt.toISOString().split('T')[0]
    retentionMap.set(key, (retentionMap.get(key) || 0) + 1)
  })

  const retentionData = Array.from(retentionMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14) // Last 14 days active growth

  // 3. Trainer Ranking (By Attendance)
  const trainerStats = await prisma.classInstance.findMany({
    where: { startTime: { gte: thirtyDaysAgo } },
    include: {
      actualTrainer: true,
      _count: { select: { attendances: true } },
    },
  })

  const trainerMap = new Map<string, number>()
  trainerStats.forEach((c) => {
    const name = `${c.actualTrainer.firstName} ${c.actualTrainer.lastName}`
    trainerMap.set(name, (trainerMap.get(name) || 0) + c._count.attendances)
  })

  const trainerRanking = Array.from(trainerMap.entries())
    .map(([name, attendees]) => ({ name, attendees }))
    .sort((a, b) => b.attendees - a.attendees)
    .slice(0, 5)

  // 4. Occupancy Heatmap (Day of Week vs Time Slot)
  // We can aggregate this in JS.
  const occupancyMap = Array(7)
    .fill(0)
    .map(() => Array(24).fill(0)) // 7 days x 24 hours

  // We need more data for heatmap to look good, let's use last 30 days classes
  trainerStats.forEach((c) => {
    const day = c.startTime.getDay() // 0-6
    const hour = c.startTime.getHours() // 0-23
    occupancyMap[day][hour] += c._count.attendances
  })

  // Transform for Recharts Scatter or Heatmap (Recharts doesn't have native Heatmap, usually use Scatter or custom cells)
  // Or simpler: Average occupancy by Day of Week (Bar Chart)
  const dailyOccupancy = occupancyMap.map((hours, dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const total = hours.reduce((a, b) => a + b, 0)
    return { name: days[dayIndex], value: total }
  })

  return { user, revenueData, retentionData, trainerRanking, dailyOccupancy }
}

export default function AdminAnalyticsPage() {
  const { revenueData, retentionData, trainerRanking, dailyOccupancy } = useLoaderData<typeof loader>()

  return (
    <div className="text-amber-50">
      <div className="mb-8">
        <ShinyText as="h1" variant="title" className="mb-1 font-serif text-3xl text-amber-400 tracking-wide">
          Analytics & Reports
        </ShinyText>
        <p className="text-gray-400 text-sm">Deep dive into studio performance</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Revenue */}
        <div className="h-[400px] rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-serif text-amber-400 text-xl">Revenue Stream (6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} />
              <YAxis stroke="#666" tick={{ fill: '#888' }} tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', borderColor: '#b45309' }}
                itemStyle={{ color: '#fbbf24' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trainer Ranking */}
        <div className="h-[400px] rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-serif text-amber-400 text-xl">Top Trainers (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={trainerRanking} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis type="number" stroke="#666" hide />
              <YAxis type="category" dataKey="name" stroke="#666" width={120} tick={{ fill: '#ccc' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', borderColor: '#b45309' }}
                itemStyle={{ color: '#fbbf24' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="attendees" fill="#b45309" radius={[0, 4, 4, 0]} name="Attendees" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy by Day */}
        <div className="h-[400px] rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-serif text-amber-400 text-xl">Weekly Occupancy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyOccupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} />
              <YAxis stroke="#666" tick={{ fill: '#888' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', borderColor: '#b45309' }}
                itemStyle={{ color: '#fbbf24' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Total Attendees" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Retention Trend */}
        <div className="h-[400px] rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm">
          <h2 className="mb-6 font-serif text-amber-400 text-xl">New User Growth (Daily)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10 }}
                tickFormatter={(val) => val.slice(5)}
              />
              <YAxis stroke="#666" tick={{ fill: '#888' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', borderColor: '#b45309' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#fbbf24"
                strokeWidth={3}
                dot={{ r: 4, fill: '#fbbf24' }}
                activeDot={{ r: 6 }}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
