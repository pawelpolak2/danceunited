import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { prisma } from 'db'
import { useCallback, useMemo, useState } from 'react'
import { redirect, useFetcher, useLoaderData } from 'react-router'
import { EditTemplateModal } from '../components/configuration/EditTemplateModal'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { EditClassModal } from '../components/dashboard/EditClassModal'
import { ScheduleClassModal } from '../components/dashboard/ScheduleClassModal'
import { MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/trainer.schedule'

export function meta(_args: Route.MetaArgs) {
    return [
        { title: 'Trainer Schedule - Dance United' },
        { name: 'description', content: 'Manage your classes and schedule' },
    ]
}

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getCurrentUser(request)

    if (!user) {
        return redirect('/login')
    }

    // Only trainers can access this dashboard
    if (user.role !== 'TRAINER') {
        return redirect('/')
    }

    // Fetch dance styles for the modal
    const danceStyles = await prisma.danceStyle.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
    })

    // Trainers list for edit modal (user can only assign themselves but modal might need list if reused)
    // Filtering to just the current user or all trainers? 
    // Ideally "EditClassModal" might allow changing trainer if admin, but here we just need options.
    // We'll pass all trainers for compatibility with the component props, but logic restricts actions.
    const trainers = await prisma.user.findMany({
        where: { role: 'TRAINER', isActive: true },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { firstName: 'asc' },
    })

    // Fetch Dancers for Whitelist
    const users = await prisma.user.findMany({
        where: { isActive: true },
        orderBy: { firstName: 'asc' },
        select: { id: true, firstName: true, lastName: true, email: true },
    })

    // Fetch class templates for scheduling
    // Filter by trainerId to only show their own templates? or all? 
    // Let's assume they can schedule any template for now, or maybe just theirs?
    // Previous logic was "all active". Let's stick to that for flexibility unless requested otherwise.
    const classTemplates = await prisma.classTemplate.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, duration: true, hallId: true },
    })

    // Limit history to last 3 months
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const classes = await prisma.classInstance.findMany({
        where: {
            // Removed actualTrainerId filter to show all classes
            startTime: {
                gte: threeMonthsAgo,
            },
        },
        include: {
            classTemplate: true,
            actualTrainer: true // Include info to check ownership later/display name
        },
        orderBy: {
            startTime: 'asc',
        },
    })

    // Serialize classes for the client side (convert Dates to ISO strings)
    const serializedClasses = classes.map((c) => ({
        ...c,
        startTime: c.startTime.toISOString(),
        endTime: c.endTime.toISOString(),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }))

    const events = classes.map((c) => ({
        id: c.id,
        title: c.classTemplate.name,
        start: c.startTime.toISOString(),
        end: c.endTime.toISOString(),
        backgroundColor: c.actualHall === 'HALL1' ? '#d97706' : '#78350f', // Amber-600 vs Amber-900
        borderColor: '#b45309',
        extendedProps: {
            actualTrainerId: c.actualTrainerId,
            trainerName: c.actualTrainer?.firstName
        }
    }))

    return { user, danceStyles, classTemplates, events, classes: serializedClasses, trainers, users }
}

export async function action({ request }: Route.ActionArgs) {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'TRAINER') {
        return redirect('/')
    }

    const formData = await request.formData()
    const intent = formData.get('intent')

    if (intent === 'create_template') {
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        const level = formData.get('level') as any
        const durationMinutes = parseInt(formData.get('duration') as string, 10) || 60
        const durationSeconds = durationMinutes * 60
        const styleId = formData.get('styleId') as string
        const hallId = formData.get('hallId') as any
        const isWhitelistEnabled = formData.get('isWhitelistEnabled') === 'on'

        const whitelistUserIdsStr = formData.get('whitelistUserIds') as string
        let whitelistCreateData = {}

        if (isWhitelistEnabled && whitelistUserIdsStr) {
            try {
                const ids = JSON.parse(whitelistUserIdsStr) as string[]
                if (ids.length > 0) {
                    whitelistCreateData = {
                        create: ids.map((userId) => ({ userId })),
                    }
                }
            } catch (e) {
                console.error('Failed to parse whitelist IDs', e)
            }
        }

        if (!name || !styleId) {
            return { error: 'Name and Style are required' }
        }

        try {
            await prisma.classTemplate.create({
                data: {
                    name,
                    description,
                    level,
                    duration: durationSeconds,
                    styleId,
                    hallId,
                    isWhitelistEnabled,
                    trainerId: user.userId,
                    whitelist: whitelistCreateData,
                },
            })
            return { success: true, intent: 'create_template' }
        } catch (error) {
            console.error('Failed to create class template:', error)
            return { error: 'Failed to create class template' }
        }
    }

    if (intent === 'scheduleClass') {
        const classTemplateId = formData.get('classTemplateId') as string
        const startTimeStr = formData.get('startTime') as string
        const hall = formData.get('hall') as any

        const isRecurring = formData.get('isRecurring') === 'on'
        const recurrenceEndType = formData.get('recurrenceEndType') as string
        const recurrenceCount = parseInt(formData.get('recurrenceCount') as string) || 4
        const recurrenceEndDateStr = formData.get('recurrenceEndDate') as string

        if (!classTemplateId || !startTimeStr) {
            return { error: 'Missing required fields' }
        }

        try {
            const template = await prisma.classTemplate.findUnique({
                where: { id: classTemplateId },
                select: { duration: true },
            })

            if (!template) {
                return { error: 'Class template not found' }
            }

            const instancesData = []
            const baseStartTime = new Date(startTimeStr)

            let maxCount = 1

            if (isRecurring) {
                if (recurrenceEndType === 'count') {
                    maxCount = recurrenceCount
                } else if (recurrenceEndType === 'date' && recurrenceEndDateStr) {
                    maxCount = 52
                }
            }

            for (let i = 0; i < maxCount; i++) {
                const instanceStartTime = new Date(baseStartTime)
                instanceStartTime.setDate(baseStartTime.getDate() + i * 7)

                if (isRecurring && recurrenceEndType === 'date' && recurrenceEndDateStr) {
                    const endDate = new Date(recurrenceEndDateStr)
                    endDate.setHours(23, 59, 59)
                    if (instanceStartTime > endDate) break
                }

                const instanceEndTime = new Date(instanceStartTime.getTime() + template.duration * 1000)

                instancesData.push({
                    classTemplateId,
                    startTime: instanceStartTime,
                    endTime: instanceEndTime,
                    actualHall: hall,
                    actualTrainerId: user.userId,
                })
            }

            await prisma.$transaction(instancesData.map((data) => prisma.classInstance.create({ data })))

            return { success: true, intent: 'scheduleClass' }
        } catch (error) {
            console.error('Failed to schedule class:', error)
            return { error: 'Failed to schedule class' }
        }
    }

    if (intent === 'updateClass') {
        const classInstanceId = formData.get('classInstanceId') as string
        const startTimeStr = formData.get('startTime') as string
        const hall = formData.get('hall') as any

        if (!classInstanceId || !startTimeStr) {
            return { error: 'Missing required fields' }
        }

        try {
            const instance = await prisma.classInstance.findUnique({
                where: { id: classInstanceId },
                include: { classTemplate: { select: { duration: true } } },
            })

            if (!instance) {
                return { error: 'Class instance not found' }
            }

            if (instance.actualTrainerId !== user.userId) {
                return { error: 'Unauthorized to edit this class' }
            }

            const newStartTime = new Date(startTimeStr)
            const templateDuration = instance.classTemplate.duration

            const endTime = new Date(newStartTime.getTime() + templateDuration * 1000)
            await prisma.classInstance.update({
                where: { id: classInstanceId },
                data: {
                    startTime: newStartTime,
                    endTime,
                    actualHall: hall,
                },
            })

            return { success: true, intent: 'updateClass' }
        } catch (error) {
            console.error('Failed to update class:', error)
            return { error: 'Failed to update class' }
        }
    }

    if (intent === 'deleteClass') {
        const classInstanceId = formData.get('classInstanceId') as string

        if (!classInstanceId) {
            return { error: 'Missing required fields' }
        }

        try {
            const instance = await prisma.classInstance.findUnique({
                where: { id: classInstanceId },
            })

            if (!instance) {
                return { error: 'Class instance not found' }
            }

            if (instance.actualTrainerId !== user.userId) {
                return { error: 'Unauthorized to delete this class' }
            }

            await prisma.classInstance.delete({
                where: { id: classInstanceId },
            })

            return { success: true, intent: 'deleteClass' }
        } catch (error) {
            console.error('Failed to delete class:', error)
            return { error: 'Failed to delete class' }
        }
    }

    return null
}

export default function TrainerSchedulePage() {
    const { danceStyles, classTemplates, events, classes, trainers, users, user } = useLoaderData<typeof loader>()

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedClass, setSelectedClass] = useState<(typeof classes)[0] | null>(null)
    const [isMyClassesOnly, setIsMyClassesOnly] = useState(false)

    const fetcher = useFetcher()

    // Close modals on success
    if (fetcher.data?.success) {
        if (fetcher.data.intent === 'create_template' && isTemplateModalOpen) setIsTemplateModalOpen(false)
        if (fetcher.data.intent === 'scheduleClass' && isScheduleModalOpen) setIsScheduleModalOpen(false)
        if ((fetcher.data.intent === 'updateClass' || fetcher.data.intent === 'deleteClass') && isEditModalOpen) {
            setIsEditModalOpen(false)
        }
    }

    const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
        setSelectedDate(selectInfo.start)
        setIsScheduleModalOpen(true)
    }, [])

    const handleEventClick = useCallback(
        (clickInfo: EventClickArg) => {
            const classId = clickInfo.event.id
            const foundClass = classes.find((c) => c.id === classId)

            // Only allow editing if it's their own class
            // But they can view details? For now sticking to existing behavior:
            // If they click a class they don't own, maybe show a read-only modal or just do nothing?
            // Requirement says: "Trainer... without checking this option should see all classes (same as manager)"
            // Usually manager can edit everything. Trainer can probably only edit their own.
            // Let's check ownership before opening edit modal.

            if (foundClass) {
                if (foundClass.actualTrainerId === user.userId) {
                    setSelectedClass(foundClass)
                    setIsEditModalOpen(true)
                } else {
                    // Ideally show a "Details" modal (read-only)
                    alert(`Class: ${foundClass.classTemplate.name}\nTrainer: ${foundClass.actualTrainer?.firstName || 'Unknown'}\n(Read-only)`)
                }
            }
        },
        [classes, user.userId]
    )

    const filteredEvents = useMemo(() => {
        if (!isMyClassesOnly) return events
        return events.filter(e => e.extendedProps?.actualTrainerId === user.userId)
    }, [events, isMyClassesOnly, user.userId])

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                    <div className="flex flex-col gap-1">
                        <ShinyText as="h1" variant="title" className="text-4xl font-serif text-amber-400">
                            Schedule & Classes
                        </ShinyText>
                        <ShinyText variant="body" className="text-lg opacity-80">
                            Manage your availability and templates
                        </ShinyText>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto flex-wrap items-center">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-amber-500/20 bg-gray-900/50 px-4 py-2 hover:bg-gray-800 transition-colors mr-2">
                            <input
                                type="checkbox"
                                checked={isMyClassesOnly}
                                onChange={(e) => setIsMyClassesOnly(e.target.checked)}
                                className="h-4 w-4 rounded border-amber-500/50 bg-gray-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
                            />
                            <span className="text-sm font-medium text-amber-100">My Classes</span>
                        </label>

                        <MetallicButton
                            onClick={() => {
                                setSelectedDate(new Date())
                                setIsScheduleModalOpen(true)
                            }}
                            className="rounded-md border-2 px-4 py-2 text-sm flex-1 md:flex-none"
                        >
                            + Schedule Class
                        </MetallicButton>
                        <MetallicButton
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="rounded-md border-2 px-4 py-2 text-sm flex-1 md:flex-none"
                        >
                            + New Template
                        </MetallicButton>
                    </div>
                </div>

                <div className="rounded-lg border border-amber-900/20 bg-gray-900/30 p-1">
                    <DashboardCalendar
                        events={filteredEvents}
                        onDateSelect={handleDateSelect}
                        onEventClick={handleEventClick}
                        height="auto"
                    />
                </div>
            </div>

            <EditTemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                template={null}
                styles={danceStyles}
                trainers={trainers}
                users={users}
            />

            <ScheduleClassModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                templates={classTemplates}
                defaultDate={selectedDate}
            />

            <EditClassModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                classInstance={selectedClass}
                trainers={trainers}
            />
        </div>
    )
}
