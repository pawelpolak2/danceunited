import type { EventClickArg } from '@fullcalendar/core'
import { prisma } from 'db'
import { useCallback, useMemo, useState } from 'react'
import { redirect, useFetcher, useLoaderData } from 'react-router'
import { ClassDetailsModal } from '../components/dashboard/ClassDetailsModal'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/dancer.schedule'

export function meta(_args: Route.MetaArgs) {
    return [
        { title: 'Schedule - Dance United' },
        { name: 'description', content: 'View and sign up for classes' },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'DANCER') return redirect('/')

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2)

    // Fetch ALL classes for the calendar
    const classes = await prisma.classInstance.findMany({
        where: {
            startTime: { gte: threeMonthsAgo },
            status: { not: 'CANCELLED' }
        },
        include: {
            classTemplate: true,
            actualTrainer: true,
            attendances: {
                where: { userId: user.userId },
                select: { userId: true } // Optimization
            }
        },
        orderBy: { startTime: 'asc' }
    })

    const events = classes.map((c) => {
        const isAttending = c.attendances.length > 0
        return {
            id: c.id,
            title: c.classTemplate.name,
            start: c.startTime.toISOString(),
            end: c.endTime.toISOString(),
            // Green for attending, standard Hall colors otherwise
            backgroundColor: isAttending
                ? '#059669' // Emerald 600
                : (c.actualHall === 'HALL1' ? '#d97706' : '#78350f'),
            borderColor: isAttending ? '#047857' : '#b45309',
            extendedProps: {
                hall: c.actualHall,
                trainerName: `${c.actualTrainer.firstName} ${c.actualTrainer.lastName}`,
                duration: c.classTemplate.duration,
                isAttending
            }
        }
    })

    return { user, events }
}

export async function action({ request }: Route.ActionArgs) {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'DANCER') return redirect('/')

    const formData = await request.formData()
    const intent = formData.get('intent')
    const classId = formData.get('classId') as string

    if (!classId) return { error: 'Missing class ID' }

    try {
        if (intent === 'signup') {
            // Check if already signed up
            const existing = await prisma.attendance.findUnique({
                where: {
                    userId_classId: {
                        userId: user.userId,
                        classId
                    }
                }
            })

            if (existing) return { success: true, message: 'Already signed up' }

            await prisma.attendance.create({
                data: {
                    userId: user.userId,
                    classId
                }
            })
            return { success: true, intent: 'signup' }
        }

        if (intent === 'cancel') {
            await prisma.attendance.delete({
                where: {
                    userId_classId: {
                        userId: user.userId,
                        classId
                    }
                }
            })
            return { success: true, intent: 'cancel' }
        }
    } catch (error) {
        console.error('Action failed:', error)
        return { error: 'Action failed' }
    }

    return null
}

export default function DancerSchedulePage() {
    const { events } = useLoaderData<typeof loader>()
    const fetcher = useFetcher()

    const [isMyClassesOnly, setIsMyClassesOnly] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Close modal on successful fetcher completion
    if (fetcher.data?.success && isModalOpen && fetcher.state === 'idle') {
        // Optional: Close modal automatically or keep it open to show status?
        // Let's close it to feel responsive
        setIsModalOpen(false)
        setSelectedEvent(null)
    }

    const filteredEvents = useMemo(() => {
        if (!isMyClassesOnly) return events
        return events.filter(e => e.extendedProps.isAttending)
    }, [events, isMyClassesOnly])

    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        const event = events.find(e => e.id === clickInfo.event.id)
        if (event) {
            setSelectedEvent(event)
            setIsModalOpen(true)
        }
    }, [events])

    const handleSignUp = (classId: string) => {
        const formData = new FormData()
        formData.append('intent', 'signup')
        formData.append('classId', classId)
        fetcher.submit(formData, { method: 'post' })
    }

    const handleCancel = (classId: string) => {
        if (!confirm('Are you sure you want to cancel your reservation?')) return
        const formData = new FormData()
        formData.append('intent', 'cancel')
        formData.append('classId', classId)
        fetcher.submit(formData, { method: 'post' })
    }

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                    <div className="flex flex-col gap-1">
                        <ShinyText as="h1" variant="title" className="text-4xl font-serif text-amber-400">
                            Class Schedule
                        </ShinyText>
                        <ShinyText variant="body" className="text-lg opacity-80">
                            Browse classes and manage your bookings
                        </ShinyText>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-amber-500/20 bg-gray-900/50 px-4 py-2 hover:bg-gray-800 transition-colors">
                            <input
                                type="checkbox"
                                checked={isMyClassesOnly}
                                onChange={(e) => setIsMyClassesOnly(e.target.checked)}
                                className="h-4 w-4 rounded border-amber-500/50 bg-gray-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
                            />
                            <span className="text-sm font-medium text-amber-100">Show My Classes Only</span>
                        </label>
                    </div>
                </div>

                <div className="rounded-lg border border-amber-900/20 bg-gray-900/30 p-1">
                    <DashboardCalendar
                        events={filteredEvents}
                        onEventClick={handleEventClick}
                        height="auto"
                    />
                </div>
            </div>

            <ClassDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                classInstance={selectedEvent}
                isAttending={selectedEvent?.extendedProps?.isAttending}
                onSignUp={handleSignUp}
                onCancel={handleCancel}
                isProcessing={fetcher.state !== 'idle'}
            />
        </div>
    )
}
