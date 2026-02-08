import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import { prisma } from 'db'
import { useCallback, useMemo, useState } from 'react'
import { redirect, useFetcher, useLoaderData } from 'react-router'
import { EditTemplateModal } from '../components/configuration/EditTemplateModal'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { EditClassModal } from '../components/dashboard/EditClassModal'
import { ScheduleClassModal } from '../components/dashboard/ScheduleClassModal'
import { ConfirmModal, MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/admin.schedule'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'Master Schedule - Dance United Admin' }, { name: 'description', content: 'Manage studio schedule' }]
}

export const links: Route.LinksFunction = () => [
  { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.15/index.global.min.css' },
  { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.15/index.global.min.css' },
  { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.15/index.global.min.css' },
]

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'MANAGER') {
    return redirect('/')
  }

  // Fetch dance styles for the modal
  const danceStyles = await prisma.danceStyle.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  // Fetch class templates for scheduling
  const classTemplates = await prisma.classTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, duration: true, hallId: true, trainerId: true },
  })

  // Fetch potential trainers (Trainers & Managers)
  const trainers = await prisma.user.findMany({
    where: {
      role: { in: ['TRAINER', 'MANAGER'] },
      isActive: true,
    },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  // Fetch Dancers for Whitelist
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  // Limit history to last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Limit future to 6 months
  const sixMonthsAhead = new Date()
  sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6)

  // Fetch ALL classes for the calendar (Admin sees everything)
  const classes = await prisma.classInstance.findMany({
    where: {
      startTime: {
        gte: threeMonthsAgo,
        lte: sixMonthsAhead,
      },
    },
    include: {
      classTemplate: true,
      actualTrainer: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  const serializedClasses = classes.map((c) => ({
    ...c,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const events = classes.map((c) => ({
    id: c.id,
    title: `${c.classTemplate.name} (${c.actualTrainer.firstName})`,
    start: c.startTime.toISOString(),
    end: c.endTime.toISOString(),
    backgroundColor: c.status === 'CANCELLED' ? '#ef4444' : c.actualHall === 'HALL1' ? '#d97706' : '#92400e',
    borderColor: c.status === 'CANCELLED' ? '#b91c1c' : '#b45309',
    editable: c.status !== 'CANCELLED', // Prevent dragging cancelled classes
  }))

  return { user, danceStyles, classTemplates, events, classes: serializedClasses, trainers, users }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'MANAGER') {
    return redirect('/')
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  // --- REUSED TRAINER LOGIC (with adapted permissions if needed) ---
  // In a real app, I'd extract this logic to a shared service/helper

  // 1. Create Template
  // 1. Create Template (Unified Intent)
  if (intent === 'create_template') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const level = formData.get('level') as any
    const durationMinutes = parseInt(formData.get('duration') as string, 10) || 60
    const durationSeconds = durationMinutes * 60
    const styleId = formData.get('styleId') as string
    const hallId = formData.get('hallId') as any
    const isWhitelistEnabled = formData.get('isWhitelistEnabled') === 'on'
    const trainerId = formData.get('trainerId') as string

    // Parse whitelist
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

    if (!name || !styleId || !trainerId) {
      return { error: 'Name, Style and Default Trainer are required' }
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
          trainerId,
          whitelist: whitelistCreateData,
        },
      })
      return { success: true, intent: 'create_template' }
    } catch (error) {
      console.error('Failed to create class template:', error)
      return { error: 'Failed to create class template' }
    }
  }

  // 2. Schedule Class (Single or Recurring)
  if (intent === 'scheduleClass') {
    // ... (Same logic as trainer-dashboard, copy-paste adaptation)
    const classTemplateId = formData.get('classTemplateId') as string
    const startTimeStr = formData.get('startTime') as string
    const hall = formData.get('hall') as any

    const isRecurring = formData.get('isRecurring') === 'on'
    const recurrenceEndType = formData.get('recurrenceEndType') as string
    const recurrenceCount = parseInt(formData.get('recurrenceCount') as string) || 4
    const recurrenceEndDateStr = formData.get('recurrenceEndDate') as string

    if (!classTemplateId || !startTimeStr) return { error: 'Missing required fields' }

    try {
      const template = await prisma.classTemplate.findUnique({
        where: { id: classTemplateId },
        select: { duration: true, trainerId: true },
      })
      if (!template) return { error: 'Template not found' }

      const instancesData = []
      const baseStartTime = new Date(startTimeStr)

      let maxCount = 1

      if (isRecurring) {
        if (recurrenceEndType === 'count') maxCount = recurrenceCount
        else if (recurrenceEndType === 'date' && recurrenceEndDateStr) maxCount = 52 // safety cap
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
          actualTrainerId: template.trainerId, // Default to template owner
        })
      }

      await prisma.$transaction(instancesData.map((data) => prisma.classInstance.create({ data })))
      return { success: true, intent: 'scheduleClass' }
    } catch (error) {
      console.error('Schedule failed:', error)
      return { error: 'Schedule failed' }
    }
  }

  // 3. Update Class (Drag & Drop or Edit Modal)
  if (intent === 'updateClass' || intent === 'moveClass') {
    const classInstanceId = formData.get('classInstanceId') as string
    const startTimeStr = formData.get('startTime') as string
    // handle optional fields differently for 'moveClass' vs 'updateClass' full edit
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

      // Send Update Email if toggled
      const notifyUsers = formData.get('notifyUsers') === 'on'
      if (notifyUsers) {
        const updatedInstance = await prisma.classInstance.findUnique({
          where: { id: classInstanceId },
          include: {
            classTemplate: true,
            attendances: { include: { user: true } },
          },
        })

        if (updatedInstance && updatedInstance.attendances.length > 0) {
          const { sendClassUpdateEmail } = await import('../lib/email.server')

          const oldDate = new Date(instance.startTime).toLocaleString('pl-PL', {
            timeZone: 'Europe/Warsaw',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
          const newDate = newStartTime.toLocaleString('pl-PL', {
            timeZone: 'Europe/Warsaw',
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })

          const changes = []
          if (instance.startTime.getTime() !== newStartTime.getTime()) changes.push('Time changed')
          if (hall && instance.actualHall !== hall) changes.push(`Moved to ${hall}`)
          if (actualTrainerId && instance.actualTrainerId !== actualTrainerId) changes.push('Trainer changed')

          const changesStr = changes.join(', ')

          Promise.allSettled(
            updatedInstance.attendances.map((attendance) =>
              sendClassUpdateEmail(
                attendance.user.email,
                attendance.user.firstName,
                updatedInstance.classTemplate.name,
                oldDate,
                newDate,
                changesStr
              )
            )
          ).then((_results) => {})
        }
      }

      return { success: true, intent }
    } catch (error) {
      console.error('Update failed:', error)
      return { error: 'Update failed' }
    }
  }

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

  // 5. Cancel Class
  if (intent === 'cancelClass') {
    const classInstanceId = formData.get('classInstanceId') as string
    if (!classInstanceId) return { error: 'Missing required fields' }

    try {
      // 1. Fetch class details AND attendees before cancelling
      // (or after, but we need the list)
      const instance = await prisma.classInstance.findUnique({
        where: { id: classInstanceId },
        include: {
          classTemplate: true,
          attendances: {
            include: { user: true },
          },
        },
      })

      if (!instance) return { error: 'Class not found' }

      // 2. Mark as Cancelled
      await prisma.classInstance.update({
        where: { id: classInstanceId },
        data: { status: 'CANCELLED' },
      })

      // 3. Send Emails to all attendees (if toggle is on)
      const notifyUsers = formData.get('notifyUsers') === 'on'

      if (notifyUsers) {
        const { sendClassCancellationEmail } = await import('../lib/email.server')
        const dateStr = new Date(instance.startTime).toLocaleString('pl-PL', {
          timeZone: 'Europe/Warsaw',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        // Fire and forget
        Promise.allSettled(
          instance.attendances.map((attendance) =>
            sendClassCancellationEmail(
              attendance.user.email,
              attendance.user.firstName,
              instance.classTemplate.name,
              dateStr
            )
          )
        ).then((_results) => {})
      }

      return { success: true, intent: 'cancelClass' }
    } catch (_error) {
      console.error(_error)
      return { error: 'Cancel failed' }
    }
  }

  return null
}

// ... imports ...
import { useTranslation } from '../contexts/LanguageContext'

// ... meta/loader/action ...

export default function AdminSchedulePage() {
  const { danceStyles, classTemplates, events, classes, trainers, users } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const { t } = useTranslation()

  // ... state ...
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedClass, setSelectedClass] = useState<(typeof classes)[0] | null>(null)
  const [moveConfirmation, setMoveConfirmation] = useState<EventDropArg | null>(null)

  // ... useEffects (fetcher) ...
  if (fetcher.data?.success) {
    if (fetcher.data.intent === 'create_template' && isTemplateModalOpen) setIsTemplateModalOpen(false)
    if (fetcher.data.intent === 'scheduleClass' && isScheduleModalOpen) setIsScheduleModalOpen(false)
    if ((fetcher.data.intent === 'updateClass' || fetcher.data.intent === 'deleteClass') && isEditModalOpen)
      setIsEditModalOpen(false)
  }

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start)
    setIsScheduleModalOpen(true)
  }, [])

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      // ... Same logic ...
      const classId = clickInfo.event.id
      const foundClass = classes.find((c) => c.id === classId)
      if (foundClass) {
        setSelectedClass(foundClass)
        setIsEditModalOpen(true)
      }
    },
    [classes]
  )

  const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
    setMoveConfirmation(dropInfo)
  }, [])

  const calendarEvents = useMemo(() => events, [events])

  return (
    <div className="flex h-full flex-col text-amber-50">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <ShinyText as="h1" variant="title" className="font-serif text-3xl text-amber-400 tracking-wide">
            {t('ADMIN_SCHEDULE_TITLE')}
          </ShinyText>
          <p className="text-gray-400 text-sm">{t('ADMIN_SCHEDULE_SUBTITLE')}</p>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <MetallicButton
            onClick={() => {
              setSelectedDate(new Date())
              setIsScheduleModalOpen(true)
            }}
            className="flex-1 rounded-md border-2 px-4 py-2 text-sm md:flex-none"
          >
            {t('TRAINER_BTN_SCHEDULE')}
          </MetallicButton>
          <MetallicButton
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex-1 rounded-md border-2 px-4 py-2 text-sm md:flex-none"
          >
            {t('TRAINER_BTN_NEW_TEMPLATE')}
          </MetallicButton>
        </div>
      </div>
      {/* ... */}

      <div className="flex-1 rounded-lg border border-amber-900/20 bg-gray-900/20 p-4">
        <DashboardCalendar
          events={calendarEvents}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          editable={true} // Enable Drag & Drop
          onEventDrop={handleEventDrop}
        />
      </div>

      {/* Modals reused from Trainer Dashboard components */}
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

      <ConfirmModal
        isOpen={!!moveConfirmation}
        onClose={() => {
          moveConfirmation?.revert()
          setMoveConfirmation(null)
        }}
        onConfirm={() => {
          if (moveConfirmation) {
            const formData = new FormData()
            formData.append('intent', 'moveClass')
            formData.append('classInstanceId', moveConfirmation.event.id)
            formData.append('startTime', moveConfirmation.event.start?.toISOString() || '')
            formData.append('updateScope', 'single')
            fetcher.submit(formData, { method: 'post' })
            setMoveConfirmation(null)
          }
        }}
        title="Reschedule Class"
        description={`Are you sure you want to move "${moveConfirmation?.event.title}" to ${moveConfirmation?.event.start?.toLocaleString()}?`}
        confirmLabel="Move Class"
      />
    </div>
  )
}
