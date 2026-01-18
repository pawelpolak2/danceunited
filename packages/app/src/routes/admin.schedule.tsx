import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import { prisma } from 'db'
import { useState } from 'react'
import { redirect, useFetcher, useLoaderData } from 'react-router'
import { CreateClassTemplateModal } from '../components/dashboard/CreateClassTemplateModal'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { EditClassModal } from '../components/dashboard/EditClassModal'
import { ScheduleClassModal } from '../components/dashboard/ScheduleClassModal'
import { MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/admin.schedule'

export function meta(_args: Route.MetaArgs) {
  return [{ title: 'Master Schedule - Dance United Admin' }, { name: 'description', content: 'Manage studio schedule' }]
}

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
    select: { id: true, firstName: true, lastName: true },
  })

  // Fetch ALL classes for the calendar (Admin sees everything)
  const classes = await prisma.classInstance.findMany({
    include: {
      classTemplate: true,
      actualTrainer: true,
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
    backgroundColor: c.actualHall === 'HALL1' ? '#d97706' : '#92400e',
    borderColor: '#b45309',
    editable: true, // Allow drag & drop for admin
  }))

  return { user, danceStyles, classTemplates, events, classes: serializedClasses, trainers }
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
  if (intent === 'createClassTemplate') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const level = formData.get('level') as any
    const durationMinutes = parseInt(formData.get('duration') as string, 10) || 60
    const durationSeconds = durationMinutes * 60
    const styleId = formData.get('styleId') as string
    const hallId = formData.get('hallId') as any
    const isWhitelistEnabled = formData.get('isRestricted') === 'on'
    const trainerId = formData.get('trainerId') as string

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
        },
      })
      return { success: true, intent: 'createClassTemplate' }
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

  return null
}

export default function AdminSchedulePage() {
  const { danceStyles, classTemplates, events, classes, trainers } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedClass, setSelectedClass] = useState<(typeof classes)[0] | null>(null)

  // Close modals on success
  if (fetcher.data?.success) {
    if (fetcher.data.intent === 'createClassTemplate' && isTemplateModalOpen) setIsTemplateModalOpen(false)
    if (fetcher.data.intent === 'scheduleClass' && isScheduleModalOpen) setIsScheduleModalOpen(false)
    if ((fetcher.data.intent === 'updateClass' || fetcher.data.intent === 'deleteClass') && isEditModalOpen)
      setIsEditModalOpen(false)
  }

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start)
    setIsScheduleModalOpen(true)
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const classId = clickInfo.event.id
    const foundClass = classes.find((c) => c.id === classId)
    if (foundClass) {
      setSelectedClass(foundClass)
      setIsEditModalOpen(true)
    }
  }

  const handleEventDrop = (dropInfo: EventDropArg) => {
    // Confirm? Or just save.
    if (!confirm(`Move ${dropInfo.event.title} to ${dropInfo.event.start?.toLocaleString()}?`)) {
      dropInfo.revert()
      return
    }

    // Optimistic UI handled by fullcalendar, but we need to send data
    const formData = new FormData()
    formData.append('intent', 'moveClass')
    formData.append('classInstanceId', dropInfo.event.id)
    formData.append('startTime', dropInfo.event.start?.toISOString() || '')
    // We don't have recurrence scope prompt here easily, assuming single instance move for Drag&Drop for simplicity
    // Or we could trigger a modal. For now, SINGLE move.
    formData.append('updateScope', 'single')

    fetcher.submit(formData, { method: 'post' })
  }

  return (
    <div className="flex h-full flex-col text-amber-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <ShinyText as="h1" variant="title" className="mb-1 font-serif text-3xl text-amber-400 tracking-wide">
            Master Schedule
          </ShinyText>
          <p className="text-gray-400 text-sm">Manage all classes (Drag & Drop to reschedule)</p>
        </div>
        <div className="flex gap-3">
          <MetallicButton
            onClick={() => {
              setSelectedDate(new Date())
              setIsScheduleModalOpen(true)
            }}
            className="rounded-md border-2 px-4 py-2 text-sm"
          >
            + Schedule Class
          </MetallicButton>
          <MetallicButton
            onClick={() => setIsTemplateModalOpen(true)}
            className="rounded-md border-2 px-4 py-2 text-sm"
          >
            + New Template
          </MetallicButton>
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-amber-900/20 bg-gray-900/20 p-4">
        <DashboardCalendar
          events={events}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          editable={true} // Enable Drag & Drop
          onEventDrop={handleEventDrop}
        />
      </div>

      {/* Modals reused from Trainer Dashboard components */}
      <CreateClassTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        danceStyles={danceStyles}
        trainers={trainers}
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
