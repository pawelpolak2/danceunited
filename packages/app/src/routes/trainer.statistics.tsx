import { prisma } from 'db'
import { redirect, useLoaderData } from 'react-router'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/trainer.statistics'

export function meta(_args: Route.MetaArgs) {
    return [
        { title: 'Trainer Statistics - Dance United' },
        { name: 'description', content: 'Performance and attendance statistics' },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getCurrentUser(request)

    if (!user || user.role !== 'TRAINER') {
        return redirect('/')
    }

    // Calculate dates
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Fetch trainer's classes in last 30 days
    const classesRaw = await prisma.classInstance.findMany({
        where: {
            actualTrainerId: user.userId,
            startTime: { gte: thirtyDaysAgo },
        },
        include: {
            classTemplate: { include: { style: true } },
            _count: { select: { attendances: true } },
        },
        orderBy: { startTime: 'asc' },
    })

    // 1. Attendance Trend (Area Chart)
    const attendanceMap = new Map<string, number>()
    // Init map with 0s
    for (let i = 0; i <= 30; i++) {
        const d = new Date(thirtyDaysAgo)
        d.setDate(thirtyDaysAgo.getDate() + i)
        const key = d.toISOString().split('T')[0].slice(5) // MM-DD
        attendanceMap.set(key, 0)
    }

    for (const c of classesRaw) {
        const key = c.startTime.toISOString().split('T')[0].slice(5) // MM-DD
        if (attendanceMap.has(key)) {
            attendanceMap.set(key, (attendanceMap.get(key) || 0) + c._count.attendances)
        }
    }

    const attendanceData = Array.from(attendanceMap.entries()).map(([date, count]) => ({
        date,
        students: count,
    }))

    // 2. Class Style Popularity (Bar Chart)
    const styleMap = new Map<string, number>()
    for (const c of classesRaw) {
        const styleName = c.classTemplate.style.name
        styleMap.set(styleName, (styleMap.get(styleName) || 0) + c._count.attendances)
    }

    const popularityData = Array.from(styleMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

    // 3. Stats Summary
    const totalStudents = classesRaw.reduce((acc, c) => acc + c._count.attendances, 0)
    const totalClasses = classesRaw.length
    const avgAttendance = totalClasses > 0 ? Math.round((totalStudents / totalClasses) * 10) / 10 : 0

    return { user, attendanceData, popularityData, summary: { totalStudents, totalClasses, avgAttendance } }
}

export default function TrainerStatisticsPage() {
    const { attendanceData, popularityData, summary } = useLoaderData<typeof loader>()

    return (
        <div className="text-amber-50">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <ShinyText as="h1" variant="title" className="mb-2 font-serif text-4xl text-amber-400 tracking-wide">
                        Performance Statistics
                    </ShinyText>
                    <ShinyText variant="body" className="font-light text-lg opacity-80">
                        Analytics for the last 30 days
                    </ShinyText>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
                    <StatCard title="Total Students" value={summary.totalStudents} />
                    <StatCard title="Classes Taught" value={summary.totalClasses} />
                    <StatCard title="Avg Class Size" value={summary.avgAttendance} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Attendance Trend */}
                    <div className="rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm h-[400px]">
                        <h2 className="mb-6 font-serif text-amber-400 text-xl tracking-wide">Attendance Trend</h2>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={attendanceData}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #b45309', borderRadius: '4px' }}
                                    itemStyle={{ color: '#fbbf24' }}
                                />
                                <Area type="monotone" dataKey="students" stroke="#d97706" fillOpacity={1} fill="url(#colorStudents)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Style Popularity */}
                    <div className="rounded-lg border border-amber-900/30 bg-gray-900/40 p-6 backdrop-blur-sm h-[400px]">
                        <h2 className="mb-6 font-serif text-amber-400 text-xl tracking-wide">Style Popularity</h2>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={popularityData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#666"
                                    tick={{ fill: '#ccc', fontSize: 13 }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #b45309', borderRadius: '4px' }}
                                    itemStyle={{ color: '#fbbf24' }}
                                />
                                <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} barSize={20}>
                                    {popularityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#d97706' : '#b45309'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="group relative border border-amber-500/20 bg-gray-900/60 p-5 rounded-lg overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {/* Optional Icon could go here */}
            </div>
            <div className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-2">{title}</div>
            <div className="text-3xl font-serif text-amber-100 font-bold">{value}</div>
        </div>
    )
}
